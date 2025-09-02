// tests/visual/interaction.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle'); // Wait for network to be idle
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000); // Small buffer for rendering
});

test.afterEach(async ({ page }) => {
  // Ensure any lingering interactions are cleared
  await page.evaluate(() => {
    const graph = (window as any).graph;
    if (graph && graph.update) {
      graph.update({
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      });
    }
  });
  await page.waitForTimeout(100); // Give a moment for state to clear
});

test('drags the background to pan the camera', async ({ page }) => {
  await expect(page).toHaveScreenshot('interaction-01-initial.png');

  await page.mouse.move(200, 200);
  await page.mouse.down();
  await page.mouse.move(300, 300, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(500); // Wait for render after drag
  await expect(page).toHaveScreenshot('interaction-02-after-pan.png');
});

test('scrolls to zoom the camera', async ({ page }) => {
  await expect(page).toHaveScreenshot('interaction-03-initial-zoom.png');

  await page.mouse.wheel(0, -500); // Scroll down to zoom in
  await page.waitForTimeout(500); // Wait for render
  await expect(page).toHaveScreenshot('interaction-04-after-zoom-in.png');

  await page.mouse.wheel(0, 1000); // Scroll up to zoom out
  await page.waitForTimeout(500); // Wait for render
  await expect(page).toHaveScreenshot('interaction-05-after-zoom-out.png');
});

test('hovers over an element to apply hover style', async ({ page }) => {
  const canvas = await page.$('canvas');
  const boundingBox = await canvas!.boundingBox();
  const centerX = boundingBox!.x + boundingBox!.width / 2;
  const centerY = boundingBox!.y + boundingBox!.height / 2;

  await page.mouse.move(centerX, centerY); // Hover over n1
  await page.waitForTimeout(500); // Wait for hover effect
  await expect(page).toHaveScreenshot('interaction-06-after-hover.png');

  await page.mouse.move(10, 10); // Move mouse away to unhover
  await page.waitForTimeout(500); // Wait for unhover effect
  await expect(page).toHaveScreenshot('interaction-07-after-unhover.png');
});

test('clicks an element to select it and clicks background to deselect', async ({ page }) => {
  const canvas = await page.$('canvas');
  const boundingBox = await canvas!.boundingBox();
  const centerX = boundingBox!.x + boundingBox!.width / 2;
  const centerY = boundingBox!.y + boundingBox!.height / 2;

  await page.mouse.click(centerX, centerY); // Click n1
  await page.waitForTimeout(500); // Wait for selection effect
  await expect(page).toHaveScreenshot('interaction-08-after-select.png');

  await page.mouse.click(10, 10); // Click on the background to deselect
  await page.waitForTimeout(500); // Wait for deselection effect
  await expect(page).toHaveScreenshot('interaction-09-after-deselect.png');
});