// tests/visual/basic.spec.ts
import { test, expect } from '@playwright/test';

test('renders the basic scene and handles updates', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000); // Wait for initial render

  // 1. Initial render snapshot
  await expect(page).toHaveScreenshot('01-initial-render.png');

  // 2. Update a node's color and add a new node
  await page.evaluate(() => {
    const graph = (window as any).graph;
    graph.update({
      data: {
        nodes: [
          { id: 'n1', color: '#ffff00' }, // Change color of n1
          { id: 'n4', type: 'sphere', color: '#ff00ff' }, // Add n4
        ],
      },
    });
  });

  await page.waitForTimeout(500); // Wait for re-render

  // 3. Snapshot after update
  await expect(page).toHaveScreenshot('02-after-update.png');

  // 4. Remove a node
  await page.evaluate(() => {
    const graph = (window as any).graph;
    graph.update({
      data: {
        nodes: [
          { id: 'n2', delete: true }, // Remove n2
        ],
      },
    });
  });

  await page.waitForTimeout(500); // Wait for re-render

  // 5. Snapshot after deletion
  await expect(page).toHaveScreenshot('03-after-delete.png');
});

test('applies force-directed layout and nodes move', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000); // Wait for initial render

  // Enable force-directed layout
  await page.evaluate(() => {
    const graph = (window as any).graph;
    graph.update({
      layout: {
        type: 'force-directed',
      },
    });
  });

  await page.waitForTimeout(2000); // Wait for layout to stabilize a bit

  // Take a snapshot after layout is applied
  await expect(page).toHaveScreenshot('04-after-force-layout.png');
});