# SlideWeave - Quick Start (5 Minutes)

Get the Chrome extension running in 5 minutes!

## 1. Install Dependencies (1 min)

```bash
cd extension
npm install
```

## 2. Build Extension (30 sec)

```bash
npm run build
```

## 3. Load in Chrome (1 min)

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist/` folder
5. Extension loaded!

## 4. Open Google Slides (30 sec)

1. Go to https://slides.google.com
2. Open any presentation (or create new)
3. SlideWeave sidebar appears on the right!

## 5. Configure API Key (1 min)

1. Get Claude API key from https://console.anthropic.com/
2. In SlideWeave sidebar, enter your API key
3. Click "Save API Key"
4. You're ready!

## 6. Try It Out! (1 min)

1. In the Chat tab, type: "make the title red"
2. AI generates a suggestion
3. Click "Apply" (note: requires Google OAuth setup for actual changes)
4. Check the Suggestions tab to see all pending items

## That's It!

You now have a working Chrome extension that:
- Injects a sidebar into Google Slides
- Chats with Claude AI
- Generates suggestions for slide edits
- Manages pending suggestions

## Next Steps

**To actually apply changes to Google Slides:**

You'll need to set up Google OAuth (takes 5-10 minutes):

1. Go to https://console.cloud.google.com/
2. Create a project
3. Enable Google Slides API
4. Create OAuth 2.0 credentials
5. Update `manifest.json` with your Client ID

See `SETUP_GUIDE.md` for detailed instructions.

**For now, you can:**
- Test the UI and chat interface
- See AI generate suggestions
- Manage suggestions in the Suggestions tab
- Understand the full workflow

## Troubleshooting

**Sidebar doesn't appear?**
- Check you're on a Google Slides presentation page (not slides.google.com home)
- Open DevTools (F12) and look for errors
- Reload the extension at `chrome://extensions/`

**API errors?**
- Verify your Claude API key is correct
- Check you have credits at console.anthropic.com
- Look at browser console for specific errors

**Build errors?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Development Mode

For active development with auto-rebuild:

```bash
npm run dev
```

Then after making changes:
1. Go to `chrome://extensions/`
2. Click refresh icon on SlideWeave
3. Reload your Google Slides page

## File Structure

```
extension/
├── dist/              ← Load this in Chrome
├── src/
│   ├── sidebar/       ← React app
│   ├── background/    ← Service worker
│   └── content/       ← Sidebar injection
├── manifest.json      ← Extension config
└── package.json       ← Dependencies
```

## What You Built

This extension demonstrates:

- ✅ Chrome Extension Manifest V3
- ✅ React integration in extensions
- ✅ Content script injection
- ✅ Background service worker
- ✅ Chrome Storage API
- ✅ Claude AI integration
- ✅ Modern Chrome extension architecture

Perfect for your portfolio!

## Demo Ready

To show off your project:

1. Open Google Slides
2. Show the sidebar appearing
3. Chat with the AI
4. Generate suggestions
5. Show the Suggestions tab
6. Explain the workflow

The UX alone is impressive - even without OAuth, you've built a complete AI chat interface integrated into Google Slides!

---

**Pro tip:** Record a screen video showing the workflow. Even without OAuth, the suggestion workflow is novel and demonstrates great product thinking.
