import { test } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import { VisualRegressionReporter } from './visual-regression-reporter';
import { PerformanceMetricsCollector } from './performance-metrics-collector';
import { UnifiedDashboard } from './unified-dashboard';
import { ComprehensiveUISemanticsSpecs } from './specs/comprehensive-ui.semantics';

/**
 * Unified Dashboard Demo
 * 
 * This file demonstrates how to use the unified dashboard to display
 * all visual semantics testing results in a single interface.
 */

test.describe('Unified Dashboard Demo', () => {
  let controller: VisualSemanticsController;
  let reporter: VisualRegressionReporter;
  let collector: PerformanceMetricsCollector;
  let dashboard: UnifiedDashboard;

  test.beforeAll(async () => {
    reporter = new VisualRegressionReporter();
    collector = new PerformanceMetricsCollector();
    dashboard = new UnifiedDashboard();
    
    await reporter.initialize();
  });

  test.beforeEach(async () => {
    controller = await VisualSemanticsController.init({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
  });

  test.afterEach(async () => {
    if (controller) {
      await controller.cleanup();
    }
  });

  test.afterAll(async () => {
    // Generate the HTML dashboard after all tests
    const dashboardPath = await dashboard.generateHtmlDashboard();
    console.log(`Unified dashboard generated at: ${dashboardPath}`);
  });

  test('Sphere Element Actor comprehensive test', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo('http://localhost:5175/element-actors-demo.html');
    
    try {
      // Test visual state
      await controller.assertVisualState(ComprehensiveUISemanticsSpecs.SphereElementActorSpec);
      
      // Test ergonomic compliance
      await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.SphereElementActorSpec);
      
      // Add visual test result to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Visual Semantics',
        status: 'pass'
      }]);
      
      // Add ergonomic test result to dashboard
      dashboard.addErgonomicTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Ergonomic Compliance',
        status: 'pass',
        requirements: ['minTouchTargetSize', 'minContrastRatio', 'keyboardNavigation', 'screenReaderSupport', 'maxResponseTime'],
        failures: []
      }]);
    } catch (error) {
      // Report visual regression
      await reporter.reportRegression({
        componentName: 'SphereElementActor',
        testName: 'Visual Semantics',
        failureType: 'visual',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Add failed test result to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Visual Semantics',
        status: 'fail',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
    
    // Collect performance metrics
    try {
      const metrics = await collector.collectMetrics(
        'SphereElementActor',
        'Hover Interaction',
        async () => {
          await controller.hover('canvas');
        }
      );
      
      // Add performance test result to dashboard
      dashboard.addPerformanceTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Hover Interaction',
        status: 'pass',
        metrics
      }]);
    } catch (error) {
      console.error('Performance test failed:', error);
    }
  });

  test('Box Element Actor comprehensive test', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo('http://localhost:5175/element-actors-demo.html');
    
    try {
      // Test visual state
      await controller.assertVisualState(ComprehensiveUISemanticsSpecs.BoxElementActorSpec);
      
      // Test ergonomic compliance
      await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.BoxElementActorSpec);
      
      // Add visual test result to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'BoxElementActor',
        testName: 'Visual Semantics',
        status: 'pass'
      }]);
      
      // Add ergonomic test result to dashboard
      dashboard.addErgonomicTestResults([{
        componentName: 'BoxElementActor',
        testName: 'Ergonomic Compliance',
        status: 'pass',
        requirements: ['minTouchTargetSize', 'minContrastRatio', 'keyboardNavigation', 'screenReaderSupport', 'maxResponseTime'],
        failures: []
      }]);
    } catch (error) {
      // Report visual regression
      await reporter.reportRegression({
        componentName: 'BoxElementActor',
        testName: 'Visual Semantics',
        failureType: 'visual',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Add failed test result to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'BoxElementActor',
        testName: 'Visual Semantics',
        status: 'fail',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
    
    // Collect performance metrics
    try {
      const metrics = await collector.collectMetrics(
        'BoxElementActor',
        'Hover Interaction',
        async () => {
          await controller.hover('canvas');
        }
      );
      
      // Add performance test result to dashboard
      dashboard.addPerformanceTestResults([{
        componentName: 'BoxElementActor',
        testName: 'Hover Interaction',
        status: 'pass',
        metrics
      }]);
    } catch (error) {
      console.error('Performance test failed:', error);
    }
  });

  test('D3 Force Layout comprehensive test', async () => {
    // Navigate to the layout engines demo
    await controller.navigateTo('http://localhost:5175/layout-engines-demo.html');
    
    try {
      // Test visual state
      await controller.assertVisualState(ComprehensiveUISemanticsSpecs.D3ForceLayoutSpec);
      
      // Test ergonomic compliance
      await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.D3ForceLayoutSpec);
      
      // Add visual test result to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Visual Semantics',
        status: 'pass'
      }]);
      
      // Add ergonomic test result to dashboard
      dashboard.addErgonomicTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Ergonomic Compliance',
        status: 'pass',
        requirements: ['minTouchTargetSize', 'minContrastRatio', 'keyboardNavigation', 'screenReaderSupport', 'maxResponseTime'],
        failures: []
      }]);
    } catch (error) {
      // Report visual regression
      await reporter.reportRegression({
        componentName: 'D3ForceLayout',
        testName: 'Visual Semantics',
        failureType: 'visual',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Add failed test result to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Visual Semantics',
        status: 'fail',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
    
    // Collect performance metrics
    try {
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
      
      // Add performance test result to dashboard
      dashboard.addPerformanceTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Layout Execution',
        status: 'pass',
        metrics
      }]);
    } catch (error) {
      console.error('Performance test failed:', error);
    }
  });
});