import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import * as path from 'path';

/**
 * Camera-Interaction Integration Tests
 * Tests camera behavior during various interaction scenarios
 */
test.describe('Camera-Interaction Integration Tests', () => {
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

  /**
   * Test camera pan during node drag operations
   */
  test('Camera pan during node drag operations', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    // Wait for graph initialization
    await controller.waitForTimeout(2000);

    // Create test scenario with multiple nodes
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        // Add test nodes in a pattern that allows for dragging
        const nodes = [];
        for (let i = 0; i < 5; i++) {
          nodes.push({
            id: `test-node-${i}`,
            position: { x: i * 10 - 20, y: 0, z: 0 },
            label: `Node ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    // Wait for nodes to render
    await controller.waitForTimeout(1000);

    // Capture initial state
    const initialScreenshot = await controller.captureScreenshot('camera-drag-initial.png');

    // Find and drag a node while monitoring camera behavior
    const canvas = controller.getLocator('canvas');

    // Get canvas bounds for precise interaction
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();

    if (canvasBox) {
      // Position mouse over a node (approximately center-left)
      const nodeX = canvasBox.x + canvasBox.width * 0.3;
      const nodeY = canvasBox.y + canvasBox.height * 0.5;

      // Hover to identify node
      await controller.hover('canvas', { position: { x: nodeX, y: nodeY } });
      await controller.waitForTimeout(200);

      // Start dragging
      await controller.evaluate(() => {
        const graph = (window as any).graph;
        if (graph && graph.plugins) {
          // Trigger drag start programmatically for consistent testing
          const event = new MouseEvent('mousedown', {
            clientX: 300,
            clientY: 360,
            bubbles: true,
          });
          const canvas = document.querySelector('canvas');
          if (canvas) canvas.dispatchEvent(event);
        }
      });

      // Simulate drag movement
      await controller.waitForTimeout(100);

      // Move mouse while dragging
      await controller.evaluate(() => {
        const event = new MouseEvent('mousemove', {
          clientX: 500,
          clientY: 360,
          bubbles: true,
        });
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.dispatchEvent(event);
      });

      await controller.waitForTimeout(500);

      // End drag
      await controller.evaluate(() => {
        const event = new MouseEvent('mouseup', {
          clientX: 500,
          clientY: 360,
          bubbles: true,
        });
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.dispatchEvent(event);
      });

      // Capture state after drag
      const afterDragScreenshot = await controller.captureScreenshot('camera-drag-after.png');

      // Verify camera state consistency
      const cameraState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          target: graph.state.camera.target,
          distance: graph.state.camera.distance,
          phi: graph.state.camera.phi,
          theta: graph.state.camera.theta,
        } : null;
      });

      expect(cameraState).toBeTruthy();
      expect(cameraState!.distance).toBeGreaterThan(0);
      expect(cameraState!.phi).toBeGreaterThanOrEqual(0);
      expect(cameraState!.phi).toBeLessThanOrEqual(Math.PI);
    }
  });

  /**
   * Test camera zoom during multi-selection
   */
  test('Camera zoom during multi-selection', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    // Wait for graph initialization
    await controller.waitForTimeout(2000);

    // Create test nodes for multi-selection
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 8; i++) {
          nodes.push({
            id: `zoom-test-node-${i}`,
            position: { x: (i % 4) * 15 - 22.5, y: Math.floor(i / 4) * 15 - 7.5, z: 0 },
            label: `Zoom Node ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture initial state
    await controller.captureScreenshot('camera-zoom-multiselect-initial.png');

    const canvas = controller.getLocator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();

    if (canvasBox) {
      // Select multiple nodes with Ctrl+Click
      const nodePositions = [
        { x: canvasBox.x + canvasBox.width * 0.25, y: canvasBox.y + canvasBox.height * 0.25 },
        { x: canvasBox.x + canvasBox.width * 0.75, y: canvasBox.y + canvasBox.height * 0.25 },
        { x: canvasBox.x + canvasBox.width * 0.25, y: canvasBox.y + canvasBox.height * 0.75 },
        { x: canvasBox.x + canvasBox.width * 0.75, y: canvasBox.y + canvasBox.height * 0.75 },
      ];

      for (let i = 0; i < nodePositions.length; i++) {
        await controller.click('canvas', {
          position: nodePositions[i],
          modifiers: i === 0 ? [] : ['Control'],
        });
        await controller.waitForTimeout(100);
      }

      // Perform zoom operation while multi-selection is active
      await controller.keyboard('PageDown', { delay: 100 });
      await controller.waitForTimeout(200);

      // Capture state during zoom
      await controller.captureScreenshot('camera-zoom-multiselect-during.png');

      // Verify selection state
      const selectionState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          selectedElementIds: graph.state.interaction.selectedElementIds,
          cameraDistance: graph.state.camera.distance,
        } : null;
      });

      expect(selectionState).toBeTruthy();
      expect(selectionState!.selectedElementIds.length).toBeGreaterThan(0);

      // Test zoom in opposite direction
      await controller.keyboard('PageUp', { delay: 100 });
      await controller.waitForTimeout(200);

      // Final capture
      await controller.captureScreenshot('camera-zoom-multiselect-final.png');
    }
  });

  /**
   * Test camera animation during active interactions
   */
  test('Camera animation during active interactions', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create nodes for interaction testing
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 6; i++) {
          nodes.push({
            id: `animation-test-node-${i}`,
            position: { x: i * 12 - 30, y: 0, z: 0 },
            label: `Animation Node ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture initial state
    await controller.captureScreenshot('camera-animation-initial.png');

    // Start camera animation (flyTo)
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.cameraPlugin) {
        graph.cameraPlugin.flyTo({
          target: { x: 20, y: 0, z: 0 },
          distance: 30,
          phi: Math.PI / 3,
          theta: Math.PI / 6,
        }, {
          duration: 1500,
          easing: 'easeInOut',
        });
      }
    });

    // Wait for animation to start
    await controller.waitForTimeout(300);

    // Perform interactions during animation
    const canvas = controller.getLocator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();

    if (canvasBox) {
      // Try to interact with nodes during camera animation
      const nodeX = canvasBox.x + canvasBox.width * 0.5;
      const nodeY = canvasBox.y + canvasBox.height * 0.5;

      // Hover during animation
      await controller.hover('canvas', { position: { x: nodeX, y: nodeY } });
      await controller.waitForTimeout(200);

      // Capture during animation
      await controller.captureScreenshot('camera-animation-during-hover.png');

      // Click during animation
      await controller.click('canvas', { position: { x: nodeX, y: nodeY } });
      await controller.waitForTimeout(200);

      await controller.captureScreenshot('camera-animation-during-click.png');
    }

    // Wait for animation to complete
    await controller.waitForTimeout(1500);

    // Final capture
    await controller.captureScreenshot('camera-animation-final.png');

    // Verify final camera state
    const finalCameraState = await controller.evaluate(() => {
      const graph = (window as any).graph;
      return graph ? {
        target: graph.state.camera.target,
        distance: graph.state.camera.distance,
        phi: graph.state.camera.phi,
        theta: graph.state.camera.theta,
      } : null;
    });

    expect(finalCameraState).toBeTruthy();
    expect(Math.abs(finalCameraState!.target.x - 20)).toBeLessThan(5);
    expect(Math.abs(finalCameraState!.distance - 30)).toBeLessThan(5);
  });

  /**
   * Test multi-touch camera control with interactions
   */
  test('Multi-touch camera control with interactions', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test nodes
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 4; i++) {
          nodes.push({
            id: `touch-test-node-${i}`,
            position: { x: i * 20 - 30, y: 0, z: 0 },
            label: `Touch Node ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture initial state
    await controller.captureScreenshot('camera-multitouch-initial.png');

    // Simulate touch gestures using the browser's touch API
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.cameraPlugin) {
        // Simulate pinch-to-zoom gesture
        const canvas = document.querySelector('canvas');
        if (canvas) {
          // Create touch events for pinch gesture
          const touchStart1 = new Touch({
            identifier: 0,
            target: canvas,
            clientX: 300,
            clientY: 360,
          });

          const touchStart2 = new Touch({
            identifier: 1,
            target: canvas,
            clientX: 500,
            clientY: 360,
          });

          const touchStartEvent = new TouchEvent('touchstart', {
            touches: [touchStart1, touchStart2],
            targetTouches: [touchStart1, touchStart2],
            changedTouches: [touchStart1, touchStart2],
            bubbles: true,
            cancelable: true,
          });

          canvas.dispatchEvent(touchStartEvent);

          // Simulate pinch movement (zoom out)
          setTimeout(() => {
            const touchMove1 = new Touch({
              identifier: 0,
              target: canvas,
              clientX: 250,
              clientY: 310,
            });

            const touchMove2 = new Touch({
              identifier: 1,
              target: canvas,
              clientX: 550,
              clientY: 410,
            });

            const touchMoveEvent = new TouchEvent('touchmove', {
              touches: [touchMove1, touchMove2],
              targetTouches: [touchMove1, touchMove2],
              changedTouches: [touchMove1, touchMove2],
              bubbles: true,
              cancelable: true,
            });

            canvas.dispatchEvent(touchMoveEvent);
          }, 100);

          // End touch gesture
          setTimeout(() => {
            const touchEndEvent = new TouchEvent('touchend', {
              touches: [],
              targetTouches: [],
              changedTouches: [touchStart1, touchStart2],
              bubbles: true,
              cancelable: true,
            });

            canvas.dispatchEvent(touchEndEvent);
          }, 500);
        }
      }
    });

    await controller.waitForTimeout(1000);

    // Capture after touch gesture
    await controller.captureScreenshot('camera-multitouch-after-zoom.png');

    // Verify camera state after touch interaction
    const cameraState = await controller.evaluate(() => {
      const graph = (window as any).graph;
      return graph ? {
        distance: graph.state.camera.distance,
        target: graph.state.camera.target,
      } : null;
    });

    expect(cameraState).toBeTruthy();
    expect(cameraState!.distance).toBeGreaterThan(0);
  });

  /**
   * Test camera behavior with complex interaction patterns
   */
  test('Complex interaction patterns with camera', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create complex node layout
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        const edges = [];

        // Create a complex graph structure
        for (let i = 0; i < 10; i++) {
          nodes.push({
            id: `complex-node-${i}`,
            position: {
              x: Math.cos(i * Math.PI / 5) * 25,
              y: Math.sin(i * Math.PI / 5) * 25,
              z: 0
            },
            label: `Complex ${i}`,
          });
        }

        // Add some edges
        for (let i = 0; i < 8; i++) {
          edges.push({
            id: `complex-edge-${i}`,
            source: `complex-node-${i}`,
            target: `complex-node-${(i + 1) % 10}`,
          });
        }

        graph.update({
          data: {
            nodes: { add: nodes },
            edges: { add: edges }
          }
        });
      }
    });

    await controller.waitForTimeout(1500);

    const canvas = controller.getLocator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();

    if (canvasBox) {
      // Perform complex interaction sequence
      const interactionSequence = [
        // 1. Pan camera
        { type: 'pan', x: canvasBox.width * 0.7, y: canvasBox.height * 0.5 },
        // 2. Select multiple nodes
        { type: 'multiselect', positions: [
          { x: canvasBox.width * 0.3, y: canvasBox.height * 0.3 },
          { x: canvasBox.width * 0.7, y: canvasBox.height * 0.3 },
          { x: canvasBox.width * 0.5, y: canvasBox.height * 0.7 },
        ]},
        // 3. Zoom while selection is active
        { type: 'zoom', direction: 'in' },
        // 4. Drag selected nodes
        { type: 'drag', from: { x: canvasBox.width * 0.5, y: canvasBox.height * 0.5 },
                       to: { x: canvasBox.width * 0.6, y: canvasBox.height * 0.6 }},
        // 5. Zoom out
        { type: 'zoom', direction: 'out' },
      ];

      for (let i = 0; i < interactionSequence.length; i++) {
        const step = interactionSequence[i];

        switch (step.type) {
          case 'pan':
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.flyTo({
                  target: { x: 15, y: 0, z: 0 },
                }, { duration: 300 });
              }
            });
            break;

          case 'multiselect':
            for (let j = 0; j < step.positions!.length; j++) {
              await controller.click('canvas', {
                position: step.positions![j],
                modifiers: j === 0 ? [] : ['Control'],
              });
              await controller.waitForTimeout(100);
            }
            break;

          case 'zoom':
            await controller.keyboard(step.direction === 'in' ? 'PageUp' : 'PageDown');
            break;

          case 'drag':
            await controller.evaluate(() => {
              // Simulate drag operation
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const startEvent = new MouseEvent('mousedown', {
                  clientX: 400,
                  clientY: 360,
                  bubbles: true,
                });
                canvas.dispatchEvent(startEvent);

                setTimeout(() => {
                  const moveEvent = new MouseEvent('mousemove', {
                    clientX: 500,
                    clientY: 460,
                    bubbles: true,
                  });
                  canvas.dispatchEvent(moveEvent);
                }, 100);

                setTimeout(() => {
                  const endEvent = new MouseEvent('mouseup', {
                    clientX: 500,
                    clientY: 460,
                    bubbles: true,
                  });
                  canvas.dispatchEvent(endEvent);
                }, 300);
              }
            });
            break;
        }

        await controller.waitForTimeout(300);

        // Capture state after each step
        await controller.captureScreenshot(`camera-complex-interaction-step-${i + 1}.png`);
      }

      // Final verification
      const finalState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          camera: graph.state.camera,
          selection: graph.state.interaction.selectedElementIds,
          nodeCount: graph.state.data.nodes.length,
        } : null;
      });

      expect(finalState).toBeTruthy();
      expect(finalState!.nodeCount).toBeGreaterThan(0);
    }
  });
});