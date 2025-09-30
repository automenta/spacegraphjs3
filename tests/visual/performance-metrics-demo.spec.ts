import { test } from '@playwright/test';
import { EnhancedVisualSemanticsController } from './enhanced-visual-semantics-controller';
import { performanceMetricsCollector } from './performance-metrics-collector';

/**
 * Demo test for Performance Metrics Collection
 * 
 * This test demonstrates the performance metrics collection capabilities
 * integrated with visual semantics testing.
 */

test.describe('Performance Metrics Collection Demo', () => {
  let controller: EnhancedVisualSemanticsController;

  test.beforeEach(async () => {
    // Initialize performance metrics collector
    await performanceMetricsCollector.initialize();
    
    // Initialize visual semantics controller
    controller = await EnhancedVisualSemanticsController.init({
      viewport: { width: 1280, height: 720 },
      headless: true
    });
  });

  test.afterEach(async () => {
    if (controller) {
      await controller.cleanup();
    }
    
    // Generate performance report
    const reportPath = await performanceMetricsCollector.generateReport();
    console.log(`Performance report generated: ${reportPath}`);
    
    // Generate dashboard
    const dashboardPath = await performanceMetricsCollector.generateDashboard();
    console.log(`Performance dashboard generated: ${dashboardPath}`);
  });

  test('Collect performance metrics for various interactions', async () => {
    // Navigate to element actors demo
    const navigationStart = Date.now();
    await controller.navigateTo('http://localhost:5175/element-actors-demo.html');
    const navigationDuration = Date.now() - navigationStart;
    
    // Record navigation performance
    performanceMetricsCollector.recordMetric({
      component: 'GraphRenderer',
      interactionType: 'navigation',
      duration: navigationDuration
    });
    
    // Perform hover interaction
    const hoverStart = Date.now();
    await controller.hover('canvas', {
      position: { x: 640, y: 360 }
    });
    const hoverDuration = Date.now() - hoverStart;
    
    // Record hover performance
    performanceMetricsCollector.recordMetric({
      component: 'GraphNode',
      interactionType: 'hover',
      duration: hoverDuration
    });
    
    // Perform click interaction
    const clickStart = Date.now();
    await controller.click('canvas', {
      position: { x: 640, y: 360 }
    });
    const clickDuration = Date.now() - clickStart;
    
    // Record click performance
    performanceMetricsCollector.recordMetric({
      component: 'GraphNode',
      interactionType: 'click',
      duration: clickDuration
    });
    
    // Perform drag interaction
    const dragStart = Date.now();
    await controller.drag('canvas', 'canvas', {
      sourcePosition: { x: 600, y: 300 },
      targetPosition: { x: 700, y: 400 }
    });
    const dragDuration = Date.now() - dragStart;
    
    // Record drag performance
    performanceMetricsCollector.recordMetric({
      component: 'GraphRenderer',
      interactionType: 'drag',
      duration: dragDuration
    });
    
    // Perform scroll interaction
    const scrollStart = Date.now();
    await controller.scroll('canvas', { deltaY: -100 });
    const scrollDuration = Date.now() - scrollStart;
    
    // Record scroll performance
    performanceMetricsCollector.recordMetric({
      component: 'CameraControls',
      interactionType: 'scroll',
      duration: scrollDuration
    });
    
    // Perform keyboard interaction
    const keyboardStart = Date.now();
    await controller.keyboard('h');
    const keyboardDuration = Date.now() - keyboardStart;
    
    // Record keyboard performance
    performanceMetricsCollector.recordMetric({
      component: 'HUD',
      interactionType: 'keyboard',
      duration: keyboardDuration
    });
    
    // Log collected metrics
    const metrics = performanceMetricsCollector.getMetrics();
    console.log(`Collected ${metrics.length} performance metrics`);
    
    // Analyze metrics by component
    const graphNodeMetrics = performanceMetricsCollector.getMetricsByComponent('GraphNode');
    const graphRendererMetrics = performanceMetricsCollector.getMetricsByComponent('GraphRenderer');
    
    console.log(`GraphNode interactions: ${graphNodeMetrics.length}`);
    console.log(`GraphRenderer interactions: ${graphRendererMetrics.length}`);
    
    // Calculate statistics
    const hoverMetrics = performanceMetricsCollector.getMetricsByType('hover');
    if (hoverMetrics.length > 0) {
      const hoverStats = performanceMetricsCollector.calculateStatistics(hoverMetrics);
      console.log(`Hover performance - Avg: ${hoverStats.average.toFixed(2)}ms, Min: ${hoverStats.min}ms, Max: ${hoverStats.max}ms`);
    }
  });
  
  test('Performance regression detection', async () => {
    // Set baseline performance metrics
    await performanceMetricsCollector.setBaseline('GraphNode', 'hover', {
      count: 10,
      average: 50,
      median: 48,
      min: 40,
      max: 65,
      stdDev: 5
    });
    
    await performanceMetricsCollector.setBaseline('GraphRenderer', 'drag', {
      count: 10,
      average: 120,
      median: 115,
      min: 100,
      max: 150,
      stdDev: 15
    });
    
    // Simulate new performance measurements
    performanceMetricsCollector.recordMetric({
      component: 'GraphNode',
      interactionType: 'hover',
      duration: 55 // Slightly slower than baseline
    });
    
    performanceMetricsCollector.recordMetric({
      component: 'GraphRenderer',
      interactionType: 'drag',
      duration: 140 // Significantly slower than baseline
    });
    
    // Check for regressions
    const hoverComparison = performanceMetricsCollector.compareWithBaseline('GraphNode', 'hover');
    const dragComparison = performanceMetricsCollector.compareWithBaseline('GraphRenderer', 'drag');
    
    if (hoverComparison) {
      console.log(`Hover comparison: ${hoverComparison.regression ? 'REGRESSION' : hoverComparison.improvement ? 'IMPROVEMENT' : 'STABLE'}`);
      console.log(`Difference: ${hoverComparison.difference.toFixed(2)}ms`);
    }
    
    if (dragComparison) {
      console.log(`Drag comparison: ${dragComparison.regression ? 'REGRESSION' : dragComparison.improvement ? 'IMPROVEMENT' : 'STABLE'}`);
      console.log(`Difference: ${dragComparison.difference.toFixed(2)}ms`);
    }
  });
});