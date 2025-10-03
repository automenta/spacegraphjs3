import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import { ComprehensiveUISemanticsSpecs } from './specs/comprehensive-ui.semantics';

test.describe('Comprehensive UI Visual Semantics', () => {
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

  // Test Element Actors
  test('Sphere Element Actor visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test sphere element actor visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.SphereElementActorSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.SphereElementActorSpec
    );
  });

  test('Box Element Actor visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test box element actor visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.BoxElementActorSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.BoxElementActorSpec
    );
  });

  test('Text Element Actor visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test text element actor visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.TextElementActorSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.TextElementActorSpec
    );
  });

  test('HTML Node Element Actor visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test HTML node element actor visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.HtmlNodeElementActorSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.HtmlNodeElementActorSpec
    );
  });

  // Test Renderers
  test('Edge Renderer visual semantics', async () => {
    // Navigate to the edge interaction demo
    await controller.navigateTo('http://localhost:5175/edge-interaction.html');

    // Test edge renderer visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.EdgeRendererSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.EdgeRendererSpec
    );
  });

  test('Edge Label visual semantics', async () => {
    // Navigate to the edge interaction demo
    await controller.navigateTo('http://localhost:5175/edge-interaction.html');

    // Test edge label visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.EdgeLabelSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.EdgeLabelSpec
    );
  });

  // Test Interaction Components
  test('Selection Manager visual semantics', async () => {
    // Navigate to the instanced interaction demo
    await controller.navigateTo(
      'http://localhost:5175/instanced-interaction.html'
    );

    // Test selection manager visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.SelectionManagerSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.SelectionManagerSpec
    );
  });

  test('Context Menu visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test context menu visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.ContextMenuSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.ContextMenuSpec
    );
  });

  // Test Layout Engines
  test('D3 Force Layout visual semantics', async () => {
    // Navigate to the layout engines demo
    await controller.navigateTo(
      'http://localhost:5175/layout-engines-demo.html'
    );

    // Test D3 force layout visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.D3ForceLayoutSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.D3ForceLayoutSpec
    );
  });

  test('Circle Layout visual semantics', async () => {
    // Navigate to the layout engines demo
    await controller.navigateTo(
      'http://localhost:5175/layout-engines-demo.html'
    );

    // Test circle layout visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.CircleLayoutSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.CircleLayoutSpec
    );
  });

  test('Grid Layout visual semantics', async () => {
    // Navigate to the layout engines demo
    await controller.navigateTo(
      'http://localhost:5175/layout-engines-demo.html'
    );

    // Test grid layout visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.GridLayoutSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.GridLayoutSpec
    );
  });

  // Test UI Overlays
  test('HUD visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test HUD visual semantics
    await controller.assertVisualState(ComprehensiveUISemanticsSpecs.HUDSpec);
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.HUDSpec
    );
  });

  test('Performance Overlay visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test performance overlay visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.PerformanceOverlaySpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.PerformanceOverlaySpec
    );
  });

  test('Search Filter visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test search filter visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.SearchFilterSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.SearchFilterSpec
    );
  });

  // Test Camera Controls
  test('Camera Controls visual semantics', async () => {
    // Navigate to the element actors demo
    await controller.navigateTo(
      'http://localhost:5175/element-actors-demo.html'
    );

    // Test camera controls visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.CameraControlsSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.CameraControlsSpec
    );
  });

  // Test Instanced Renderer
  test('Instanced Renderer visual semantics', async () => {
    // Navigate to the instanced interaction demo
    await controller.navigateTo(
      'http://localhost:5175/instanced-interaction.html'
    );

    // Test instanced renderer visual semantics
    await controller.assertVisualState(
      ComprehensiveUISemanticsSpecs.InstancedRendererSpec
    );
    await controller.assertErgonomicCompliance(
      ComprehensiveUISemanticsSpecs.InstancedRendererSpec
    );
  });
});
