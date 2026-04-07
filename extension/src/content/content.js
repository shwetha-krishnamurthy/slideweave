// Inject sidebar into Google Slides
(function() {
  if (!window.location.pathname.includes('/presentation/')) {
    console.log('[SlideWeave] Not on a presentation page');
    return;
  }

  console.log('[SlideWeave] Initializing on presentation page');

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 700;
  const DEFAULT_WIDTH = 400;
  let sidebarWidth = DEFAULT_WIDTH;
  let collapsed = false;

  // ── Sidebar container ───────────────────────────────────────────────────
  const sidebar = document.createElement('div');
  sidebar.id = 'slideweave-sidebar';
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: ${sidebarWidth}px;
    height: 100vh;
    z-index: 9999;
    background: white;
    box-shadow: -2px 0 8px rgba(0,0,0,0.1);
    transition: transform 0.25s ease;
  `;

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `width: 100%; height: 100%; border: none;`;
  sidebar.appendChild(iframe);

  // ── Drag handle (resize only, hidden when collapsed) ────────────────────
  const handle = document.createElement('div');
  handle.id = 'slideweave-handle';
  handle.style.cssText = `
    position: fixed; top: 0; right: ${sidebarWidth}px;
    width: 6px; height: 100vh;
    z-index: 10000;
    cursor: ew-resize;
    background: transparent;
  `;
  handle.addEventListener('mouseenter', () => { handle.style.background = 'rgba(102,126,234,0.3)'; });
  handle.addEventListener('mouseleave', () => { handle.style.background = 'transparent'; });

  // ── Toggle tab (always visible, survives collapse) ──────────────────────
  // Uses max z-index so it's always above Google Slides' own UI.
  const toggleTab = document.createElement('button');
  toggleTab.id = 'slideweave-toggle-tab';
  toggleTab.title = 'Toggle SlideWeave';
  updateToggleTab();
  toggleTab.addEventListener('click', () => {
    collapsed = !collapsed;
    applyCollapse();
  });

  // ── Resize drag logic ───────────────────────────────────────────────────
  let resizing = false;
  let dragStartX = 0;
  let dragStartWidth = 0;

  handle.addEventListener('mousedown', (e) => {
    resizing = true;
    dragStartX = e.clientX;
    dragStartWidth = sidebarWidth;
    iframe.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    const delta = dragStartX - e.clientX;
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth + delta));
    setSidebarWidth(newWidth);
  });

  document.addEventListener('mouseup', () => {
    if (!resizing) return;
    resizing = false;
    iframe.style.pointerEvents = '';
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });

  // ── Helpers ─────────────────────────────────────────────────────────────
  function setSidebarWidth(w) {
    sidebarWidth = w;
    sidebar.style.width = w + 'px';
    document.body.style.marginRight = w + 'px';
    handle.style.right = w + 'px';
    updateToggleTab();
  }

  function updateToggleTab() {
    toggleTab.style.cssText = `
      position: fixed;
      top: 50%;
      right: ${collapsed ? 0 : sidebarWidth}px;
      transform: translateY(-50%);
      z-index: 2147483647;
      width: 18px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      color: white;
      font-size: 14px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: -2px 0 6px rgba(0,0,0,0.2);
      transition: right 0.25s ease, width 0.15s ease;
      padding: 0;
      line-height: 1;
    `;
    toggleTab.textContent = collapsed ? '‹' : '›';
  }

  function applyCollapse() {
    if (collapsed) {
      sidebar.style.transform = 'translateX(100%)';
      handle.style.display = 'none';
      document.body.style.marginRight = '0';
    } else {
      sidebar.style.transform = '';
      handle.style.display = '';
      document.body.style.marginRight = sidebarWidth + 'px';
    }
    updateToggleTab();
  }

  // ── Mount ───────────────────────────────────────────────────────────────
  document.body.appendChild(sidebar);
  document.body.appendChild(handle);
  document.body.appendChild(toggleTab);
  document.body.style.marginRight = sidebarWidth + 'px';
  document.body.style.transition = 'margin-right 0.25s ease';

  console.log('[SlideWeave] Sidebar injected');

  // ── Message bridge ──────────────────────────────────────────────────────
  window.addEventListener('message', (event) => {
    if (event.source !== iframe.contentWindow) return;
    chrome.runtime.sendMessage({ type: 'SIDEBAR_MESSAGE', data: event.data }, (response) => {
      if (response) {
        iframe.contentWindow.postMessage({ type: 'BACKGROUND_RESPONSE', data: response }, '*');
      }
    });
  });

  chrome.runtime.onMessage.addListener((message) => {
    iframe.contentWindow.postMessage(message, '*');
  });

  // ── Slide context ───────────────────────────────────────────────────────
  const getPresentationId = () => {
    const match = window.location.pathname.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const getCurrentSlideId = () => {
    const match = window.location.hash.match(/slide=id\.([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  iframe.addEventListener('load', () => {
    const presentationId = getPresentationId();
    if (!presentationId) return;
    iframe.contentWindow.postMessage({
      type: 'PRESENTATION_ID',
      data: { presentationId, slideId: getCurrentSlideId() }
    }, '*');
  });

  window.addEventListener('hashchange', () => {
    iframe.contentWindow.postMessage({
      type: 'SLIDE_CHANGED',
      data: { slideId: getCurrentSlideId() }
    }, '*');
  });
})();
