import React, { useState, useEffect } from 'react';
import MakeEditableView from './components/MakeEditableView';
import Settings from './components/Settings';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [presentationId, setPresentationId] = useState(null);
  const [currentSlideId, setCurrentSlideId] = useState(null);
  const [autoScan, setAutoScan] = useState(false);

  useEffect(() => {
    checkAuth();
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkAuth = async () => {
    const result = await chrome.storage.sync.get('claudeApiKey');
    setHasApiKey(!!result.claudeApiKey);
  };

  const handleMessage = (event) => {
    if (event.data.type === 'PRESENTATION_ID') {
      const { presentationId, slideId } = event.data.data;
      setPresentationId(presentationId);
      setCurrentSlideId(slideId);
    }
    if (event.data.type === 'SLIDE_CHANGED') {
      setCurrentSlideId(event.data.data.slideId);
    }
    if (event.data.type === 'TRIGGER_MAKE_EDITABLE') {
      setShowSettings(false);
      setAutoScan(true);
    }
  };

  if (!hasApiKey) {
    return <Settings onApiKeySaved={() => setHasApiKey(true)} />;
  }

  if (showSettings) {
    return (
      <div className="slideweave-app">
        <header className="app-header">
          <div className="logo">
            <span className="logo-icon">✨</span>
            <span className="logo-text">SlideWeave</span>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(false)} title="Back">
            ✕
          </button>
        </header>
        <Settings onApiKeySaved={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="slideweave-app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">SlideWeave</span>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)} title="Settings">
          ⚙️
        </button>
      </header>
      <main className="app-content">
        <MakeEditableView
          presentationId={presentationId}
          currentSlideId={currentSlideId}
          autoScan={autoScan}
          onAutoScanDone={() => setAutoScan(false)}
        />
      </main>
    </div>
  );
}

export default App;
