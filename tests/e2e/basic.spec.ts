import { expect, test } from './utils';

test('basic visual test', async ({ page }) => {
  await page.goto('/');

  // Wait for a bit to ensure everything has had a chance to render
  await page.waitForTimeout(2000);

  // Then, check the screenshot
  await expect(page).toHaveScreenshot('basic-test.png');
});
