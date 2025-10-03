import { test } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import { PerformanceMetricsCollector } from './performance-metrics-collector';
import { ComprehensiveUISemanticsSpecs } from './specs/comprehensive-ui.semantics';

/**
 * Performance Metrics Demo
 *
 * This file demonstrates how to use the performance metrics collector
 * to measure and track performance of visual interactions.
 */

test.describe('Performance Metrics Collection', () => {
  let controller: VisualSemanticsController;
  let collector: PerformanceMetricsCollector;

  test.beforeEach(async () => {
    controller = await VisualSemanticsController.init({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });

    collector = new PerformanceMetricsCollector();
  });

  test.afterEach(async () => {
    if (controller) {
      await controller.cleanup();
    }
  });

  test('Measure Sphere Element Actor hover performance', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5174/element-actors-demo.html'
    );

    // Collect performance metrics for hover interaction
    const metrics = await collector.collectMetrics(
      'SphereElementActor',
      'Hover Interaction',
      async () => {
        await controller.hover('canvas');
      }
    );

    console.log(collector.generateReport());

    // Compare with baseline (in a real scenario, this would be set from previous runs)
    collector.setBaseline('SphereElementActor-Hover', {
      componentName: 'SphereElementActor',
      testName: 'Hover Interaction',
      responseTime: 50, // Baseline response time in ms
      memoryUsage: 10, // Baseline memory usage in MB
      cpuUsage: 20, // Baseline CPU usage percentage
      frameRate: 60, // Baseline frame rate
      interactionLatency: 10, // Baseline latency in ms
      renderTime: 30, // Baseline render time in ms
      timestamp: new Date().toISOString(),
    });

    // Check for regressions
    const benchmark = collector.compareWithBaseline(
      'SphereElementActor-Hover',
      metrics
    );
    if (benchmark && benchmark.regression) {
      console.warn(
        `Performance regression detected: ${benchmark.regressionPercentage.toFixed(2)}% worse than baseline`
      );
    }
  });

  test('Measure Box Element Actor drag performance', async () => {
    // Navigate to the instanced interaction demo
    await controller.navigateTo(
      'http://localhost:5174/instanced-interaction.html'
    );

    // Collect performance metrics for drag interaction
    const metrics = await collector.collectMetrics(
      'BoxElementActor',
      'Drag Interaction',
      async () => {
        await controller.drag('canvas', 'canvas', {
          sourcePosition: { x: 640, y: 360 },
          targetPosition: { x: 740, y: 460 },
        });
      }
    );

    console.log(collector.generateReport());
  });

  test('Measure Layout Engine performance', async () => {
    // Navigate to the layout engines demo
    await controller.navigateTo(
      'http://localhost:5174/layout-engines-demo.html'
    );

    // Collect performance metrics for layout execution
    const metrics = await collector.collectMetrics(
      'D3ForceLayout',
      'Layout Execution',
      async () => {
        // Click the force layout button
        await controller.click('#force-layout-button');
        // Wait for layout to complete
        await controller.waitForTimeout(2000);
      }
    );

    console.log(collector.generateReport());
  });
});
