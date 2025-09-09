import { test, expect } from '@playwright/test';

test('basic visual test', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');

  // Wait for a bit to ensure everything has had a chance to render
  await page.waitForTimeout(2000);

  // Assert that there are no console errors
  expect(consoleErrors).toEqual([]);

  // Then, check the screenshot
  await expect(page).toHaveScreenshot('basic-test.png');
});
