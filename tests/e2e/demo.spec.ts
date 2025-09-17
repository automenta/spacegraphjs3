import { expect, test } from './utils';

test.describe('Advanced Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('demo.html');
    await page.waitForSelector('#container canvas');
    await page.waitForTimeout(2000); // Wait for layout to settle
  });

  test('should render the initial scene and UI panel correctly', async ({ page }) => {
    await expect(page).toHaveScreenshot('demo-initial-state.png');
  });

  test('should fly to the HTML node when its button is clicked', async ({ page }) => {
    await page.click('#btn-fly-to-html');
    await page.waitForTimeout(2000); // Wait for camera animation
    await expect(page).toHaveScreenshot('demo-fly-to-html.png');
  });

  test('should frame all nodes when its button is clicked', async ({ page }) => {
    await page.click('#btn-fly-to-html'); // Move camera first
    await page.waitForTimeout(2000);

    await page.click('#btn-frame-all');
    await page.waitForTimeout(2000); // Wait for camera animation
    await expect(page).toHaveScreenshot('demo-frame-all.png');
  });
});
