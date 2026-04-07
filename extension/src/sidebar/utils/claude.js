export async function generateSuggestion(userPrompt, slideContext) {
  const apiKey = await getApiKey();
  
  const systemPrompt = `You are SlideWeave, an AI assistant for Google Slides.
You suggest edits but never make direct changes.

When the user requests a change:
1. Analyze the current slide context to find the correct element
2. Generate a natural language description
3. Generate Google Slides API calls using the ACTUAL objectId from the slide context

IMPORTANT: Use real objectIds from the slide context, NOT placeholder IDs!

Return ONLY valid JSON:
{
  "description": "Brief description of the change",
  "apiCalls": [
    // Array of Google Slides API request objects with REAL objectIds
  ]
}

Common operations:
- Change text color: updateTextStyle with foregroundColor
- Change background: updateShapeProperties with backgroundColor
- Update text: deleteText + insertText
- Move element: updatePageElementTransform

Example for "make the title red" (assuming objectId "g123abc" is the title):
{
  "description": "Change the title text color to red",
  "apiCalls": [
    {
      "updateTextStyle": {
        "objectId": "g123abc",
        "style": {
          "foregroundColor": {
            "opaqueColor": {
              "rgbColor": {
                "red": 1.0,
                "green": 0.0,
                "blue": 0.0
              }
            }
          }
        },
        "fields": "foregroundColor"
      }
    }
  ]
}`;

  const userMessage = `Current slide context:
${JSON.stringify(slideContext, null, 2)}

User request: "${userPrompt}"

Generate the suggestion as JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to call Claude API');
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response from AI');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[SlideWeave Claude] Error:', error);
    throw error;
  }
}

async function getApiKey() {
  const result = await chrome.storage.sync.get('claudeApiKey');
  if (!result.claudeApiKey) {
    throw new Error('API key not set. Please add your Claude API key in Settings.');
  }
  return result.claudeApiKey;
}
