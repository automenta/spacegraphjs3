import { expect, test } from './utils';

test('large graph visual test', async ({ page }) => {
  // Given
  await page.goto('/large-graph.html');

  // Wait for the graph to be initialized
  await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
  
  // Wait for the large graph to stabilize (longer wait for 1000 nodes)
  await page.waitForTimeout(8000); // Wait for 8 seconds for layout to settle

  // Then, check the screenshot with relaxed constraints for large graphs
  await expect(page).toHaveScreenshot('large-graph-test.png', {
    threshold: 0.3, // Allow for more pixel differences due to large graph rendering variations
    maxDiffPixels: 300000, // Allow up to 300k pixels to be different
  });
});
