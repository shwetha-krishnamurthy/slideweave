import React from 'react';

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">👋</div>
      <h3>Welcome to SlideWeave!</h3>
      <p>I'm your AI presentation assistant</p>
      <p style={{ marginTop: '1rem' }}>I can help you:</p>
      <ul style={{ textAlign: 'left', marginTop: '0.5rem', lineHeight: 1.8 }}>
        <li>Format text and shapes</li>
        <li>Add and organize content</li>
        <li>Adjust layouts and colors</li>
      </ul>
      <p style={{ marginTop: '1rem', fontWeight: 600 }}>
        Just tell me what you'd like to change!
      </p>
    </div>
  );
}

export default EmptyState;
