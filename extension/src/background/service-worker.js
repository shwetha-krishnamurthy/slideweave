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

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[SlideWeave] Extension installed/updated:', details.reason);
});
