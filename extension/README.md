# SlideWeave

A Chrome extension that converts Nano Banana Pro generated images into fully editable Google Slides.

## The Problem

Nano Banana Pro generates beautiful slide images, but they're raster images — you can't edit the text, colors, or layout. SlideWeave takes that image and reconstructs it as real, editable slide elements.

## How It Works

1. Generate an image in Google Slides using Nano Banana Pro
2. Right-click anywhere on the slide → **"Make Editable with SlideWeave"**
3. SlideWeave fetches the image, sends it to Claude Vision, and creates a new slide with editable text boxes, shapes, and colors
4. A refinement loop reviews the output and fixes overlapping or misaligned elements

The original image stays untouched. The new editable slide is appended to your deck.

## Setup

### 1. Build

```bash
cd extension
npm install
npm run build
```

### 2. Load in Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/dist/`

### 3. Configure

1. Open any Google Slides presentation — the SlideWeave panel appears on the right
2. Enter your [Claude API key](https://console.anthropic.com/) in Settings (⚙️)
3. Sign in with Google when prompted

## Stack

- Chrome Extension (Manifest V3)
- React 18 + Webpack
- Claude API — `claude-sonnet-4-6` with vision
- Google Slides API + Chrome Identity OAuth

## Caveats

- Slide reconstruction is approximate — complex gradients and layered effects won't convert perfectly
- Your Claude API key is stored locally in the browser and only sent to Anthropic's API
- Requires a Google account with Google Slides API access enabled in your Cloud project
