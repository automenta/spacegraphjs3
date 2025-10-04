import { test, expect } from '@playwright/test';

/**
 * Visual Sanity Test
 *
 * Tests that we can render a simple red square and verify its visual properties.
 * This establishes the foundation for more complex visual testing.
 */

test.describe('Visual Sanity Test', () => {
  test('Red Square Renders Correctly', async ({ page }) => {
    // Load our simple test page
    await page.goto('/tests/visual-sanity.html');

    // Wait for the page to render
    await page.waitForFunction(() => (window as any).visualTestReady === true, {
      timeout: 5000,
    });

    // Verify canvas exists and is visible
    const canvas = page.locator('#test-canvas');
    await expect(canvas).toBeVisible();

    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBe(800);
    expect(canvasBox!.height).toBe(600);

    // Take a screenshot and verify it contains visual content
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot.length).toBeGreaterThan(10000); // Should have substantial content

    // Verify the red square is present by checking pixel colors
    const hasRedSquare = await page.evaluate(() => {
      const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
      if (!canvas) return false;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Check the center area where the red square should be
      const imageData = ctx.getImageData(350, 250, 100, 100); // Center area
      const data = imageData.data;

      let redPixels = 0;
      let totalPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        totalPixels++;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Check if pixel is red (R high, G and B low)
        if (a > 200 && r > 200 && g < 50 && b < 50) {
          redPixels++;
        }
      }

      // Should have mostly red pixels in the center area
      return redPixels > totalPixels * 0.5; // More than 50% red pixels
    });

    expect(hasRedSquare).toBe(true);

    // Verify the square is positioned correctly (approximately center)
    const squarePosition = await page.evaluate(() => {
      const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Check corners of the expected square area
      const expectedX = (canvas.width - 100) / 2; // 350
      const expectedY = (canvas.height - 100) / 2; // 250

      // Sample pixels at the corners of where the square should be
      const corners = [
        ctx.getImageData(expectedX, expectedY, 1, 1).data, // Top-left
        ctx.getImageData(expectedX + 99, expectedY, 1, 1).data, // Top-right
        ctx.getImageData(expectedX, expectedY + 99, 1, 1).data, // Bottom-left
        ctx.getImageData(expectedX + 99, expectedY + 99, 1, 1).data, // Bottom-right
      ];

      // Check if all corners are red
      const allCornersRed = corners.every(pixelData => {
        const r = pixelData[0], g = pixelData[1], b = pixelData[2], a = pixelData[3];
        return a > 200 && r > 200 && g < 50 && b < 50;
      });

      return {
        allCornersRed,
        expectedX,
        expectedY,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      };
    });

    expect(squarePosition).not.toBeNull();
    expect(squarePosition!.allCornersRed).toBe(true);

    console.log(`✓ Red square rendered correctly at (${squarePosition!.expectedX}, ${squarePosition!.expectedY}) on ${squarePosition!.canvasWidth}x${squarePosition!.canvasHeight} canvas`);
  });

  test('Screenshot Comparison Works', async ({ page }) => {
    await page.goto('/tests/visual-sanity.html');
    await page.waitForFunction(() => (window as any).visualTestReady === true);

    // Take two screenshots quickly to verify stability
    const screenshot1 = await page.screenshot();
    await page.waitForTimeout(100);
    const screenshot2 = await page.screenshot();

    // Screenshots should be identical for this static content
    expect(screenshot1.equals(screenshot2)).toBe(true);
    expect(screenshot1.length).toBe(screenshot2.length);

    console.log('✓ Screenshot comparison system works correctly');
  });

  test('Color Detection Accuracy', async ({ page }) => {
    await page.goto('/tests/visual-sanity.html');
    await page.waitForFunction(() => (window as any).visualTestReady === true);

    // Test color detection at various positions
    const colorAnalysis = await page.evaluate(() => {
      const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const results = {
        centerRed: false,
        topLeftBlack: false,
        bottomRightBlack: false,
        squareSize: 0,
      };

      // Check center (should be red)
      const centerData = ctx.getImageData(400, 300, 1, 1).data;
      results.centerRed = centerData[0] > 200 && centerData[1] < 50 && centerData[2] < 50;

      // Check top-left corner (should be black/background)
      const topLeftData = ctx.getImageData(10, 10, 1, 1).data;
      results.topLeftBlack = topLeftData[0] < 50 && topLeftData[1] < 50 && topLeftData[2] < 50;

      // Check bottom-right corner (should be black/background)
      const bottomRightData = ctx.getImageData(790, 590, 1, 1).data;
      results.bottomRightBlack = bottomRightData[0] < 50 && bottomRightData[1] < 50 && bottomRightData[2] < 50;

      // Measure square size by finding red pixels
      let redPixelCount = 0;
      for (let y = 200; y < 400; y++) {
        for (let x = 300; x < 500; x++) {
          const pixelData = ctx.getImageData(x, y, 1, 1).data;
          if (pixelData[0] > 200 && pixelData[1] < 50 && pixelData[2] < 50) {
            redPixelCount++;
          }
        }
      }
      results.squareSize = redPixelCount;

      return results;
    });

    expect(colorAnalysis).not.toBeNull();
    expect(colorAnalysis!.centerRed).toBe(true);
    expect(colorAnalysis!.topLeftBlack).toBe(true);
    expect(colorAnalysis!.bottomRightBlack).toBe(true);
    expect(colorAnalysis!.squareSize).toBeGreaterThan(9000); // Approximately 100x100 = 10,000 pixels

    console.log(`✓ Color detection accurate: center red, corners black, ${colorAnalysis!.squareSize} red pixels in square`);
  });
});