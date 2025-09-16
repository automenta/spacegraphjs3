import { test, expect } from '@playwright/test';

test('large graph visual test', async ({ page }) => {
  // Given
  await page.goto('/large-graph.html');

  // When
  // Wait for the graph to stabilize
  await page.waitForTimeout(5000); // Wait for 5 seconds for layout to settle

  // Then, check the screenshot
  await expect(page).toHaveScreenshot('large-graph-test.png');
});
