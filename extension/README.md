# SlideWeave Chrome Extension

AI-powered suggestions for Google Slides. AI suggests, you decide.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

Or for development with watch mode:
```bash
npm run dev
```

3. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

## Usage

1. Open any Google Slides presentation
2. Click the SlideWeave icon in your toolbar
3. Enter your Claude API key in settings
4. Start chatting with the AI to make slide suggestions!

## Architecture

- **Content Script**: Injects sidebar into Google Slides
- **Background Service Worker**: Handles OAuth and API calls
- **React Sidebar**: Chat interface and suggestions management
- **Chrome Storage**: Stores API keys and suggestions

## Development

The extension uses:
- React for UI
- Webpack for bundling
- Chrome Extension Manifest V3
- Chrome Identity API for OAuth
- Google Slides API
- Claude API for AI suggestions

## Building for Production

```bash
npm run build
npm run package
```

This creates a `.zip` file ready for Chrome Web Store submission.
