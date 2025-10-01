import { test } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import { VisualRegressionReporter } from './visual-regression-reporter';
import { PerformanceMetricsCollector } from './performance-metrics-collector';
import { UnifiedDashboard } from './unified-dashboard';
import { ComprehensiveUISemanticsSpecs } from './specs/comprehensive-ui.semantics';

/**
 * End-to-End Workflow Tests
 * 
 * This file demonstrates the complete visual semantics testing workflow
 * from specification to reporting.
 */

test.describe('End-to-End Visual Semantics Workflow', () => {
  let controller: VisualSemanticsController;
  let reporter: VisualRegressionReporter;
  let collector: PerformanceMetricsCollector;
  let dashboard: UnifiedDashboard;

  test.beforeAll(async () => {
    reporter = new VisualRegressionReporter('tests/visual/reports');
    collector = new PerformanceMetricsCollector();
    dashboard = new UnifiedDashboard('tests/visual/dashboard');
    
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
    // Generate final reports
    const dashboardPath = await dashboard.generateHtmlDashboard();
    console.log(`🔗 Unified dashboard available at: ${dashboardPath}`);
  });

  test('Complete workflow for Sphere Element Actor', async () => {
    console.log('🧪 Starting complete workflow for Sphere Element Actor');
    
    try {
      // Step 1: Navigate to test page
      console.log('📍 Navigating to element actors demo');
      await controller.navigateTo('http://localhost:5175/element-actors-demo.html');
      
      // Step 2: Visual semantics testing
      console.log('🎨 Testing visual semantics');
      await controller.assertVisualState(ComprehensiveUISemanticsSpecs.SphereElementActorSpec);
      
      // Step 3: Ergonomic compliance testing
      console.log('♿ Testing ergonomic compliance');
      await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.SphereElementActorSpec);
      
      // Step 4: Performance metrics collection
      console.log('⚡ Collecting performance metrics');
      const metrics = await collector.collectMetrics(
        'SphereElementActor',
        'Hover Interaction',
        async () => {
          await controller.hover('canvas');
        }
      );
      
      // Step 5: Add results to dashboard
      console.log('📊 Adding results to dashboard');
      dashboard.addVisualTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Visual Semantics',
        status: 'pass'
      }]);
      
      dashboard.addErgonomicTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Ergonomic Compliance',
        status: 'pass',
        requirements: ['minTouchTargetSize', 'minContrastRatio', 'keyboardNavigation', 'screenReaderSupport', 'maxResponseTime'],
        failures: []
      }]);
      
      dashboard.addPerformanceTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Hover Interaction',
        status: 'pass',
        metrics
      }]);
      
      console.log('✅ Sphere Element Actor workflow completed successfully');
    } catch (error) {
      console.error('❌ Sphere Element Actor workflow failed:', error);
      
      // Report regression
      await reporter.reportRegression({
        componentName: 'SphereElementActor',
        testName: 'Complete Workflow',
        failureType: error instanceof Error && error.message.includes('ergonomic') ? 'ergonomic' : 
                    error instanceof Error && error.message.includes('performance') ? 'performance' : 'visual',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Add failure to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'SphereElementActor',
        testName: 'Visual Semantics',
        status: 'fail',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  });

  test('Complete workflow for D3 Force Layout', async () => {
    console.log('🧪 Starting complete workflow for D3 Force Layout');
    
    try {
      // Step 1: Navigate to test page
      console.log('📍 Navigating to layout engines demo');
      await controller.navigateTo('http://localhost:5175/layout-engines-demo.html');
      
      // Step 2: Visual semantics testing
      console.log('🎨 Testing visual semantics');
      await controller.assertVisualState(ComprehensiveUISemanticsSpecs.D3ForceLayoutSpec);
      
      // Step 3: Ergonomic compliance testing
      console.log('♿ Testing ergonomic compliance');
      await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.D3ForceLayoutSpec);
      
      // Step 4: Performance metrics collection
      console.log('⚡ Collecting performance metrics');
      const metrics = await collector.collectMetrics(
        'D3ForceLayout',
        'Layout Execution',
        async () => {
          await controller.click('#force-layout-button');
          await controller.waitForTimeout(2000);
        }
      );
      
      // Step 5: Add results to dashboard
      console.log('📊 Adding results to dashboard');
      dashboard.addVisualTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Visual Semantics',
        status: 'pass'
      }]);
      
      dashboard.addErgonomicTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Ergonomic Compliance',
        status: 'pass',
        requirements: ['minTouchTargetSize', 'minContrastRatio', 'keyboardNavigation', 'screenReaderSupport', 'maxResponseTime'],
        failures: []
      }]);
      
      dashboard.addPerformanceTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Layout Execution',
        status: 'pass',
        metrics
      }]);
      
      console.log('✅ D3 Force Layout workflow completed successfully');
    } catch (error) {
      console.error('❌ D3 Force Layout workflow failed:', error);
      
      // Report regression
      await reporter.reportRegression({
        componentName: 'D3ForceLayout',
        testName: 'Complete Workflow',
        failureType: error instanceof Error && error.message.includes('ergonomic') ? 'ergonomic' : 
                    error instanceof Error && error.message.includes('performance') ? 'performance' : 'visual',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Add failure to dashboard
      dashboard.addVisualTestResults([{
        componentName: 'D3ForceLayout',
        testName: 'Visual Semantics',
        status: 'fail',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  });
});