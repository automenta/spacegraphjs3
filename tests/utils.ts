import { vi } from 'vitest';
import { test as baseTest } from '@playwright/test';

export const tick = async () => {
  await vi.runAllTimersAsync();
};

/**
 * Common test utilities for SpaceGraph tests
 */

/**
 * Waits for the SpaceGraph to be fully initialized
 * @param page - Playwright page
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForGraphInitialization(
  page: any,
  timeout: number = 10000
): Promise<void> {
  await page.waitForFunction(() => (window as any).graph, { timeout });
  await page.waitForTimeout(2000); // Additional wait for stabilization
}

/**
 * Waits for instanced renderer to be ready
 * @param page - Playwright page
 */
export async function waitForInstancedRenderer(page: any): Promise<void> {
  await page.waitForFunction(() => {
    const graph = (window as any).graph;
    try {
      const nodeRenderer = graph.render.getNodeRenderer();
      return (
        nodeRenderer && nodeRenderer.constructor.name === 'InstancedRenderer'
      );
    } catch {
      return false;
    }
  });

  // Wait for instanced meshes to be populated
  await page.waitForFunction(() => {
    const graph = (window as any).graph;
    try {
      const nodeRenderer = graph.render.getNodeRenderer();
      if (
        nodeRenderer &&
        nodeRenderer.constructor.name === 'InstancedRenderer'
      ) {
        const instancedRenderer = nodeRenderer;
        if (instancedRenderer.instancedMeshes) {
          for (const mesh of instancedRenderer.instancedMeshes.values()) {
            if (mesh.count > 0) {
              return true;
            }
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  await page.waitForTimeout(1000); // Additional stabilization time
}

/**
 * Gets the current interaction state from the graph
 * @param page - Playwright page
 */
export async function getInteractionState(page: any): Promise<{
  selectedIds: string[];
  hoveredId: string | null;
}> {
  return await page.evaluate(() => ({
    selectedIds: (window as any).graph.state.interaction.selectedElementIds || [],
    hoveredId: (window as any).graph.state.interaction.hoveredElementId || null,
  }));
}

/**
 * Performs a click at the center of the canvas
 * @param page - Playwright page
 * @param options - Click options
 */
export async function clickCanvasCenter(
  page: any,
  options: { button?: 'left' | 'right' | 'middle' } = {}
): Promise<void> {
  const viewport = page.viewportSize();
  if (viewport) {
    await page.click('canvas', {
      position: { x: viewport.width / 2, y: viewport.height / 2 },
      button: options.button || 'left',
    });
  }
}

/**
 * Performs a hover at the center of the canvas
 * @param page - Playwright page
 */
export async function hoverCanvasCenter(page: any): Promise<void> {
  const viewport = page.viewportSize();
  if (viewport) {
    await page.hover('canvas', {
      position: { x: viewport.width / 2, y: viewport.height / 2 },
    });
  }
}

/**
 * Waits for interaction state to change
 * @param page - Playwright page
 * @param initialState - The initial state to compare against
 * @param timeout - Timeout in milliseconds (default: 1000)
 */
export async function waitForInteractionChange(
  page: any,
  initialState: { selectedIds: string[]; hoveredId: string | null },
  timeout: number = 1000
): Promise<{ selectedIds: string[]; hoveredId: string | null }> {
  return await page.waitForFunction(
    (initial) => {
      const current = {
        selectedIds: (window as any).graph.state.interaction.selectedElementIds || [],
        hoveredId: (window as any).graph.state.interaction.hoveredElementId || null,
      };
      return (
        current.selectedIds.length !== initial.selectedIds.length ||
        current.hoveredId !== initial.hoveredId ||
        !current.selectedIds.every((id: string) => initial.selectedIds.includes(id))
      );
    },
    initialState,
    { timeout }
  );
}

/**
 * Pixel analysis utilities for visual testing
 */

/**
 * Checks if a pixel is red based on RGBA values
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @param a - Alpha component (0-255), defaults to 255 if not provided
 * @returns true if the pixel is considered red
 */
export function isRedPixel(r: number, g: number, b: number, a: number = 255): boolean {
  return a > 200 && r > 200 && g < 50 && b < 50;
}

/**
 * Counts red pixels in a PNG image data buffer
 * @param data - PNG image data buffer
 * @param width - Image width
 * @param height - Image height
 * @returns number of red pixels found
 */
export function countRedPixels(data: Buffer, width: number, height: number): number {
  let redPixels = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      if (isRedPixel(r, g, b, a)) redPixels++;
    }
  }
  return redPixels;
}

/**
 * Enhanced test function with common SpaceGraph test setup
 */
export const test = baseTest.extend({
  // Add common fixtures here if needed
});

/**
 * Common test data generators
 */
export const TestData = {
  /**
   * Creates a simple grid of nodes
   * @param rows - Number of rows
   * @param cols - Number of columns
   * @param spacing - Spacing between nodes
   */
  createGridNodes: (rows: number, cols: number, spacing: number = 2) => {
    const nodes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({
          id: `n-${r}-${c}`,
          position: {
            x: (c - cols / 2) * spacing,
            y: (r - rows / 2) * spacing,
            z: 0,
          },
          data: { label: `Node ${r}-${c}` },
        });
      }
    }
    return nodes;
  },

  /**
   * Creates edges connecting nodes in a grid pattern
   * @param nodes - Array of nodes
   * @param rows - Number of rows
   * @param cols - Number of columns
   */
  createGridEdges: (nodes: any[], rows: number, cols: number) => {
    const edges = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const currentId = `n-${r}-${c}`;

        // Connect to right neighbor
        if (c < cols - 1) {
          edges.push({
            id: `e-${r}-${c}-right`,
            source: currentId,
            target: `n-${r}-${c + 1}`,
          });
        }

        // Connect to bottom neighbor
        if (r < rows - 1) {
          edges.push({
            id: `e-${r}-${c}-down`,
            source: currentId,
            target: `n-${r + 1}-${c}`,
          });
        }
      }
    }
    return edges;
  },
};
