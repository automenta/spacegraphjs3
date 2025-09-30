# SpaceGraphJS Screenshots

This directory contains visual documentation of the SpaceGraphJS library features.

## Generating Screenshots

To generate screenshots, you need to have the development server running and then execute the capture scripts:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run the capture scripts:
   ```bash
   node doc/screenshots/capture-all.js
   ```

   Or run individual scripts:
   ```bash
   node doc/screenshots/capture-screenshots.js
   node doc/screenshots/capture-basic-renderer-screenshots.js
   node doc/screenshots/capture-visible-rendering-demo.js
   ```

## Available Screenshots

### Main Demo Screenshots
- `comprehensive-demo.png` - Overview of the comprehensive demo
- `comprehensive-demo-closeup.png` - Close-up view of graph elements
- `element-actors-demo.png` - Different element actor types
- `edge-interaction-demo.png` - Edge interaction features
- `layout-engines-demo.png` - Various layout engines

### Element Type Screenshots
- `sphere-nodes.png` - Sphere nodes close-up
- `box-nodes.png` - Box nodes close-up
- `text-nodes.png` - Text nodes close-up
- `custom-nodes.png` - Custom geometry nodes close-up

### Edge Type Screenshots
- `edges-curves.png` - Different edge types (straight, curved, dashed)

### Basic Renderer Screenshots
- `basic-renderer-overview.png` - Overview with BasicRenderer enabled
- `basic-renderer-sphere-nodes.png` - Sphere nodes with BasicRenderer
- `basic-renderer-box-nodes.png` - Box nodes with BasicRenderer
- `basic-renderer-text-nodes.png` - Text nodes with BasicRenderer
- `basic-renderer-custom-nodes.png` - Custom nodes with BasicRenderer
- `basic-renderer-edges-curves.png` - Edges with BasicRenderer

### Visible Rendering Demo Screenshots
- `visible-rendering-demo.png` - Visible rendering demo without labels/menus

## Viewing Screenshots

Open `showcase.html` in a browser to view all screenshots in a gallery format.