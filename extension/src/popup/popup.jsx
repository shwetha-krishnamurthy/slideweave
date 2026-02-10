import React from 'react';
import ReactDOM from 'react-dom/client';

function Popup() {
  return (
    <div style={{ padding: '1rem', width: '300px' }}>
      <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>✨ SlideWeave</h2>
      <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
        Open a Google Slides presentation to start using SlideWeave!
      </p>
      <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#999' }}>
        The sidebar will appear automatically when you open any presentation.
      </p>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Popup />);
