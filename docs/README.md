# SpaceGraphJS Documentation

This directory contains documentation and tools for SpaceGraphJS.

## Screenshots

The `docs/screenshots/` directory contains automatically generated screenshots of all SpaceGraphJS examples for documentation purposes.

### Generating Screenshots

To generate up-to-date screenshots:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, generate screenshots:
   ```bash
   npm run generate-screenshots
   ```

This will:
- Launch a headless browser using Playwright
- Navigate to each working example in `examples/`
- Capture screenshots of the base state
- Attempt to capture interaction states (hover, selection) where applicable
- Save all screenshots to `docs/screenshots/`

### Screenshot Files

Screenshots are named according to their example:
- `{example-name}.png` - Base state
- `{example-name}-hover.png` - Hover interaction state (if applicable)
- `{example-name}-selected.png` - Selection state (if applicable)

### Viewing Screenshots

Open `docs/screenshots/index.html` in a browser to view the screenshot gallery.

## Examples

All HTML examples have been consolidated in the `examples/` directory. The main `index.html` serves as an interactive playground where you can select and view any example in an embedded iframe.

### Available Examples

- **Element Actors Demo** - Different element actor types (spheres, boxes, text)
- **Edge Interaction** - Interactive edge demonstrations
- **Layout Engines Demo** - Various layout algorithms
- **Performance Optimizations** - Performance optimization demos
- **Comprehensive Demo** - All features combined
- **Large Graph** - Performance test with many nodes
- **HTML Node Demo** - HTML nodes in graphs
- **Basic Renderer Test** - Basic renderer functionality test
- **Instanced Interaction** - Instanced rendering interaction
- **Simple API Demo** - Simple API usage demonstration
- **Visible Rendering Demo** - Visible rendering features

## Development

When making changes to examples or adding new ones:

1. Add the example to `examples/`
2. Update the examples list in `index.html` if you want it in the playground
3. Update the examples list in `docs/generate-screenshots.ts` for documentation screenshots
4. Run `npm run generate-screenshots` to update the visual documentation

## Testing

The visual tests in `tests/visual/` use the same examples and can be run with:
```bash
npm run test:visual
```

These tests ensure the examples render correctly and can be used to validate changes.