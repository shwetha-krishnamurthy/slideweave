import React, { useState } from 'react';

function SuggestionCard({ suggestion, onApply, onDismiss }) {
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply();
    } catch (error) {
      console.error('[SlideWeave] Failed to apply:', error);
      alert('Failed to apply: ' + error.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="suggestion-card">
      <div className="suggestion-header">
        <span className="suggestion-icon">💡</span>
        <span className="suggestion-title">Suggested Change</span>
      </div>
      
      <p className="suggestion-description">
        {suggestion.description}
      </p>

      <div className="suggestion-actions">
        <button 
          className="apply-btn"
          onClick={handleApply}
          disabled={applying}
        >
          {applying ? 'Applying...' : '✓ Apply'}
        </button>
        <button 
          className="dismiss-btn"
          onClick={onDismiss}
          disabled={applying}
        >
          ✗ Dismiss
        </button>
      </div>
    </div>
  );
}

export default SuggestionCard;
