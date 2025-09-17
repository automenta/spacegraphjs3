import { test, expect } from './utils';

test.describe('Instanced Renderer Interaction', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/instanced-interaction.html');
    // Wait for the graph to be initialized
    await page.waitForFunction(() => (window as any).graph);
    // And for the layout to stabilize
    await page.waitForTimeout(1000);
  });

  test('should correctly handle hover interaction', async ({ page }) => {
    // Target the center node
    const canvas = page.locator('canvas');
    await canvas.hover({
      position: { x: page.viewportSize()!.width / 2, y: page.viewportSize()!.height / 2 },
    });

    // Wait for the hover effect to apply
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('instanced-hover.png');
  });

  test('should correctly handle click/selection interaction', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({
      position: { x: page.viewportSize()!.width / 2, y: page.viewportSize()!.height / 2 },
    });

    // Wait for the select effect to apply
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('instanced-select.png');

    // Check if the state was updated
    const selectedIds = await page.evaluate(() => (window as any).graph.state.interaction.selectedElementIds);
    expect(selectedIds).toContain('n-7-7'); // The center node
  });

  test('should correctly handle drag interaction', async ({ page }) => {
    const canvas = page.locator('canvas');
    const center = { x: page.viewportSize()!.width / 2, y: page.viewportSize()!.height / 2 };

    // Get initial position
    const initialPosition = await page.evaluate(() => (window as any).graph.getElement('n-7-7').position);

    // Drag the node
    await canvas.dragTo(canvas, {
      sourcePosition: center,
      targetPosition: { x: center.x + 50, y: center.y + 50 },
    });

    // Get final position
    const finalPosition = await page.evaluate(() => (window as any).graph.getElement('n-7-7').position);

    // Check if position has changed
    expect(finalPosition.x).not.toBe(initialPosition.x);
    expect(finalPosition.y).not.toBe(initialPosition.y);

    await expect(page).toHaveScreenshot('instanced-drag.png');
  });
});
