import { test, expect } from '@playwright/test';

/**
 * Visual Rendering Verification
 *
 * This test verifies that SpaceGraphJS actually renders correctly by checking
 * that existing working tests produce visual output.
 */

test.describe('Visual Rendering Verification', () => {
  test('Existing E2E Test Produces Visual Output', async ({ page }) => {
    // Use the basic e2e test that we know works
    await page.goto('/examples/basic-renderer-test.html');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // The existing e2e test should have created visual output
    // Check that we have a canvas element
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has proper dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(100);
    expect(canvasBox!.height).toBeGreaterThan(100);

    // Take a screenshot to verify visual content
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot.length).toBeGreaterThan(5000); // Should have substantial content

    // Check that the page has rendered content (not blank)
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Basic Renderer Test');

    console.log('✓ Basic renderer test page loads and has visual elements');
  });

  test('Screenshot Comparison Works', async ({ page }) => {
    await page.goto('/examples/basic-renderer-test.html');
    await page.waitForLoadState('networkidle');

    // Take a baseline screenshot
    const screenshot1 = await page.screenshot({ fullPage: true });

    // Wait a moment and take another screenshot
    await page.waitForTimeout(100);
    const screenshot2 = await page.screenshot({ fullPage: true });

    // Screenshots should be very similar (stable rendering)
    expect(screenshot1.length).toBe(screenshot2.length);

    // Both should have reasonable size
    expect(screenshot1.length).toBeGreaterThan(5000);
    expect(screenshot2.length).toBeGreaterThan(5000);

    console.log(`✓ Screenshots are stable (${screenshot1.length} bytes)`);
  });

  test('Canvas Contains Rendered Content', async ({ page }) => {
    await page.goto('/examples/basic-renderer-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for rendering

    // Check canvas content by examining pixel data
    const hasRenderedContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;

      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        // Get image data from a sample area
        const imageData = ctx.getImageData(10, 10, 50, 50);
        const data = imageData.data;

        // Check if there's any non-transparent content
        let hasContent = false;
        for (let i = 3; i < data.length; i += 4) { // Check alpha channel
          if (data[i] > 0) {
            hasContent = true;
            break;
          }
        }

        return hasContent;
      } catch (e) {
        return false;
      }
    });

    expect(hasRenderedContent).toBe(true);

    console.log('✓ Canvas contains rendered visual content');
  });

  test('Page Renders Without Critical Errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/examples/basic-renderer-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should not have JavaScript errors that prevent rendering
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') && // Ignore favicon errors
      !error.includes('manifest') && // Ignore manifest errors
      !error.includes('CORS') // Ignore CORS warnings
    );

    expect(criticalErrors.length).toBe(0);

    console.log(`✓ Page renders with ${errors.length} total messages, ${criticalErrors.length} critical errors`);
  });

  test('Visual Elements Are Properly Positioned', async ({ page }) => {
    await page.goto('/examples/basic-renderer-test.html');
    await page.waitForLoadState('networkidle');

    // Check that key elements exist and are positioned
    const container = page.locator('#container');
    await expect(container).toBeVisible();

    const containerBox = await container.boundingBox();
    expect(containerBox).not.toBeNull();
    expect(containerBox!.width).toBeGreaterThan(0);
    expect(containerBox!.height).toBeGreaterThan(0);

    // Canvas should be inside container
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Canvas should fill most of the container
    expect(canvasBox!.width).toBeGreaterThan(containerBox!.width * 0.8);
    expect(canvasBox!.height).toBeGreaterThan(containerBox!.height * 0.8);

    console.log('✓ Visual elements are properly positioned on the page');
  });
});