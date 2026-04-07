# SlideWeave Chrome Extension - Setup Guide

## Prerequisites

1. **Node.js 18+** - Install from https://nodejs.org/
2. **Google Cloud Project** - For OAuth (optional for basic testing)
3. **Claude API Key** - Get from https://console.anthropic.com/
4. **Chrome Browser** - Latest version

## Step 1: Install Dependencies

```bash
cd extension
npm install
```

This will install:
- React and React DOM
- Webpack and build tools
- Babel for JSX compilation
- HTML and Copy plugins

## Step 2: Build the Extension

For development with watch mode:
```bash
npm run dev
```

For production build:
```bash
npm run build
```

The extension will be built to the `dist/` folder.

## Step 3: Google Cloud Setup (Optional for MVP)

**Note:** For testing the basic UI and Claude integration, you can skip this step. OAuth is only needed for actual Google Slides API calls.

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Google Slides API" and "Google Drive API"
4. Create OAuth 2.0 credentials:
   - Application type: Chrome Extension
   - Add your extension ID once loaded
5. Copy the Client ID
6. Update `manifest.json`:
   ```json
   "oauth2": {
     "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
     ...
   }
   ```

## Step 4: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. The extension should now appear in your extensions list

## Step 5: Get Your Extension ID

After loading:
1. Copy the Extension ID shown in `chrome://extensions/`
2. If using OAuth, add this ID to your Google Cloud Console:
   - Go to OAuth credentials
   - Add extension ID to authorized origins

## Step 6: Configure API Key

1. Open any Google Slides presentation
2. The SlideWeave sidebar should appear on the right
3. Enter your Claude API key in the settings
4. Click "Save API Key"

## Step 7: Test the Extension

1. Stay on the Google Slides page
2. Switch to the "Chat" tab in SlideWeave sidebar
3. Try a simple prompt: "make the title red"
4. The AI should generate a suggestion
5. Click "Apply" to execute it (requires OAuth setup)

## Troubleshooting

### Extension doesn't load
- Check console for errors: Right-click extension → Inspect
- Verify all dependencies installed: `npm install`
- Rebuild: `npm run build`

### Sidebar doesn't appear
- Check you're on a Google Slides presentation page
- Look for errors in page console (F12)
- Verify content script loaded: Check `chrome://extensions/` → Details → "Inspect views"

### API calls fail
- **Claude API**: Check API key is correct and has credits
- **Google OAuth**: Verify Client ID in manifest.json
- **CORS errors**: Make sure host_permissions are set in manifest

### Build errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## Development Workflow

1. Make code changes
2. Extension auto-rebuilds (if using `npm run dev`)
3. Go to `chrome://extensions/`
4. Click refresh icon on SlideWeave extension
5. Reload the Google Slides page
6. Test changes

## File Structure

```
extension/
├── dist/               # Built extension (load this in Chrome)
├── src/
│   ├── background/     # Service worker
│   ├── content/        # Injected scripts
│   ├── sidebar/        # React app
│   └── popup/          # Extension popup
├── manifest.json       # Extension config
└── webpack.config.js   # Build config
```

## Next Steps

- Add icons to `public/icons/` (optional)
- Customize styling in `src/sidebar/styles.css`
- Enhance AI prompts in `src/sidebar/utils/claude.js`
- Add more features to components

## Production Checklist

Before submitting to Chrome Web Store:

- [ ] Add proper icons (16px, 48px, 128px)
- [ ] Set correct OAuth Client ID
- [ ] Test on multiple Google Slides presentations
- [ ] Write privacy policy
- [ ] Create screenshots for store listing
- [ ] Build production version: `npm run build`
- [ ] Package: `npm run package`
- [ ] Test the .zip file by loading it

## Support

For issues:
1. Check browser console (F12)
2. Check extension console (Inspect service worker)
3. Review error messages in sidebar
4. Verify API keys are correct

Happy building!
