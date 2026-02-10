import React, { useState, useEffect } from 'react';

function Settings({ onApiKeySaved }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const result = await chrome.storage.sync.get('claudeApiKey');
      if (result.claudeApiKey) {
        // Show masked version
        setApiKey(result.claudeApiKey.substring(0, 10) + '...');
      }
    } catch (error) {
      console.error('[SlideWeave] Error loading API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey || apiKey.includes('...')) {
      alert('Please enter a valid API key');
      return;
    }

    try {
      await chrome.storage.sync.set({ claudeApiKey: apiKey });
      setSaved(true);
      setTimeout(() => {
        if (onApiKeySaved) {
          onApiKeySaved();
        }
      }, 1000);
    } catch (error) {
      console.error('[SlideWeave] Error saving API key:', error);
      alert('Failed to save API key');
    }
  };

  if (loading) {
    return <div className="settings"><p>Loading...</p></div>;
  }

  return (
    <div className="settings">
      <h2>Settings</h2>

      <section className="settings-section">
        <h3>API Configuration</h3>
        <p>Enter your Claude API key to use SlideWeave (free tier)</p>
        
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api-..."
        />
        
        <button onClick={handleSave} disabled={!apiKey || saved}>
          {saved ? '✓ Saved' : 'Save API Key'}
        </button>

        <p className="help-text">
          Get your API key from{' '}
          <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
            console.anthropic.com
          </a>
        </p>
      </section>

      <section className="settings-section">
        <h3>How SlideWeave Works</h3>
        <p style={{ lineHeight: 1.6 }}>
          1. You describe the change you want<br />
          2. AI suggests the change via a comment<br />
          3. You review and apply or dismiss it<br />
          4. Your API key stays private in your browser
        </p>
      </section>
    </div>
  );
}

export default Settings;
