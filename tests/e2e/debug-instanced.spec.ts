import { test, expect } from '@playwright/test';

test('debug instanced interaction', async ({ page }) => {
  await page.goto('/examples/instanced-interaction.html');

  // Wait for the graph to be initialized
  await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });

  // Check if graph exists and has expected structure
  const graphInfo = await page.evaluate(() => {
    const graph = (window as any).graph;
    return {
      exists: !!graph,
      hasState: !!graph.state,
      hasInteraction: !!graph.state.interaction,
      selectedElementIds: graph.state.interaction.selectedElementIds,
      nodesCount: graph.state.data.nodes.length,
      centerNode: graph.getElement('n-7-7'),
    };
  });

  console.log('Graph info:', graphInfo);

  // Try to click on the canvas
  const canvas = page.locator('canvas');
  const center = {
    x: page.viewportSize()!.width / 2,
    y: page.viewportSize()!.height / 2,
  };

  console.log('Clicking at center:', center);

  await canvas.click({
    position: center,
  });

  // Wait a bit
  await page.waitForTimeout(500);

  // Check state after click
  const afterClickInfo = await page.evaluate(() => {
    const graph = (window as any).graph;
    return {
      selectedElementIds: graph.state.interaction.selectedElementIds,
      hoveredElementId: graph.state.interaction.hoveredElementId,
    };
  });

  console.log('After click info:', afterClickInfo);

  // Try drag
  const initialPosition = await page.evaluate(
    () => (window as any).graph.getElement('n-7-7').position
  );

  console.log('Initial position:', initialPosition);

  await canvas.dragTo(canvas, {
    sourcePosition: center,
    targetPosition: { x: center.x + 50, y: center.y + 50 },
  });

  await page.waitForTimeout(500);

  const finalPosition = await page.evaluate(
    () => (window as any).graph.getElement('n-7-7').position
  );

  console.log('Final position:', finalPosition);

  expect(true).toBe(true); // Just to make the test pass
});
