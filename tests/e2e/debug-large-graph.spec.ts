import { test, expect } from '@playwright/test';

test('debug large graph', async ({ page }) => {
  await page.goto('/large-graph.html');

  console.log('Page loaded, waiting for graph...');

  try {
    // Wait for the graph to be initialized
    await page.waitForFunction(() => (window as any).graph, { timeout: 15000 });
    console.log('Graph found!');

    // Get graph info
    const graphInfo = await page.evaluate(() => {
      const graph = (window as any).graph;
      return {
        exists: !!graph,
        hasState: !!graph.state,
        hasData: !!graph.state.data,
        nodesCount: graph.state.data?.nodes?.length || 0,
        edgesCount: graph.state.data?.edges?.length || 0,
      };
    });

    console.log('Graph info:', graphInfo);

    // Wait a bit more for stability
    await page.waitForTimeout(2000);

    // Check again
    const finalInfo = await page.evaluate(() => {
      const graph = (window as any).graph;
      return {
        nodesCount: graph.state.data?.nodes?.length || 0,
        firstNode: graph.state.data?.nodes?.[0],
      };
    });

    console.log('Final info:', finalInfo);

    expect(graphInfo.exists).toBe(true);
    expect(graphInfo.nodesCount).toBe(1000);
  } catch (error) {
    console.error('Error waiting for graph:', error);

    // Check what's actually on the page
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);

    // Check for any errors
    const errors = await page.evaluate(() => {
      const errors: string[] = [];
      const originalConsoleError = console.error;
      console.error = (msg: string) => {
        errors.push(msg);
        originalConsoleError(msg);
      };
      return errors;
    });

    console.log('Console errors:', errors);

    throw error;
  }
});
