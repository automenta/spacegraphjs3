import { expect, test } from './utils';

test.describe('Instanced Renderer Interaction', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/instanced-interaction.html');
    // Wait for the graph to be initialized
    await page.waitForFunction(() => (window as any).graph);
    // Wait for the instanced renderer to be ready
    await page.waitForFunction(() => {
      const graph = (window as any).graph;
      try {
        const nodeRenderer = graph.render.getNodeRenderer();
        return (
          nodeRenderer && nodeRenderer.constructor.name === 'InstancedRenderer'
        );
      } catch (_e) {
        return false;
      }
    });
    // Wait for instanced meshes to be populated and ready for raycasting
    await page.waitForFunction(() => {
      const graph = (window as any).graph;
      try {
        const nodeRenderer = graph.render.getNodeRenderer();
        if (
          nodeRenderer &&
          nodeRenderer.constructor.name === 'InstancedRenderer'
        ) {
          // Check if instanced meshes have been populated
          const instancedRenderer = nodeRenderer as any;
          if (instancedRenderer.instancedMeshes) {
            for (const mesh of instancedRenderer.instancedMeshes.values()) {
              if (mesh.count > 0) {
                // At least one mesh has instances, renderer is ready
                return true;
              }
            }
          }
        }
        return false;
      } catch (_e) {
        return false;
      }
    });
    // Additional wait for instanced meshes to become raycastable
    await page.waitForTimeout(1000);
  });

  test('should correctly handle hover interaction', async ({ page }) => {
    // Target the center node
    const canvas = page.locator('canvas');
    await canvas.hover({
      position: {
        x: page.viewportSize()!.width / 2,
        y: page.viewportSize()!.height / 2,
      },
    });

    // Wait for the hover effect to apply
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('instanced-hover.png', {
      threshold: 0.1, // Allow for small rendering differences
      maxDiffPixels: 5000, // Allow up to 5k pixels to be different
    });
  });

  test('should correctly handle click/selection interaction', async ({
    page,
  }) => {
    // Wait a bit more for the renderer to be fully ready
    await page.waitForTimeout(500);
    const canvas = page.locator('canvas');
    await canvas.click({
      position: {
        x: page.viewportSize()!.width / 2,
        y: page.viewportSize()!.height / 2,
      },
    });

    // Wait for the select effect to apply
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('instanced-select.png', {
      threshold: 0.1, // Allow for small rendering differences
      maxDiffPixels: 5000, // Allow up to 5k pixels to be different
    });

    // Check if the state was updated
    const selectedIds = await page.evaluate(
      () => (window as any).graph.state.interaction.selectedElementIds
    );
    expect(selectedIds).toContain('n-7-7'); // The center node
  });

  test('should correctly handle drag interaction', async ({ page }) => {
    // Wait a bit more for the renderer to be fully ready
    await page.waitForTimeout(1000);

    // Hide the test-results div that intercepts pointer events
    await page.evaluate(() => {
      const testResults = document.getElementById('test-results');
      if (testResults) {
        testResults.style.display = 'none';
      }
    });

    const canvas = page.locator('canvas');

    // Do a small pan to ensure the instanced renderer is ready for raycasting
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 15, y: 15 },
    });

    // Wait a bit more after panning to ensure renderer is ready
    await page.waitForTimeout(500);

    const center = {
      x: page.viewportSize()!.width / 2,
      y: page.viewportSize()!.height / 2,
    };

    // Get initial position
    const initialPosition = await page.evaluate(
      () => (window as any).graph.getElement('n-7-7').position
    );

    // Drag the node
    await canvas.dragTo(canvas, {
      sourcePosition: center,
      targetPosition: { x: center.x + 50, y: center.y + 50 },
    });

    // Get final position
    const finalPosition = await page.evaluate(
      () => (window as any).graph.getElement('n-7-7').position
    );

    // Check if position has changed (with some tolerance for floating point precision)
    expect(Math.abs(finalPosition.x - initialPosition.x)).toBeGreaterThan(0.1);
    expect(Math.abs(finalPosition.y - initialPosition.y)).toBeGreaterThan(0.1);

    await expect(page).toHaveScreenshot('instanced-drag.png', {
      threshold: 0.1, // Allow for small rendering differences
      maxDiffPixels: 5000, // Allow up to 5k pixels to be different
    });
  });
});
