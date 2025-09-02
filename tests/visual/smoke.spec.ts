import { test, expect } from '@playwright/test';

test('basic scene rendering', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.waitForSelector('canvas');

  // A small delay to ensure Three.js has had time to render the scene.
  await page.waitForTimeout(1000);

  await expect(page).toHaveScreenshot('smoke-test.png', {
    maxDiffPixels: 100, // Allow for minor anti-aliasing differences
  });
});
