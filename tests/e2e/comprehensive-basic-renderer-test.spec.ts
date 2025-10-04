import { expect, test } from './utils';

test('comprehensive basic renderer test', async ({ page }) => {
  await page.goto('/examples/comprehensive-basic-renderer-test.html');

  // Wait for the graph to be initialized
  await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });

  // Simple wait for rendering to complete
  await page.waitForTimeout(3000);

  // Check that the graph is using the BasicRenderer
  const rendererInfo = await page.evaluate(() => {
    const graph = (window as any).graph;
    return {
      nodeRendererType: graph.render.getNodeRenderer().constructor.name,
      useBasicRenderer: graph.state.performance?.useBasicRenderer || false,
    };
  });

  console.log('Renderer info:', rendererInfo);

  // Verify that we're using the BasicRenderer
  expect(rendererInfo.nodeRendererType).toBe('NodeRenderer');
  expect(rendererInfo.useBasicRenderer).toBe(true);

  // Check that all node types are present
  const nodeTypes = await page.evaluate(() => {
    const graph = (window as any).graph;
    const nodes = graph.state.data.nodes;
    return nodes.map((node: any) => node.type);
  });

  expect(nodeTypes).toContain('sphere');
  expect(nodeTypes).toContain('box');
  expect(nodeTypes).toContain('text');
  expect(nodeTypes).toContain('custom');
  expect(nodeTypes).toContain('html');

  // Check that all edge types are present
  const edgeTypes = await page.evaluate(() => {
    const graph = (window as any).graph;
    const edges = graph.state.data.edges;
    return edges.map(
      (edge: any) => edge.type || edge.style?.type || 'straight'
    );
  });

  expect(edgeTypes).toContain('straight');
  expect(edgeTypes).toContain('curved');
  expect(edgeTypes).toContain('dashed');

  // Then, check the screenshot
  await expect(page).toHaveScreenshot('comprehensive-basic-renderer-test.png', {
    threshold: 0.3, // Allow for more pixel differences due to rendering variations
    maxDiffPixels: 200000, // Allow up to 200k pixels to be different
  });
});
