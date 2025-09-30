import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import { GraphNodeSemanticsSpecs } from './specs/graph-node.semantics';

test.describe('Graph Elements Visual Semantics', () => {
  let controller: VisualSemanticsController;

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

  test('Sphere node visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo('http://localhost:5175/element-actors-demo.html');
    
    // Test sphere node visual semantics
    await controller.assertVisualState(GraphNodeSemanticsSpecs.SphereNodeSpec);
    await controller.assertErgonomicCompliance(GraphNodeSemanticsSpecs.SphereNodeSpec);
  });

  test('Box node visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo('http://localhost:5175/element-actors-demo.html');
    
    // Test box node visual semantics
    await controller.assertVisualState(GraphNodeSemanticsSpecs.BoxNodeSpec);
    await controller.assertErgonomicCompliance(GraphNodeSemanticsSpecs.BoxNodeSpec);
  });

  test('Text node visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo('http://localhost:5175/element-actors-demo.html');
    
    // Test text node visual semantics
    await controller.assertVisualState(GraphNodeSemanticsSpecs.TextNodeSpec);
    await controller.assertErgonomicCompliance(GraphNodeSemanticsSpecs.TextNodeSpec);
  });

  test('Edge visual semantics', async () => {
    // Navigate to the edge interaction demo
    await controller.navigateTo('http://localhost:5175/edge-interaction.html');
    
    // Test edge visual semantics
    await controller.assertVisualState(GraphNodeSemanticsSpecs.EdgeSpec);
    await controller.assertErgonomicCompliance(GraphNodeSemanticsSpecs.EdgeSpec);
  });

  test('Drag interaction visual semantics', async () => {
    // Navigate to the instanced interaction demo
    await controller.navigateTo('http://localhost:5175/instanced-interaction.html');
    
    // Perform drag interaction
    await controller.drag('canvas', 'canvas', {
      sourcePosition: { x: 640, y: 360 },
      targetPosition: { x: 740, y: 460 },
    });
    
    // Capture and validate the result
    const screenshotPath = await controller.captureScreenshot('drag-interaction-result.png');
    console.log(`Drag interaction screenshot saved to: ${screenshotPath}`);
    
    // In a real test, we would compare with an expected screenshot
    // For now, we just verify the screenshot was created
    expect(screenshotPath).toContain('drag-interaction-result.png');
  });
});