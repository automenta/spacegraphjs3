import { test, expect } from '@playwright/test';
import { EnhancedVisualSemanticsController } from './enhanced-visual-semantics-controller';
import {
  getAllErgonomicsSpecs,
  getErgonomicsSpec,
} from './specs/ergonomics';

/**
 * Ergonomics Validation Tests
 *
 * Uses the Enhanced Visual Semantics Controller to validate ergonomic compliance
 * across all SpaceGraphJS components, ensuring videogame-like user experience.
 */

test.describe('Ergonomics Validation with Visual Testing', () => {
  let controller: EnhancedVisualSemanticsController;

  test.beforeAll(async () => {
    controller = await EnhancedVisualSemanticsController.init({
      viewport: { width: 1280, height: 720 },
      headless: true,
    });
  });

  test.afterAll(async () => {
    await controller.cleanup();
  });

  test.beforeEach(async () => {
    // Navigate to the main demo page for comprehensive testing
    await controller.navigateTo('/element-actors-demo.html');
  });

  test('Camera Controls Ergonomics Validation', async () => {
    const spec = getErgonomicsSpec('CameraControls');
    expect(spec).toBeDefined();

    if (spec) {
      // Assert visual state compliance
      await controller.assertVisualState(spec);

      // Assert ergonomic compliance
      const ergonomicResult = await controller.assertErgonomicCompliance(spec);

      // Should pass all ergonomic checks
      expect(ergonomicResult.passed).toBe(true);

      // Check specific metrics for videogame-like responsiveness
      expect(ergonomicResult.metrics.responseTime).toBeLessThanOrEqual(50);

      console.log('Camera Controls Ergonomics:', {
        passed: ergonomicResult.passed,
        violations: ergonomicResult.violations.length,
        responseTime: ergonomicResult.metrics.responseTime,
      });
    }
  });

  test('Node Interaction Ergonomics Validation', async () => {
    const spec = getErgonomicsSpec('NodeInteraction');
    expect(spec).toBeDefined();

    if (spec) {
      // Assert visual state compliance
      await controller.assertVisualState(spec);

      // Assert ergonomic compliance
      const ergonomicResult = await controller.assertErgonomicCompliance(spec);

      // Should pass all ergonomic checks
      expect(ergonomicResult.passed).toBe(true);

      // Check for instant feedback (gaming requirement)
      expect(ergonomicResult.metrics.responseTime).toBeLessThanOrEqual(30);

      console.log('Node Interaction Ergonomics:', {
        passed: ergonomicResult.passed,
        violations: ergonomicResult.violations.length,
        responseTime: ergonomicResult.metrics.responseTime,
      });
    }
  });

  test('Text Readability Ergonomics Validation', async () => {
    const spec = getErgonomicsSpec('TextElement');
    expect(spec).toBeDefined();

    if (spec) {
      // Assert visual state compliance
      await controller.assertVisualState(spec);

      // Assert ergonomic compliance
      const ergonomicResult = await controller.assertErgonomicCompliance(spec);

      // Should pass all ergonomic checks
      expect(ergonomicResult.passed).toBe(true);

      // Check contrast ratio for accessibility
      expect(ergonomicResult.metrics.contrastRatio).toBeGreaterThanOrEqual(4.5);

      console.log('Text Readability Ergonomics:', {
        passed: ergonomicResult.passed,
        violations: ergonomicResult.violations.length,
        contrastRatio: ergonomicResult.metrics.contrastRatio,
      });
    }
  });

  test('Performance UI Ergonomics Validation', async () => {
    const spec = getErgonomicsSpec('PerformanceUI');
    expect(spec).toBeDefined();

    if (spec) {
      // Assert visual state compliance
      await controller.assertVisualState(spec);

      // Assert ergonomic compliance
      const ergonomicResult = await controller.assertErgonomicCompliance(spec);

      // Should pass all ergonomic checks
      expect(ergonomicResult.passed).toBe(true);

      console.log('Performance UI Ergonomics:', {
        passed: ergonomicResult.passed,
        violations: ergonomicResult.violations.length,
      });
    }
  });

  test('Accessibility Features Ergonomics Validation', async () => {
    const spec = getErgonomicsSpec('Accessibility');
    expect(spec).toBeDefined();

    if (spec) {
      // Assert visual state compliance
      await controller.assertVisualState(spec);

      // Assert ergonomic compliance
      const ergonomicResult = await controller.assertErgonomicCompliance(spec);

      // Should pass all ergonomic checks
      expect(ergonomicResult.passed).toBe(true);

      // Check accessibility features
      expect(ergonomicResult.metrics.keyboardAccessible).toBe(true);
      expect(ergonomicResult.metrics.screenReaderSupport).toBe(true);

      console.log('Accessibility Ergonomics:', {
        passed: ergonomicResult.passed,
        violations: ergonomicResult.violations.length,
        keyboardAccessible: ergonomicResult.metrics.keyboardAccessible,
        screenReaderSupport: ergonomicResult.metrics.screenReaderSupport,
      });
    }
  });

  test('Comprehensive Ergonomics Compliance Check', async () => {
    const allSpecs = getAllErgonomicsSpecs();
    const results = [];

    for (const spec of allSpecs) {
      console.log(`Testing ergonomics for: ${spec.component}`);

      try {
        // Assert visual state compliance
        await controller.assertVisualState(spec);

        // Assert ergonomic compliance
        const ergonomicResult =
          await controller.assertErgonomicCompliance(spec);

        results.push({
          component: spec.component,
          passed: ergonomicResult.passed,
          violations: ergonomicResult.violations.length,
          metrics: ergonomicResult.metrics,
        });

        // Each component should pass ergonomic checks
        expect(ergonomicResult.passed).toBe(true);
      } catch (error) {
        console.error(`Ergonomics test failed for ${spec.component}:`, error);
        results.push({
          component: spec.component,
          passed: false,
          violations: 1,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    // Generate summary report
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    const complianceRate = (passedCount / totalCount) * 100;

    console.log(
      `Ergonomics Compliance Summary: ${passedCount}/${totalCount} components passed (${complianceRate.toFixed(1)}%)`
    );

    // Should have 100% compliance for videogame-like experience
    expect(complianceRate).toBe(100);

    // Generate performance report
    const reportPath = await controller.generatePerformanceReport();
    console.log(`Performance report generated: ${reportPath}`);
  });

  test('Videogame-like Responsiveness Benchmark', async () => {
    // Navigate to performance-intensive demo
    await controller.navigateTo('/large-graph.html');

    const startTime = Date.now();

    // Test rapid interactions that should feel like a videogame
    const interactions = [
      () => controller.keyboard('w'),
      () => controller.keyboard('a'),
      () => controller.keyboard('s'),
      () => controller.keyboard('d'),
      () => controller.hover('canvas', { position: { x: 400, y: 300 } }),
      () => controller.click('canvas', { position: { x: 400, y: 300 } }),
      () => controller.scroll('canvas', { deltaY: 100 }),
    ];

    // Execute interactions in sequence
    for (const interaction of interactions) {
      await interaction();
      // Small delay to simulate user thinking time
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const totalTime = Date.now() - startTime;
    const avgResponseTime = totalTime / interactions.length;

    // For videogame-like feel, average response should be under 100ms
    expect(avgResponseTime).toBeLessThan(100);

    // Get performance metrics
    const metrics = controller.getPerformanceMetrics();
    const avgMetricTime =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
        : 0;

    console.log(
      `Videogame Responsiveness: ${avgResponseTime.toFixed(1)}ms average response time, ${avgMetricTime.toFixed(1)}ms average metric time`
    );

    // Generate detailed performance report
    const reportPath = await controller.generatePerformanceReport();
    console.log(`Detailed performance report: ${reportPath}`);
  });

  test('Visual Regression Detection for Ergonomics', async () => {
    const allSpecs = getAllErgonomicsSpecs();

    for (const spec of allSpecs) {
      console.log(`Checking visual regression for: ${spec.component}`);

      // Capture baseline screenshots
      for (const interaction of spec.interactions) {
        for (const outcome of interaction.expectedOutcomes) {
          const screenshotPath = await controller.captureScreenshot(
            `ergonomics-${spec.component.toLowerCase()}-${outcome.screenshot}`,
            { fullPage: true }
          );

          console.log(`Captured ergonomics screenshot: ${screenshotPath}`);
        }
      }
    }

    console.log(
      'Visual regression baseline captured for all ergonomics components'
    );
  });
});
