import React, { useState, useEffect } from 'react';
import SuggestionCard from './SuggestionCard';

function SuggestionsView({ presentationId }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const items = await chrome.storage.local.get(null);
      const pending = Object.entries(items)
        .filter(([key]) => key.startsWith('suggestion_'))
        .map(([key, value]) => ({ ...value, key }))
        .filter(s => s.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setSuggestions(pending);
    } catch (error) {
      console.error('[SlideWeave] Error loading suggestions:', error);
    }
  };

  const applySuggestion = async (suggestion) => {
    console.log('[SlideWeave] Applying suggestion:', suggestion);
    
    try {
      // Send to background to apply
      window.parent.postMessage({
        type: 'APPLY_SUGGESTION',
        data: {
          presentationId,
          apiCalls: suggestion.apiCalls
        }
      }, '*');

      // Update status
      await chrome.storage.local.set({
        [suggestion.key]: {
          ...suggestion,
          status: 'applied'
        }
      });

      loadSuggestions();
    } catch (error) {
      console.error('[SlideWeave] Apply error:', error);
      throw error;
    }
  };

  const dismissSuggestion = async (suggestion) => {
    await chrome.storage.local.set({
      [suggestion.key]: {
        ...suggestion,
        status: 'dismissed'
      }
    });

    loadSuggestions();
  };

  const applyAll = async () => {
    for (const suggestion of suggestions) {
      await applySuggestion(suggestion);
    }
  };

  const dismissAll = async () => {
    for (const suggestion of suggestions) {
      await dismissSuggestion(suggestion);
    }
  };

  return (
    <div className="suggestions-view">
      <div className="suggestions-header">
        <h2>Pending Suggestions</h2>
        {suggestions.length > 0 && (
          <div className="bulk-actions">
            <button onClick={applyAll}>Apply All</button>
            <button onClick={dismissAll}>Dismiss All</button>
          </div>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="empty-state">
          <p>No pending suggestions</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#9ca3af' }}>
            Chat with the AI to create suggestions!
          </p>
        </div>
      ) : (
        <div className="suggestions-list">
          {suggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.key}
              suggestion={suggestion}
              onApply={() => applySuggestion(suggestion)}
              onDismiss={() => dismissSuggestion(suggestion)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestionsView;
