import React, { useState, useEffect } from 'react';
import ChatView from './components/ChatView';
import SuggestionsView from './components/SuggestionsView';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [presentationId, setPresentationId] = useState(null);

  useEffect(() => {
    checkAuth();
    setupMessageListener();
  }, []);

  const checkAuth = async () => {
    try {
      const result = await chrome.storage.sync.get('claudeApiKey');
      setHasApiKey(!!result.claudeApiKey);
      console.log('[SlideWeave] API key status:', !!result.claudeApiKey);
    } catch (error) {
      console.error('[SlideWeave] Error checking auth:', error);
    }
  };

  const setupMessageListener = () => {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'PRESENTATION_ID') {
        setPresentationId(event.data.data);
        console.log('[SlideWeave] Presentation ID:', event.data.data);
      }
    });
  };

  if (!hasApiKey) {
    return <Settings onApiKeySaved={() => setHasApiKey(true)} />;
  }

  return (
    <div className="slideweave-app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">SlideWeave</span>
        </div>
        <button 
          className="settings-btn" 
          onClick={() => setActiveTab('settings')}
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      <nav className="tab-nav">
        <button 
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button 
          className={activeTab === 'suggestions' ? 'active' : ''}
          onClick={() => setActiveTab('suggestions')}
        >
          📋 Suggestions
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'chat' && <ChatView presentationId={presentationId} />}
        {activeTab === 'suggestions' && <SuggestionsView presentationId={presentationId} />}
        {activeTab === 'settings' && <Settings onApiKeySaved={() => {}} />}
      </main>
    </div>
  );
}

export default App;
