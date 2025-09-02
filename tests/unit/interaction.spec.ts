// tests/unit/interaction.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000); // Small buffer for rendering and layout to settle
});

test('drags the background to pan the camera and updates state', async ({
  page,
}) => {
  const initialCameraPosition = await page.evaluate(() => {
    const graph = (window as any).graph;
    return {
      x: graph.state.camera.position.x,
      y: graph.state.camera.position.y,
    };
  });

  await page.mouse.move(200, 200);
  await page.mouse.down();
  await page.mouse.move(300, 300, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(200); // Wait for state update

  const finalCameraPosition = await page.evaluate(() => {
    const graph = (window as any).graph;
    return {
      x: graph.state.camera.position.x,
      y: graph.state.camera.position.y,
    };
  });

  expect(finalCameraPosition.x).not.toBeCloseTo(initialCameraPosition.x);
  expect(finalCameraPosition.y).not.toBeCloseTo(initialCameraPosition.y);
});

test('scrolls to zoom the camera and updates state', async ({ page }) => {
  const initialCameraZoom = await page.evaluate(() => {
    const graph = (window as any).graph;
    return graph.state.camera.zoom;
  });

  await page.mouse.wheel(0, -500); // Zoom in
  await page.waitForTimeout(200); // Wait for state update

  const zoomedInCameraZoom = await page.evaluate(() => {
    const graph = (window as any).graph;
    return graph.state.camera.zoom;
  });

  expect(zoomedInCameraZoom).toBeGreaterThan(initialCameraZoom);

  await page.mouse.wheel(0, 1000); // Zoom out
  await page.waitForTimeout(200); // Wait for state update

  const zoomedOutCameraZoom = await page.evaluate(() => {
    const graph = (window as any).graph;
    return graph.state.camera.zoom;
  });

  expect(zoomedOutCameraZoom).toBeLessThan(zoomedInCameraZoom);
});

test('hovers over an element and updates hoveredElementId', async ({
  page,
}) => {
  const canvas = await page.$('canvas');
  const boundingBox = await canvas!.boundingBox();
  const centerX = boundingBox!.x + boundingBox!.width / 2;
  const centerY = boundingBox!.y + boundingBox!.height / 2;

  await page.mouse.move(centerX, centerY); // Hover over n1
  await page.waitForTimeout(200); // Wait for state update

  let hoveredId = await page.evaluate(() => {
    const graph = (window as any).graph;
    return graph.state.interaction.hoveredElementId;
  });
  expect(hoveredId).toBe('n1');

  await page.mouse.move(10, 10); // Move away
  await page.waitForTimeout(200); // Wait for state update

  hoveredId = await page.evaluate(() => {
    const graph = (window as any).graph;
    return graph.state.interaction.hoveredElementId;
  });
  expect(hoveredId).toBeNull();
});

test('clicks an element to select it and deselects on background click', async ({
  page,
}) => {
  const canvas = await page.$('canvas');
  const boundingBox = await canvas!.boundingBox();
  const centerX = boundingBox!.x + boundingBox!.width / 2;
  const centerY = boundingBox!.y + boundingBox!.height / 2;

  await page.mouse.click(centerX, centerY); // Click n1
  await page.waitForTimeout(200); // Wait for state update

  let selectedIds = await page.evaluate(() => {
    const graph = (window as any).graph;
    return graph.state.interaction.selectedElementIds;
  });
  expect(selectedIds).toEqual(['n1']);

  await page.mouse.click(10, 10); // Click background
  await page.waitForTimeout(200); // Wait for state update

  selectedIds = await page.evaluate(() => {
    const graph = (window as any).graph;
    return graph.state.interaction.selectedElementIds;
  });
  expect(selectedIds).toEqual([]);
});
