console.log('[SlideWeave Background] Service worker initialized');

// Google OAuth using Chrome Identity API
async function authenticateGoogle() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('[SlideWeave] OAuth error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log('[SlideWeave] OAuth token obtained');
        resolve(token);
      }
    });
  });
}

// Get current presentation data
async function getCurrentPresentation(presentationId) {
  try {
    const token = await authenticateGoogle();
    
    const response = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch presentation: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[SlideWeave] Presentation data loaded:', data.title);
    return data;
  } catch (error) {
    console.error('[SlideWeave] Error fetching presentation:', error);
    throw error;
  }
}

// Create a comment on the slide
async function createComment(presentationId, commentData) {
  try {
    const token = await authenticateGoogle();
    
    // Note: Google Slides API doesn't directly support comments
    // Comments are managed through Google Drive API
    // For MVP, we'll just log this action
    console.log('[SlideWeave] Would create comment:', commentData);
    
    return {
      success: true,
      commentId: `comment_${Date.now()}`
    };
  } catch (error) {
    console.error('[SlideWeave] Error creating comment:', error);
    throw error;
  }
}

// Apply changes to presentation using batchUpdate
async function batchUpdate(presentationId, requests) {
  try {
    const token = await authenticateGoogle();
    
    console.log('[SlideWeave] Applying batch update:', requests);
    
    const response = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update presentation');
    }

    const result = await response.json();
    console.log('[SlideWeave] Batch update successful');
    return result;
  } catch (error) {
    console.error('[SlideWeave] Batch update error:', error);
    throw error;
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[SlideWeave] Received message:', message.type);

  if (message.type === 'AUTHENTICATE') {
    authenticateGoogle()
      .then(token => sendResponse({ success: true, token }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_PRESENTATION') {
    getCurrentPresentation(message.data.presentationId)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'CREATE_COMMENT') {
    createComment(message.data.presentationId, message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'BATCH_UPDATE') {
    batchUpdate(message.data.presentationId, message.data.requests)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'SIDEBAR_MESSAGE') {
    // Handle messages from sidebar
    const { data } = message;
    
    if (data.type === 'APPLY_SUGGESTION') {
      batchUpdate(data.data.presentationId, data.data.apiCalls)
        .then(result => {
          // Send success back to content script
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'SUGGESTION_APPLIED',
                success: true
              });
            }
          });
          sendResponse({ success: true, result });
        })
        .catch(error => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'SUGGESTION_APPLIED',
                success: false,
                error: error.message
              });
            }
          });
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
  }
});

// Recursively extract image elements from a list of page elements (handles groups)
function extractImages(pageElements) {
  const images = [];
  for (const el of (pageElements || [])) {
    if (el.image) {
      images.push({
        objectId: el.objectId,
        contentUrl: el.image.contentUrl || el.image.sourceUrl,
        width: el.size?.width?.magnitude || 0,
        height: el.size?.height?.magnitude || 0,
        translateX: el.transform?.translateX || 0,
        translateY: el.transform?.translateY || 0
      });
    }
    // Images can be nested inside group elements
    if (el.elementGroup?.children) {
      images.push(...extractImages(el.elementGroup.children));
    }
  }
  return images;
}

// Get image elements from a specific slide, falling back to scanning all slides
async function getSlideImages(presentationId, slideId) {
  const presentation = await getCurrentPresentation(presentationId);
  const slides = presentation.slides || [];
  if (!slides.length) return [];

  // Try the current slide first (matched by ID or first slide)
  let currentSlide = slideId
    ? slides.find(s => s.objectId === slideId)
    : null;
  if (!currentSlide) currentSlide = slides[0];

  const imagesOnCurrent = extractImages(currentSlide?.pageElements);
  if (imagesOnCurrent.length > 0) return imagesOnCurrent;

  // Nothing found on current slide — scan all slides and return the first match
  console.log('[SlideWeave] No images on current slide, scanning all slides...');
  for (const slide of slides) {
    const imgs = extractImages(slide.pageElements);
    if (imgs.length > 0) {
      console.log(`[SlideWeave] Found images on slide ${slide.objectId}`);
      return imgs;
    }
  }

  return [];
}

// Fetch an image URL and return it as base64
async function fetchImageAsBase64(imageUrl) {
  // CDN URLs (googleusercontent.com) are signed — sending an Authorization header
  // triggers a CORS preflight that the CDN rejects. Fetch them without auth first.
  let response = await fetch(imageUrl);

  // If the CDN URL is stale/expired, fall back to fetching via the API with auth.
  if (!response.ok) {
    const token = await authenticateGoogle();
    response = await fetch(imageUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = response.headers.get('content-type') || 'image/jpeg';

  return { base64, mimeType };
}

// Strip fields that Claude sometimes hallucinates but don't exist in the Slides API
function sanitizeRequests(requests) {
  const VALID_PARAGRAPH_STYLE_FIELDS = new Set([
    'alignment', 'lineSpacing', 'spaceAbove', 'spaceBelow',
    'indentFirstLine', 'indentStart', 'indentEnd', 'direction', 'spacingMode'
  ]);

  return requests.map(req => {
    if (req.updateParagraphStyle?.style) {
      const cleaned = {};
      for (const [k, v] of Object.entries(req.updateParagraphStyle.style)) {
        if (VALID_PARAGRAPH_STYLE_FIELDS.has(k)) cleaned[k] = v;
      }
      const fields = Object.keys(cleaned).join(',') || 'alignment';
      return {
        ...req,
        updateParagraphStyle: { ...req.updateParagraphStyle, style: cleaned, fields }
      };
    }
    return req;
  });
}

// Create a new blank slide and apply the AI-generated element requests to it
async function createEditableSlide(presentationId, requests, title) {
  const token = await authenticateGoogle();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const url = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;

  // Step 1: create a blank slide with a known objectId
  const slideObjectId = `editable_${Date.now()}`;
  const createResp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      requests: [{
        createSlide: {
          objectId: slideObjectId,
          slideLayoutReference: { predefinedLayout: 'BLANK' }
        }
      }]
    })
  });

  if (!createResp.ok) {
    const err = await createResp.json();
    throw new Error(err.error?.message || 'Failed to create new slide');
  }

  // Step 2: replace SLIDE_ID placeholder, then make all element objectIds unique
  // so repeated runs don't clash with IDs already in the presentation.
  const suffix = `_${Date.now()}`;
  let json = JSON.stringify(requests).split('"SLIDE_ID"').join(`"${slideObjectId}"`);

  // Collect every objectId Claude generated (from createShape / createLine etc.)
  const idPattern = /"objectId"\s*:\s*"([^"]+)"/g;
  const elementIds = new Set();
  let m;
  while ((m = idPattern.exec(json)) !== null) {
    const id = m[1];
    if (id !== slideObjectId) elementIds.add(id);
  }

  // Replace every occurrence of those IDs in the JSON string
  for (const id of elementIds) {
    json = json.split(`"${id}"`).join(`"${id}${suffix}"`);
  }

  const populated = sanitizeRequests(JSON.parse(json));

  // Step 3: apply element creation requests
  const applyResp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requests: populated })
  });

  if (!applyResp.ok) {
    const err = await applyResp.json();
    throw new Error(err.error?.message || 'Failed to apply elements to new slide');
  }

  // Determine the slide's position in the deck
  const presentation = await getCurrentPresentation(presentationId);
  const slideIndex = presentation.slides.findIndex(s => s.objectId === slideObjectId);

  console.log(`[SlideWeave] Created editable slide "${title}" at index ${slideIndex}`);
  return { slideId: slideObjectId, slideIndex };
}

// Fetch a slide thumbnail and return it as base64
async function getSlideThumbnail(presentationId, slideId) {
  const token = await authenticateGoogle();

  // Ask the Slides API for a thumbnail URL
  const apiResp = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${slideId}/thumbnail?thumbnailProperties.mimeType=PNG&thumbnailProperties.thumbnailSize=LARGE`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!apiResp.ok) {
    const err = await apiResp.json();
    throw new Error(err.error?.message || 'Failed to get slide thumbnail');
  }

  const { contentUrl } = await apiResp.json();

  // The thumbnail URL is a signed CDN URL — fetch without auth
  const imgResp = await fetch(contentUrl);
  if (!imgResp.ok) throw new Error('Failed to download thumbnail image');

  const buffer = await imgResp.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);

  return { base64: btoa(binary), mimeType: 'image/png' };
}

// Get all page elements from a slide with their positions and text
async function getSlideElements(presentationId, slideId) {
  const presentation = await getCurrentPresentation(presentationId);
  const slide = presentation.slides.find(s => s.objectId === slideId);
  if (!slide) throw new Error('Slide not found');

  return (slide.pageElements || []).map(el => ({
    objectId: el.objectId,
    type: el.shape?.shapeType || (el.image ? 'IMAGE' : 'UNKNOWN'),
    text: el.shape?.text?.textElements?.map(t => t.textRun?.content || '').join('') || '',
    translateX: el.transform?.translateX || 0,
    translateY: el.transform?.translateY || 0,
    width: el.size?.width?.magnitude || 0,
    height: el.size?.height?.magnitude || 0
  }));
}

// ── New message handlers ────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SLIDE_IMAGES') {
    getSlideImages(message.data.presentationId, message.data.slideId)
      .then(images => sendResponse({ success: true, images }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'FETCH_IMAGE_AS_BASE64') {
    fetchImageAsBase64(message.data.imageUrl)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_SLIDE_THUMBNAIL') {
    getSlideThumbnail(message.data.presentationId, message.data.slideId)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_SLIDE_ELEMENTS') {
    getSlideElements(message.data.presentationId, message.data.slideId)
      .then(elements => sendResponse({ success: true, elements }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'CREATE_EDITABLE_SLIDE') {
    createEditableSlide(
      message.data.presentationId,
      message.data.requests,
      message.data.title
    )
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Context menu
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[SlideWeave] Extension installed/updated:', details.reason);
  chrome.contextMenus.create({
    id: 'slideweave-make-editable',
    title: 'Make Editable with SlideWeave',
    contexts: ['all'],
    documentUrlPatterns: ['https://docs.google.com/presentation/*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'slideweave-make-editable') {
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_MAKE_EDITABLE' });
  }
});
