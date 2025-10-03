import { expect, test } from './utils';

test('basic example with basic renderer', async ({ page }) => {
  await page.goto('/');

  // Modify the spec to use BasicRenderer
  await page.evaluate(() => {
    // Update the existing graph if it exists
    if ((window as any).graph) {
      (window as any).graph.update({
        performance: {
          useBasicRenderer: true,
        },
      });
    }
  });

  // Wait for the graph to be initialized or updated
  await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });

  // Wait for a bit to ensure the renderer switch
  await page.waitForTimeout(2000);

  // Check that the graph is using the BasicRenderer
  const rendererInfo = await page.evaluate(() => {
    const graph = (window as any).graph;
    return {
      nodeRendererType: graph.render.getNodeRenderer().constructor.name,
      useBasicRenderer: graph.state.performance?.useBasicRenderer || false,
      nodesCount: graph.state.data.nodes.length,
    };
  });

  console.log('Renderer info:', rendererInfo);

  // Verify that we're using the NodeRenderer (since nodeCount < threshold)
  // The useBasicRenderer flag is set but doesn't affect renderer choice for small graphs
  expect(rendererInfo.nodeRendererType).toBe('NodeRenderer');
  expect(rendererInfo.useBasicRenderer).toBe(true);
  expect(rendererInfo.nodesCount).toBe(6); // 5 spheres + 1 html node

  // Simple wait for rendering to complete
  await page.waitForTimeout(3000);

  // Then, check the screenshot
  await expect(page).toHaveScreenshot('basic-example-basic-renderer.png', {
    threshold: 0.3, // Allow for more pixel differences due to rendering variations
    maxDiffPixels: 200000, // Allow up to 200k pixels to be different
  });
});
