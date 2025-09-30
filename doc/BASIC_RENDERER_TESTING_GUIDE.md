# Basic Renderer Testing Guide

This guide explains how to test the BasicRenderer to ensure all node types render correctly and the system functions properly.

## Manual Testing Procedure

1. Open `comprehensive-basic-renderer-test.html` in your browser
2. Verify that all node types are visible:
   - Sphere nodes (red, green)
   - Box nodes (yellow, magenta)
   - Text node (cyan)
   - Custom geometry node (orange)
   - HTML nodes (gray with white text)
3. Verify that all edge types are visible:
   - Straight edges
   - Curved edges
   - Dashed edges
4. Test interactions:
   - Hover over nodes and edges to verify highlighting
   - Click nodes and edges to verify selection
   - Try dragging nodes (if supported)

## Automated Testing

We have Playwright tests that automatically verify the BasicRenderer:

1. `tests/e2e/comprehensive-basic-renderer-test.spec.ts` - Tests the comprehensive basic renderer example
2. `tests/e2e/basic-renderer-test.spec.ts` - Tests the basic renderer example
3. Other tests that can be run with the BasicRenderer by setting `performance.useBasicRenderer: true`

## Debugging Blank Screens

If you encounter blank screens, check the following:

1. Browser console for errors
2. Verify that `useBasicRenderer: true` is set in the performance configuration
3. Check that the BasicRenderer is being instantiated correctly
4. Verify that all node types are handled in the BasicRenderer
5. Ensure CSS3D objects for HTML nodes are added to the correct scene

## Screenshot Verification

Run the screenshot capture scripts to visually verify the output:

```bash
node doc/screenshots/capture-comprehensive-basic-renderer.js
```

This will generate screenshots in the `doc/screenshots` directory that can be visually inspected.

## Common Issues and Solutions

1. **Blank HTML nodes**: Ensure the CSS3D scene is properly set up and HTML nodes are added to it
2. **Invisible text nodes**: Check that text nodes have appropriate geometry and materials
3. **Missing custom geometries**: Verify that custom geometries are properly created
4. **Color issues**: Ensure color parsing works correctly for all node types
5. **Interaction problems**: Check that raycasting works for all node types

## Performance Considerations

While the BasicRenderer is intended for debugging, it's still important to ensure it performs adequately:

1. Monitor frame rate in the browser
2. Check memory usage in browser dev tools
3. Verify that object disposal works correctly
4. Ensure no memory leaks occur during node creation/removal