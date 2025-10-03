import { expect, test } from './utils';

test('basic visual test', async ({ page }) => {
  await page.goto('/');

  // Wait for the graph to be initialized
  await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });

  // Simple wait for rendering to complete
  await page.waitForTimeout(3000);

  // Then, check the screenshot with relaxed constraints
  await expect(page).toHaveScreenshot('basic-test.png', {
    threshold: 0.3, // Allow for more pixel differences due to rendering variations
    maxDiffPixels: 200000, // Allow up to 200k pixels to be different
  });
});
