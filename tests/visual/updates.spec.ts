import { test, expect } from '@playwright/test';

// Declare the type for the exposed graph instance
declare global {
  interface Window {
    graph: any;
  }
}

test.describe('Visual Tests for Reactive Updates', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the page before each test
    await page.goto('http://localhost:3000');
    // Wait for the canvas to be ready and the graph to be initialized
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => window.graph);
    // Add a small delay to ensure the first render is complete
    await page.waitForTimeout(500);
  });

  test('initial scene should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('update-test-01-initial.png', { maxDiffPixels: 100 });
  });

  test('should update node color', async ({ page }) => {
    // Change the color of the first node to yellow
    await page.evaluate(() => {
      window.graph.update({
        data: { nodes: [{ id: 'n1', color: '#ffff00' }] },
      });
    });
    await page.waitForTimeout(500); // Wait for re-render
    await expect(page).toHaveScreenshot('update-test-02-color-change.png', { maxDiffPixels: 100 });
  });

  test('should update node type', async ({ page }) => {
    // Change the type of the second node to a box
    await page.evaluate(() => {
      window.graph.update({
        data: { nodes: [{ id: 'n2', type: 'box' }] },
      });
    });
    await page.waitForTimeout(500); // Wait for re-render
    await expect(page).toHaveScreenshot('update-test-03-type-change.png', { maxDiffPixels: 100 });
  });

  test('should add a node', async ({ page }) => {
    // Get the current nodes and add a new one
    const currentNodes = await page.evaluate(() => window.graph.state.data.nodes);
    await page.evaluate((nodes) => {
      window.graph.update({
        data: {
          nodes: [...nodes, { id: 'n4', type: 'sphere', color: '#ffffff' }],
        },
      });
    }, currentNodes);
    await page.waitForTimeout(500); // Wait for re-render
    await expect(page).toHaveScreenshot('update-test-04-add-node.png', { maxDiffPixels: 100 });
  });

  test('should remove a node', async ({ page }) => {
    // Remove the first node
    const currentNodes = await page.evaluate(() => window.graph.state.data.nodes);
    await page.evaluate((nodes) => {
      window.graph.update({
        data: {
          nodes: nodes.filter((n: any) => n.id !== 'n1'),
        },
      });
    }, currentNodes);
    await page.waitForTimeout(500); // Wait for re-render
    await expect(page).toHaveScreenshot('update-test-05-remove-node.png', { maxDiffPixels: 100 });
  });
});
