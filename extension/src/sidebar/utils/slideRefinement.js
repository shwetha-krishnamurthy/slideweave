const SLIDE_WIDTH_EMU = 9144000;
const SLIDE_HEIGHT_EMU = 5143500;
const MAX_CYCLES = 3;

async function getApiKey() {
  const result = await chrome.storage.sync.get('claudeApiKey');
  if (!result.claudeApiKey) throw new Error('API key not set.');
  return result.claudeApiKey;
}

// Ask Claude to look at the slide thumbnail and generate fix requests
async function critiqueSlide(imageBase64, mimeType, elements) {
  const apiKey = await getApiKey();

  const elementSummary = elements.map(el => ({
    objectId: el.objectId,
    type: el.type,
    text: el.text?.slice(0, 80) || null,
    x: Math.round(el.translateX),
    y: Math.round(el.translateY),
    width: Math.round(el.width),
    height: Math.round(el.height)
  }));

  const systemPrompt = `You are reviewing a Google Slides thumbnail to find and fix layout problems.

The slide canvas is ${SLIDE_WIDTH_EMU} EMUs wide × ${SLIDE_HEIGHT_EMU} EMUs tall.

Current elements on the slide (with objectIds and positions in EMUs):
${JSON.stringify(elementSummary, null, 2)}

Look at the thumbnail and identify ONLY these real problems:
1. Text visibly cut off or overflowing its container
2. Two elements clearly overlapping each other when they shouldn't
3. An element partially or fully outside the slide boundary
4. Text so large it clearly doesn't fit its box

For each problem found, generate a batchUpdate request to fix it using the EXACT objectId from the list above.
Prefer updatePageElementTransform (to move or resize) or updateTextStyle (to shrink font).

If the slide looks fine, return an empty requests array.

Return ONLY valid JSON — no markdown:
{
  "issues": ["describe each problem clearly, or empty array if none"],
  "requests": [ /* fix requests referencing real objectIds, or empty array */ ]
}

updatePageElementTransform format:
{
  "updatePageElementTransform": {
    "objectId": "el_title",
    "transform": { "scaleX": 1, "scaleY": 1, "translateX": 500000, "translateY": 300000, "unit": "EMU" },
    "applyMode": "ABSOLUTE"
  }
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 }
          },
          {
            type: 'text',
            text: 'Review this slide thumbnail. List any layout problems and generate fix requests. If it looks good, return empty arrays.'
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Claude API error during refinement');
  }

  const data = await response.json();
  const text = data.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { issues: [], requests: [] };

  return JSON.parse(match[0]);
}

// Main refinement loop — called after the slide is first created
export async function refineSlide(presentationId, slideId, onProgress) {
  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    onProgress({ cycle, total: MAX_CYCLES, phase: 'reviewing' });

    // Fetch thumbnail and current element positions in parallel
    const [thumbResp, elemResp] = await Promise.all([
      chrome.runtime.sendMessage({
        type: 'GET_SLIDE_THUMBNAIL',
        data: { presentationId, slideId }
      }),
      chrome.runtime.sendMessage({
        type: 'GET_SLIDE_ELEMENTS',
        data: { presentationId, slideId }
      })
    ]);

    if (!thumbResp.success) throw new Error(thumbResp.error);
    if (!elemResp.success) throw new Error(elemResp.error);

    const critique = await critiqueSlide(
      thumbResp.base64,
      thumbResp.mimeType,
      elemResp.elements
    );

    console.log(`[SlideWeave] Cycle ${cycle} issues:`, critique.issues);

    // Stop early if Claude finds nothing to fix
    if (!critique.requests || critique.requests.length === 0) {
      onProgress({ cycle, total: MAX_CYCLES, phase: 'clean', issues: [] });
      return { cycles: cycle, stoppedEarly: true };
    }

    onProgress({ cycle, total: MAX_CYCLES, phase: 'fixing', issues: critique.issues });

    const fixResp = await chrome.runtime.sendMessage({
      type: 'BATCH_UPDATE',
      data: { presentationId, requests: critique.requests }
    });

    if (!fixResp.success) {
      console.warn(`[SlideWeave] Fix failed on cycle ${cycle}:`, fixResp.error);
      // Don't throw — partial failure is OK, continue to next cycle
    }
  }

  onProgress({ cycle: MAX_CYCLES, total: MAX_CYCLES, phase: 'done' });
  return { cycles: MAX_CYCLES, stoppedEarly: false };
}
