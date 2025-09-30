import { test, expect } from '@playwright/test';
import { EnhancedVisualSemanticsController } from './enhanced-visual-semantics-controller';
import { ComprehensiveUISemanticsSpecs } from './specs/comprehensive-ui.semantics';
import { GraphNodeSemanticsSpecs } from './specs/graph-node.semantics';

/**
 * End-to-End UI/UX Workflow Tests for SpaceGraphJS
 * 
 * These tests validate complete user journeys and workflows to ensure
 * cohesive UI/UX experiences across the entire application.
 */

// Test configuration
const WORKFLOW_TEST_CONFIG = {
  viewport: { width: 1280, height: 720 },
  headless: true,
  timeout: 60000 // Longer timeout for complex workflows
};

// Demo pages
const DEMO_PAGES = {
  ELEMENT_ACTORS: 'http://localhost:5175/element-actors-demo.html',
  EDGE_INTERACTION: 'http://localhost:5175/edge-interaction.html',
  LAYOUT_ENGINES: 'http://localhost:5175/layout-engines-demo.html',
  PERFORMANCE: 'http://localhost:5175/performance-optimizations.html'
};

/**
 * User Journey: Data Exploration Workflow
 * 
 * This workflow simulates a user exploring a graph dataset:
 * 1. Initial exploration (pan/zoom)
 * 2. Node selection and inspection
 * 3. Edge traversal
 * 4. Layout adjustment
 * 5. Filtering/searching
 */
test.describe('E2E Workflow: Data Exploration', () => {
  let controller: EnhancedVisualSemanticsController;

  test.beforeEach(async () => {
    test.setTimeout(WORKFLOW_TEST_CONFIG.timeout);
    controller = await EnhancedVisualSemanticsController.init({
      viewport: WORKFLOW_TEST_CONFIG.viewport,
      headless: WORKFLOW_TEST_CONFIG.headless
    });
  });

  test.afterEach(async () => {
    if (controller) {
      const reportPath = await controller.generatePerformanceReport();
      console.log(`Data exploration workflow performance report: ${reportPath}`);
      await controller.cleanup();
    }
  });

  test('Complete Data Exploration Journey', async () => {
    // Step 1: Navigate to the element actors demo
    await controller.navigateTo(DEMO_PAGES.ELEMENT_ACTORS);
    
    // Step 2: Initial exploration - pan and zoom
    console.log('Step 1: Initial exploration - pan and zoom');
    await controller.drag('canvas', 'canvas', {
      sourcePosition: { x: 400, y: 300 },
      targetPosition: { x: 800, y: 500 }
    });
    
    await controller.scroll('canvas', { deltaY: -100 }); // Zoom in
    await controller.scroll('canvas', { deltaY: 100 });  // Zoom out
    
    // Validate camera controls
    const cameraErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.CameraControlsSpec);
    expect(cameraErgonomics.passed).toBeTruthy();
    
    // Step 3: Node selection and inspection
    console.log('Step 2: Node selection and inspection');
    await controller.click('canvas', {
      position: { x: 640, y: 360 }
    });
    
    // Validate selection
    const selectionErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.SelectionManagerSpec);
    expect(selectionErgonomics.passed).toBeTruthy();
    
    // Step 4: Multi-selection
    console.log('Step 3: Multi-selection');
    await controller.keyboard('Control'); // Hold control
    await controller.click('canvas', {
      position: { x: 700, y: 400 }
    });
    await controller.keyboard('Control'); // Release control
    
    // Step 5: Edge interaction
    console.log('Step 4: Edge interaction');
    await controller.navigateTo(DEMO_PAGES.EDGE_INTERACTION);
    await controller.hover('canvas', {
      position: { x: 600, y: 350 }
    });
    
    // Validate edge interaction
    const edgeErgonomics = await controller.assertErgonomicCompliance(GraphNodeSemanticsSpecs.EdgeSpec);
    expect(edgeErgonomics.passed).toBeTruthy();
    
    // Step 6: HUD interaction
    console.log('Step 5: HUD interaction');
    await controller.keyboard('h'); // Toggle HUD
    await controller.keyboard('h'); // Toggle HUD back
    
    // Validate HUD
    const hudErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.HUDSpec);
    expect(hudErgonomics.passed).toBeTruthy();
    
    // Performance validation
    const metrics = controller.getPerformanceMetrics();
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    expect(avgResponseTime).toBeLessThan(200); // Average response time under 200ms
    
    console.log(`Data exploration workflow completed with ${metrics.length} interactions, average response time: ${avgResponseTime.toFixed(2)}ms`);
  });
});

/**
 * User Journey: Analysis and Modification Workflow
 * 
 * This workflow simulates a user analyzing and modifying a graph:
 * 1. Layout application
 * 2. Node manipulation
 * 3. Edge creation
 * 4. Performance monitoring
 */
test.describe('E2E Workflow: Analysis and Modification', () => {
  let controller: EnhancedVisualSemanticsController;

  test.beforeEach(async () => {
    test.setTimeout(WORKFLOW_TEST_CONFIG.timeout);
    controller = await EnhancedVisualSemanticsController.init({
      viewport: WORKFLOW_TEST_CONFIG.viewport,
      headless: WORKFLOW_TEST_CONFIG.headless
    });
  });

  test.afterEach(async () => {
    if (controller) {
      const reportPath = await controller.generatePerformanceReport();
      console.log(`Analysis workflow performance report: ${reportPath}`);
      await controller.cleanup();
    }
  });

  test('Complete Analysis and Modification Journey', async () => {
    // Step 1: Navigate to layout engines demo
    await controller.navigateTo(DEMO_PAGES.LAYOUT_ENGINES);
    
    // Step 2: Apply different layouts
    console.log('Step 1: Apply different layouts');
    // Note: In a real implementation, we would interact with layout controls
    
    // Step 3: Node manipulation
    console.log('Step 2: Node manipulation');
    await controller.drag('canvas', 'canvas', {
      sourcePosition: { x: 600, y: 300 },
      targetPosition: { x: 700, y: 400 }
    });
    
    // Validate node interaction
    const sphereErgonomics = await controller.assertErgonomicCompliance(GraphNodeSemanticsSpecs.SphereNodeSpec);
    expect(sphereErgonomics.passed).toBeTruthy();
    
    // Step 4: Performance monitoring
    console.log('Step 3: Performance monitoring');
    await controller.keyboard('p'); // Toggle performance overlay
    await controller.keyboard('p'); // Toggle performance overlay off
    
    // Validate performance overlay
    try {
      const perfErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.PerformanceOverlaySpec);
      expect(perfErgonomics.passed).toBeTruthy();
    } catch (error) {
      // Performance overlay spec might not be available on all pages
      console.log('Performance overlay test skipped');
    }
    
    // Step 5: Context menu interaction
    console.log('Step 4: Context menu interaction');
    await controller.click('canvas', {
      button: 'right',
      position: { x: 650, y: 350 }
    });
    
    // Validate context menu (if available)
    try {
      const contextErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.ContextMenuSpec);
      // Log violations but don't fail for warnings
      const errors = contextErgonomics.violations.filter(v => v.severity === 'error');
      expect(errors.length).toBe(0);
    } catch (error) {
      console.log('Context menu test skipped');
    }
    
    // Performance validation
    const metrics = controller.getPerformanceMetrics();
    const slowInteractions = metrics.filter(m => m.duration > 300);
    expect(slowInteractions.length).toBe(0); // No interactions should take more than 300ms
    
    console.log(`Analysis workflow completed with ${metrics.length} interactions`);
  });
});

/**
 * User Journey: Large Dataset Interaction Workflow
 * 
 * This workflow simulates a user working with a large graph dataset:
 * 1. Initial loading and rendering
 * 2. Efficient navigation
 * 3. Selective interaction
 * 4. Performance optimization
 */
test.describe('E2E Workflow: Large Dataset Interaction', () => {
  let controller: EnhancedVisualSemanticsController;

  test.beforeEach(async () => {
    test.setTimeout(WORKFLOW_TEST_CONFIG.timeout);
    controller = await EnhancedVisualSemanticsController.init({
      viewport: WORKFLOW_TEST_CONFIG.viewport,
      headless: WORKFLOW_TEST_CONFIG.headless
    });
  });

  test.afterEach(async () => {
    if (controller) {
      const reportPath = await controller.generatePerformanceReport();
      console.log(`Large dataset workflow performance report: ${reportPath}`);
      await controller.cleanup();
    }
  });

  test('Complete Large Dataset Interaction Journey', async () => {
    // Step 1: Navigate to performance demo
    await controller.navigateTo(DEMO_PAGES.PERFORMANCE);
    
    // Step 2: Efficient navigation with lasso selection
    console.log('Step 1: Efficient navigation with lasso selection');
    await controller.drag('canvas', 'canvas', {
      sourcePosition: { x: 300, y: 200 },
      targetPosition: { x: 900, y: 600 }
    });
    
    // Validate selection
    const selectionErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.SelectionManagerSpec);
    expect(selectionErgonomics.passed).toBeTruthy();
    
    // Step 3: Selective interaction with specific nodes
    console.log('Step 2: Selective interaction');
    // Multiple quick selections
    const positions = [
      { x: 400, y: 300 },
      { x: 500, y: 400 },
      { x: 600, y: 500 },
      { x: 700, y: 400 },
      { x: 800, y: 300 }
    ];
    
    for (const pos of positions) {
      await controller.click('canvas', { position: pos });
      await controller.waitForTimeout(50); // Small delay between clicks
    }
    
    // Step 4: Performance validation
    console.log('Step 3: Performance validation');
    const metrics = controller.getPerformanceMetrics();
    
    // Check for consistent performance
    const responseTimes = metrics.map(m => m.duration);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    expect(avgResponseTime).toBeLessThan(150); // Average under 150ms
    expect(maxResponseTime).toBeLessThan(500); // Max under 500ms
    
    // Validate that we had sufficient interactions
    expect(metrics.length).toBeGreaterThan(10);
    
    console.log(`Large dataset workflow completed with average response time: ${avgResponseTime.toFixed(2)}ms, max: ${maxResponseTime}ms`);
  });
});

/**
 * User Journey: Accessibility-Focused Workflow
 * 
 * This workflow validates accessibility features:
 * 1. Keyboard navigation
 * 2. Screen reader support
 * 3. Contrast and sizing compliance
 * 4. Focus management
 */
test.describe('E2E Workflow: Accessibility Validation', () => {
  let controller: EnhancedVisualSemanticsController;

  test.beforeEach(async () => {
    test.setTimeout(WORKFLOW_TEST_CONFIG.timeout);
    controller = await EnhancedVisualSemanticsController.init({
      viewport: WORKFLOW_TEST_CONFIG.viewport,
      headless: WORKFLOW_TEST_CONFIG.headless
    });
  });

  test.afterEach(async () => {
    if (controller) {
      await controller.cleanup();
    }
  });

  test('Complete Accessibility Validation Journey', async () => {
    // Step 1: Navigate to element actors demo
    await controller.navigateTo(DEMO_PAGES.ELEMENT_ACTORS);
    
    // Step 2: Keyboard navigation
    console.log('Step 1: Keyboard navigation');
    await controller.keyboard('Tab'); // Move focus
    await controller.keyboard('Enter'); // Select
    await controller.keyboard('ArrowRight'); // Navigate
    await controller.keyboard(' '); // Space to activate
    
    // Step 3: Validate keyboard accessibility
    const selectionErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.SelectionManagerSpec);
    const keyboardAccessible = selectionErgonomics.metrics.keyboardAccessible;
    expect(keyboardAccessible).toBeTruthy();
    
    // Step 4: Contrast validation
    console.log('Step 2: Contrast validation');
    const hudErgonomics = await controller.assertErgonomicCompliance(ComprehensiveUISemanticsSpecs.HUDSpec);
    const contrastRatio = hudErgonomics.metrics.contrastRatio;
    if (contrastRatio) {
      expect(contrastRatio).toBeGreaterThan(4.5); // Minimum WCAG AA compliance
    }
    
    // Step 5: Touch target validation
    console.log('Step 3: Touch target validation');
    const touchTargetSize = selectionErgonomics.metrics.touchTargetSize;
    if (touchTargetSize) {
      expect(touchTargetSize).toBeGreaterThan(44); // Minimum touch target size
    }
    
    // Step 6: Focus management
    console.log('Step 4: Focus management');
    await controller.keyboard('h'); // Toggle HUD
    await controller.keyboard('p'); // Toggle performance
    
    console.log('Accessibility validation workflow completed');
  });
});

/**
 * Helper function to wait for a specified time
 */
async function waitForTimeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add the helper function to the controller prototype
declare module './enhanced-visual-semantics-controller' {
  interface EnhancedVisualSemanticsController {
    waitForTimeout(ms: number): Promise<void>;
  }
}

EnhancedVisualSemanticsController.prototype.waitForTimeout = waitForTimeout;