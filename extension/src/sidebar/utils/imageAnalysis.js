// Slide canvas dimensions (widescreen 16:9)
const SLIDE_WIDTH_EMU = 9144000;
const SLIDE_HEIGHT_EMU = 5143500;

async function getApiKey() {
  const result = await chrome.storage.sync.get('claudeApiKey');
  if (!result.claudeApiKey) {
    throw new Error('API key not set. Please add your Claude API key in Settings.');
  }
  return result.claudeApiKey;
}

export async function analyzeSlideImage(imageBase64, mimeType = 'image/jpeg') {
  const apiKey = await getApiKey();

  const systemPrompt = `You are an expert at analyzing slide images and reconstructing them as Google Slides API batchUpdate requests.

The slide canvas is ${SLIDE_WIDTH_EMU} EMUs wide × ${SLIDE_HEIGHT_EMU} EMUs tall (widescreen 16:9, equivalent to 10" × 5.625").

COORDINATE RULES:
- translateX / translateY = distance from the top-left corner of the slide to the top-left corner of the element (in EMUs)
- size.width / size.height = dimensions of the element (in EMUs)
- Estimate positions proportionally from the image. Example: element starting 10% from the left edge → translateX = ${Math.round(SLIDE_WIDTH_EMU * 0.1)}
- 1 inch = 914400 EMUs. Common font sizes: 12pt, 18pt, 24pt, 32pt, 40pt, 54pt, 72pt.

PLACEHOLDER RULE:
- Use the literal string "SLIDE_ID" as the value for pageObjectId in ALL element creation requests. It will be replaced with the real slide ID automatically.

ELEMENT TYPES TO GENERATE:
1. Slide background → updatePageProperties with pageBackgroundFill
2. Colored rectangle/banner → createShape (RECTANGLE) + updateShapeProperties for fill
3. Text → createShape (TEXT_BOX) → insertText → updateTextStyle → updateParagraphStyle
4. If a shape has both a fill AND text, create the shape as RECTANGLE, add updateShapeProperties for fill, then insertText + updateTextStyle for the text.

IMPORTANT: Do NOT generate requests for embedded photos/raster images — only backgrounds, shapes, and text.

CRITICAL — always generate at least a title and subtitle text box:
- If the image contains visible text, recreate it accurately.
- If the image is a photo with NO visible text (e.g. a food photo, landscape, product shot), you MUST still generate a useful slide by:
  1. Setting the background to the dominant color of the image
  2. Adding a dark or light semi-transparent rectangle banner at the bottom (~20% height)
  3. Adding a concise title text box describing the main subject (e.g. "Healthy Mediterranean Spread")
  4. Adding a short subtitle text box with 1-2 descriptive words or a tagline
  Choose text colors that contrast well with the background. Never output just a background with no text.

RESPONSE FORMAT — return ONLY valid JSON, no markdown:
{
  "title": "one-sentence description of the slide content",
  "requests": [ ...array of batchUpdate request objects... ]
}

EXAMPLE REQUESTS:

Background (solid color):
{"updatePageProperties": {"objectId": "SLIDE_ID", "pageProperties": {"pageBackgroundFill": {"solidFill": {"color": {"rgbColor": {"red": 0.08, "green": 0.08, "blue": 0.16}}}}}, "fields": "pageBackgroundFill"}}

Colored rectangle:
{"createShape": {"objectId": "el_banner", "shapeType": "RECTANGLE", "elementProperties": {"pageObjectId": "SLIDE_ID", "size": {"width": {"magnitude": 9144000, "unit": "EMU"}, "height": {"magnitude": 800000, "unit": "EMU"}}, "transform": {"scaleX": 1, "scaleY": 1, "translateX": 0, "translateY": 0, "unit": "EMU"}}}}
{"updateShapeProperties": {"objectId": "el_banner", "shapeProperties": {"shapeBackgroundFill": {"solidFill": {"color": {"rgbColor": {"red": 0.25, "green": 0.1, "blue": 0.55}}}}}, "fields": "shapeBackgroundFill"}}

Text box with styled text:
{"createShape": {"objectId": "el_title", "shapeType": "TEXT_BOX", "elementProperties": {"pageObjectId": "SLIDE_ID", "size": {"width": {"magnitude": 7315200, "unit": "EMU"}, "height": {"magnitude": 914400, "unit": "EMU"}}, "transform": {"scaleX": 1, "scaleY": 1, "translateX": 914400, "translateY": 600000, "unit": "EMU"}}}}
{"insertText": {"objectId": "el_title", "text": "Slide Title", "insertionIndex": 0}}
{"updateTextStyle": {"objectId": "el_title", "style": {"fontSize": {"magnitude": 54, "unit": "PT"}, "foregroundColor": {"opaqueColor": {"rgbColor": {"red": 1.0, "green": 1.0, "blue": 1.0}}}, "bold": true}, "fields": "fontSize,foregroundColor,bold", "textRange": {"type": "ALL"}}}
{"updateParagraphStyle": {"objectId": "el_title", "style": {"alignment": "CENTER"}, "fields": "alignment", "textRange": {"type": "ALL"}}}

FORBIDDEN — these fields do not exist in the Slides API and will cause errors:
- bulletPreset, listId, nestingLevel (never put these in updateParagraphStyle)
- Only valid updateParagraphStyle fields: alignment, lineSpacing, spaceAbove, spaceBelow, indentFirstLine, indentStart, indentEnd, direction, spacingMode`;

  const userMessage = `Analyze this slide image and generate batchUpdate requests to recreate it as editable Google Slides elements.

Focus on:
- The background color or gradient (use the dominant/average color if gradient)
- Every text element: its exact content, approximate position, size, color, and weight
- Colored shapes, banners, or decorative rectangles
- Visual hierarchy: which text is the headline vs. body vs. caption

Return the JSON now.`;

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
      max_tokens: 8096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: userMessage
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to call Claude API');
  }

  const data = await response.json();
  const content = data.content[0].text;

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response — no JSON found');
  }

  return JSON.parse(jsonMatch[0]);
}
