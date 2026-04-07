# SlideWeave

A Chrome extension that converts [Nano Banana Pro](https://blog.google/innovation-and-ai/products/nano-banana-pro/) generated images into fully editable Google Slides.

Nano Banana Pro generates beautiful slide images but they're raster — you can't edit the text, colors, or layout. SlideWeave reconstructs them as real editable elements using Claude Vision.

## Demo

1. Generate an image in Google Slides with Nano Banana Pro
2. Right-click → **"Make Editable with SlideWeave"**
3. A new slide is created with editable text boxes, shapes, and colors
4. Claude reviews its own output and self-corrects layout issues in up to 3 passes

## Stack

Chrome Extension (MV3) · React 18 · Claude Vision (`claude-sonnet-4-6`) · Google Slides API

## Setup

See [`extension/README.md`](extension/README.md) for build and install instructions.
