// Inject sidebar into Google Slides
(function() {
  // Check if we're on a Google Slides presentation page
  if (!window.location.pathname.includes('/presentation/')) {
    console.log('[SlideWeave] Not on a presentation page');
    return;
  }

  console.log('[SlideWeave] Initializing on presentation page');

  // Create sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'slideweave-sidebar';
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    z-index: 9999;
    background: white;
    box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  `;

  // Create iframe for isolated React app
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
  `;

  sidebar.appendChild(iframe);
  document.body.appendChild(sidebar);
  document.body.classList.add('slideweave-active');

  console.log('[SlideWeave] Sidebar injected');

  // Communication bridge between content script and sidebar
  window.addEventListener('message', (event) => {
    if (event.source !== iframe.contentWindow) return;
    
    console.log('[SlideWeave] Message from sidebar:', event.data);
    
    // Forward messages to background script
    chrome.runtime.sendMessage({
      type: 'SIDEBAR_MESSAGE',
      data: event.data
    }, (response) => {
      if (response) {
        // Send response back to sidebar
        iframe.contentWindow.postMessage({
          type: 'BACKGROUND_RESPONSE',
          data: response
        }, '*');
      }
    });
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[SlideWeave] Message from background:', message);
    // Forward to sidebar
    iframe.contentWindow.postMessage(message, '*');
  });

  // Extract presentation ID from URL
  const getPresentationId = () => {
    const match = window.location.pathname.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // Send presentation ID to sidebar when loaded
  iframe.addEventListener('load', () => {
    const presentationId = getPresentationId();
    if (presentationId) {
      iframe.contentWindow.postMessage({
        type: 'PRESENTATION_ID',
        data: presentationId
      }, '*');
    }
  });
})();
