# SlideWeave

**AI Collaborator for Google Slides - Chrome Extension**

SlideWeave is a Chrome extension that adds an AI assistant to Google Slides using a "suggesting mode" workflow. The AI never makes direct changes - instead, it creates suggestions that users can review and apply with one click.

## The Problem

Current AI slide tools have a trust problem:
- AI makes direct changes without review
- No structured way to approve or reject edits
- "Magic wand" UX that feels unpredictable

## The Solution

SlideWeave uses a **suggest-first workflow**:

1. You describe what you want to change
2. AI generates a suggestion (displayed as a comment)
3. You review the change with full context
4. Apply with one click or dismiss

**Key principle: AI suggests, humans decide.**

## Features

- 🤖 **AI-Powered Suggestions** - Natural language requests powered by Claude
- 👀 **Visual Review** - See exactly what will change before applying
- ✅ **One-Click Apply** - Apply or dismiss suggestions instantly
- 📋 **Suggestion Management** - Track all pending suggestions in one place
- 🔒 **Privacy-First** - Uses your own API key, all calls client-side
- 🎨 **Beautiful UI** - Clean sidebar that integrates seamlessly into Google Slides

## Quick Start

### 1. Install Dependencies

```bash
cd extension
npm install
```

### 2. Build Extension

```bash
npm run build
```

### 3. Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist/` folder

### 4. Use It!

1. Open any Google Slides presentation
2. SlideWeave sidebar appears on the right
3. Enter your Claude API key
4. Start chatting with the AI!

## Documentation

- **[Quick Start](extension/QUICKSTART.md)** - Get running in 5 minutes
- **[Setup Guide](extension/SETUP_GUIDE.md)** - Detailed setup instructions
- **[Testing Guide](extension/TESTING_GUIDE.md)** - Complete testing checklist
- **[Extension Summary](EXTENSION_SUMMARY.md)** - Implementation overview

## Architecture

```
SlideWeave Chrome Extension
├── Content Script    → Injects sidebar into Google Slides
├── React Sidebar     → Chat interface + suggestions management
├── Service Worker    → Handles OAuth + API calls
├── Claude AI         → Generates suggestions
└── Google Slides API → Applies changes to presentations
```

**Key Design Decisions:**

- **Client-side architecture**: User's API key never leaves their browser
- **Iframe isolation**: React app runs in isolated iframe for security
- **Chrome Storage**: Persistent state across sessions
- **Manifest V3**: Latest Chrome extension standard

## Tech Stack

- **Chrome Extension** (Manifest V3)
- **React 18** (with hooks)
- **Webpack** (bundling)
- **Claude API** (AI suggestions)
- **Google Slides API** (slide manipulation)
- **Chrome Identity API** (OAuth)

## Screenshots

_Coming soon - record a demo video showing the workflow_

## Development

For active development with auto-rebuild:

```bash
cd extension
npm run dev
```

Then:
1. Make code changes
2. Extension auto-rebuilds
3. Refresh at `chrome://extensions/`
4. Reload your Google Slides page

## Project Status

✅ **MVP Complete** - All core features implemented

- [x] Sidebar injection into Google Slides
- [x] React app with chat interface
- [x] Claude AI integration
- [x] Suggestion workflow (apply/dismiss)
- [x] Suggestions management tab
- [x] Settings panel for API key
- [x] Professional UI design
- [x] Error handling

## Future Enhancements

- 🌳 **Multi-slide support** - Work across multiple slides
- 📝 **Comment integration** - Actual Google Slides comments
- ⌨️ **Keyboard shortcuts** - Quick actions
- 🔄 **Undo/redo** - Revert changes
- 📋 **Templates** - Pre-built suggestion templates
- 👥 **Team features** - Shared suggestions

## License

MIT License - see [LICENSE](LICENSE) file

## Author

Built as a portfolio project demonstrating:
- Chrome extension development
- React + modern JavaScript
- AI integration (Claude API)
- UX design (suggesting mode workflow)
- Product thinking (AI trust problem)

---

**SlideWeave**: Because AI should suggest, not dictate.
