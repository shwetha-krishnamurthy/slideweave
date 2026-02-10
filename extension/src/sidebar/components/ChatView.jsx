import React, { useState } from 'react';
import Message from './Message';
import SuggestionCard from './SuggestionCard';
import EmptyState from './EmptyState';
import { generateSuggestion } from '../utils/claude';

function ChatView({ presentationId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const getSlideContext = async () => {
    try {
      // Request presentation data from background script
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PRESENTATION',
        data: { presentationId }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get presentation data');
      }

      const presentation = response.data;
      
      // Get the first slide (or current slide - for now we'll use first)
      const currentSlide = presentation.slides?.[0];
      
      if (!currentSlide) {
        return { presentationId, elements: [] };
      }

      // Extract elements with their IDs
      const elements = (currentSlide.pageElements || []).map(element => ({
        objectId: element.objectId,
        type: element.shape?.shapeType || 'unknown',
        text: element.shape?.text?.textElements?.map(t => t.textRun?.content).join('') || '',
        placeholder: element.shape?.placeholder?.type || null
      }));

      return {
        presentationId,
        slideId: currentSlide.objectId,
        elements,
        // Include the full slide for Claude to understand structure
        slide: currentSlide
      };
    } catch (error) {
      console.error('[SlideWeave] Error getting slide context:', error);
      // Return basic context if we can't fetch
      return { presentationId, elements: [] };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userPrompt = input.trim();
    setInput('');

    // Add user message
    addMessage({ role: 'user', content: userPrompt });

    setLoading(true);

    try {
      // Get current slide context
      const slideContext = await getSlideContext();

      // Generate suggestion from Claude
      const suggestion = await generateSuggestion(userPrompt, slideContext);

      console.log('[SlideWeave] Suggestion generated:', suggestion);

      // Store suggestion
      const suggestionId = `suggestion_${Date.now()}`;
      await chrome.storage.local.set({
        [suggestionId]: {
          id: suggestionId,
          description: suggestion.description,
          apiCalls: suggestion.apiCalls || [],
          status: 'pending',
          prompt: userPrompt,
          createdAt: new Date().toISOString()
        }
      });

      // Add assistant message with suggestion
      addMessage({
        role: 'assistant',
        content: `✓ Suggestion created: ${suggestion.description}`,
        suggestion: {
          ...suggestion,
          id: suggestionId
        }
      });

    } catch (error) {
      console.error('[SlideWeave] Error:', error);
      addMessage({
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (suggestion) => {
    console.log('[SlideWeave] Applying suggestion:', suggestion);
    
    try {
      // Send message to background script to apply changes
      await new Promise((resolve, reject) => {
        window.parent.postMessage({
          type: 'APPLY_SUGGESTION',
          data: {
            presentationId,
            apiCalls: suggestion.apiCalls
          }
        }, '*');

        // Mark as applied
        chrome.storage.local.get(suggestion.id, async (result) => {
          if (result[suggestion.id]) {
            await chrome.storage.local.set({
              [suggestion.id]: {
                ...result[suggestion.id],
                status: 'applied'
              }
            });
          }
        });

        resolve();
      });

      addMessage({
        role: 'assistant',
        content: '✓ Change applied successfully!'
      });
    } catch (error) {
      console.error('[SlideWeave] Apply error:', error);
      throw error;
    }
  };

  const handleDismiss = async (suggestion) => {
    console.log('[SlideWeave] Dismissing suggestion:', suggestion);
    
    // Mark as dismissed
    const result = await chrome.storage.local.get(suggestion.id);
    if (result[suggestion.id]) {
      await chrome.storage.local.set({
        [suggestion.id]: {
          ...result[suggestion.id],
          status: 'dismissed'
        }
      });
    }

    addMessage({
      role: 'assistant',
      content: 'Change dismissed'
    });
  };

  return (
    <div className="chat-view">
      <div className="messages">
        {messages.length === 0 && <EmptyState />}
        
        {messages.map((msg, i) => (
          <div key={i}>
            <Message message={msg} />
            {msg.suggestion && (
              <SuggestionCard
                suggestion={msg.suggestion}
                onApply={() => handleApply(msg.suggestion)}
                onDismiss={() => handleDismiss(msg.suggestion)}
              />
            )}
          </div>
        ))}

        {loading && (
          <div className="loading-indicator">
            <span className="spinner">🤔</span> Analyzing...
          </div>
        )}
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to change..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          ↑
        </button>
      </form>
    </div>
  );
}

export default ChatView;
