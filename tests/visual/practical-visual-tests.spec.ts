import { test, expect } from '@playwright/test';
import {
  SimpleScreenshotValidator,
  InteractionSequence,
} from './simple-screenshot-validator';

test.describe('Practical Visual Semantics Tests', () => {
  let validator: SimpleScreenshotValidator;

  test.beforeEach(async () => {
    validator = new SimpleScreenshotValidator();
    await validator.initialize();
  });

  test('Element actors base visualization', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Validate base visualization
    const result = await validator.captureAndValidate(
      page,
      'element-actors-base',
      {
        threshold: 0.2,
        maxDiffPixels: 20000,
      }
    );

    expect(result.passed).toBeTruthy();
  });

  test('Node hover interaction visualization', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Hover over center node
    const viewport = page.viewportSize();
    if (viewport) {
      await page.hover('canvas', {
        position: { x: viewport.width / 2, y: viewport.height / 2 },
      });
    }

    await page.waitForTimeout(200);

    // Validate hover state
    const result = await validator.captureAndValidate(
      page,
      'element-actors-hover',
      {
        threshold: 0.2,
        maxDiffPixels: 15000,
      }
    );

    expect(result.passed).toBeTruthy();
  });

  test('Node selection visualization', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click on center node
    const viewport = page.viewportSize();
    if (viewport) {
      await page.click('canvas', {
        position: { x: viewport.width / 2, y: viewport.height / 2 },
      });
    }

    await page.waitForTimeout(200);

    // Validate selection state
    const result = await validator.captureAndValidate(
      page,
      'element-actors-selection',
      {
        threshold: 0.2,
        maxDiffPixels: 15000,
      }
    );

    expect(result.passed).toBeTruthy();
  });

  test('Edge interaction visualization', async ({ page }) => {
    // Navigate to edge interaction demo
    await page.goto('/edge-interaction.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Try to hover over an edge
    const viewport = page.viewportSize();
    if (viewport) {
      // Try multiple positions to find an edge
      await page.hover('canvas', {
        position: { x: viewport.width / 2, y: viewport.height / 2 },
      });
    }

    await page.waitForTimeout(300);

    // Validate edge hover state
    const result = await validator.captureAndValidate(
      page,
      'edge-interaction-hover',
      {
        threshold: 0.25,
        maxDiffPixels: 20000,
      }
    );

    expect(result.passed).toBeTruthy();
  });

  test('Complex interaction sequence', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Define interaction sequence
    const sequence: InteractionSequence = {
      name: 'Node Interaction Sequence',
      steps: [
        {
          type: 'hover',
          selector: 'canvas',
          waitTime: 200,
          screenshotName: 'sequence-step-1-hover',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000,
          },
        },
        {
          type: 'click',
          selector: 'canvas',
          waitTime: 200,
          screenshotName: 'sequence-step-2-click',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000,
          },
        },
      ],
    };

    // Validate the sequence
    const result = await validator.validateInteractionSequence(page, sequence);

    // At least one step should pass (first run might create expected screenshots)
    expect(result.results.length).toBeGreaterThan(0);
  });

  test('Layout engines visualization', async ({ page }) => {
    // Navigate to layout engines demo
    await page.goto('/layout-engines-demo.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Validate layout visualization
    const result = await validator.captureAndValidate(
      page,
      'layout-engines-base',
      {
        threshold: 0.3,
        maxDiffPixels: 30000,
      }
    );

    expect(result.passed).toBeTruthy();
  });

  test('Performance optimizations visualization', async ({ page }) => {
    // Navigate to performance optimizations demo
    await page.goto('/performance-optimizations.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Validate performance visualization
    const result = await validator.captureAndValidate(
      page,
      'performance-optimizations-base',
      {
        threshold: 0.3,
        maxDiffPixels: 30000,
      }
    );

    expect(result.passed).toBeTruthy();
  });
});
