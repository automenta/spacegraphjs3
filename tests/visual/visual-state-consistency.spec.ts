import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import * as path from 'path';
import * as THREE from 'three';

/**
 * Visual State Consistency Tests
 * Tests visual feedback persistence and cross-plugin state synchronization
 */
test.describe('Visual State Consistency Tests', () => {
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
   * Test screenshot validation during camera transitions
   */
  test('Screenshot validation during camera transitions', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test nodes for visual validation
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 6; i++) {
          nodes.push({
            id: `transition-node-${i}`,
            position: {
              x: Math.cos(i * Math.PI / 3) * 20,
              y: Math.sin(i * Math.PI / 3) * 20,
              z: 0
            },
            label: `Transition ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture baseline state
    await controller.captureScreenshot('camera-transition-baseline.png');

    // Perform camera transition sequence
    const transitionSteps = [
      { name: 'pan-left', target: { x: -15, y: 0, z: 0 }, duration: 800 },
      { name: 'zoom-in', distance: 25, duration: 600 },
      { name: 'rotate', phi: Math.PI / 6, theta: Math.PI / 4, duration: 1000 },
      { name: 'pan-right', target: { x: 15, y: 0, z: 0 }, duration: 800 },
      { name: 'zoom-out', distance: 50, duration: 600 },
    ];

    for (let i = 0; i < transitionSteps.length; i++) {
      const step = transitionSteps[i];

      // Execute camera transition
      await controller.evaluate((step: any) => {
        const graph = (window as any).graph;
        if (graph && graph.cameraPlugin) {
          const targetState: any = {};
          if (step.target) targetState.target = step.target;
          if (step.distance !== undefined) targetState.distance = step.distance;
          if (step.phi !== undefined) targetState.phi = step.phi;
          if (step.theta !== undefined) targetState.theta = step.theta;

          graph.cameraPlugin.flyTo(targetState, {
            duration: step.duration,
            easing: 'easeInOut',
          });
        }
      }, step);

      // Wait for transition to progress
      await controller.waitForTimeout(step.duration / 3);

      // Capture intermediate state
      await controller.captureScreenshot(`camera-transition-${step.name}-mid.png`);

      // Wait for transition to complete
      await controller.waitForTimeout(step.duration);

      // Capture final state of this transition
      await controller.captureScreenshot(`camera-transition-${step.name}-final.png`);

      // Validate visual consistency
      const visualState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          camera: graph.state.camera,
          nodeCount: graph.state.data.nodes.length,
          renderInfo: {
            nodeRenderers: graph.render.getNodeRenderer() ?
              graph.render.getNodeRenderer().getRenderedCount() : 0,
            edgeRenderers: graph.render.getEdgeRenderer() ?
              graph.render.getEdgeRenderer().getRenderedCount() : 0,
          }
        } : null;
      });

      expect(visualState).toBeTruthy();
      expect(visualState!.nodeCount).toBe(6);
      expect(visualState!.camera.distance).toBeGreaterThan(0);
    }

    // Final comprehensive screenshot
    await controller.captureScreenshot('camera-transition-final-comprehensive.png');
  });

  /**
   * Test visual feedback persistence during combined operations
   */
  test('Visual feedback persistence during combined operations', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create nodes with different visual states
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 8; i++) {
          nodes.push({
            id: `feedback-node-${i}`,
            position: {
              x: (i % 4) * 12 - 18,
              y: Math.floor(i / 4) * 12 - 6,
              z: 0
            },
            label: `Feedback ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    const canvas = controller.getLocator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();

    if (canvasBox) {
      // Test sequence of combined operations
      const operations = [
        {
          name: 'hover-multiple',
          actions: async () => {
            // Hover over multiple nodes in sequence
            for (let i = 0; i < 4; i++) {
              const x = canvasBox.x + canvasBox.width * (0.25 + i * 0.15);
              const y = canvasBox.y + canvasBox.height * 0.3;
              await controller.hover('canvas', { position: { x, y } });
              await controller.waitForTimeout(150);
            }
          }
        },
        {
          name: 'select-with-camera-pan',
          actions: async () => {
            // Select nodes while panning camera
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.flyTo({
                  target: { x: 10, y: 0, z: 0 },
                }, { duration: 1000 });
              }
            });

            await controller.waitForTimeout(300);

            // Select nodes during camera movement
            const selectPositions = [
              { x: canvasBox.width * 0.3, y: canvasBox.height * 0.4 },
              { x: canvasBox.width * 0.7, y: canvasBox.height * 0.4 },
            ];

            for (let i = 0; i < selectPositions.length; i++) {
              await controller.click('canvas', {
                position: { x: canvasBox.x + selectPositions[i].x, y: canvasBox.y + selectPositions[i].y },
                modifiers: i === 0 ? [] : ['Control'],
              });
              await controller.waitForTimeout(100);
            }
          }
        },
        {
          name: 'drag-with-zoom',
          actions: async () => {
            // Perform zoom and drag simultaneously
            await controller.keyboard('PageUp'); // Zoom in

            await controller.waitForTimeout(200);

            // Drag selected nodes
            await controller.evaluate(() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const startEvent = new MouseEvent('mousedown', {
                  clientX: canvasBox.x + canvasBox.width * 0.5,
                  clientY: canvasBox.y + canvasBox.height * 0.5,
                  bubbles: true,
                });
                canvas.dispatchEvent(startEvent);

                setTimeout(() => {
                  const moveEvent = new MouseEvent('mousemove', {
                    clientX: canvasBox.x + canvasBox.width * 0.6,
                    clientY: canvasBox.y + canvasBox.height * 0.6,
                    bubbles: true,
                  });
                  canvas.dispatchEvent(moveEvent);
                }, 100);

                setTimeout(() => {
                  const endEvent = new MouseEvent('mouseup', {
                    clientX: canvasBox.x + canvasBox.width * 0.6,
                    clientY: canvasBox.y + canvasBox.height * 0.6,
                    bubbles: true,
                  });
                  canvas.dispatchEvent(endEvent);
                }, 300);
              }
            });
          }
        }
      ];

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];

        // Capture before operation
        await controller.captureScreenshot(`feedback-persistence-before-${operation.name}.png`);

        // Execute operation
        await operation.actions();

        // Wait for operation to complete
        await controller.waitForTimeout(800);

        // Capture after operation
        await controller.captureScreenshot(`feedback-persistence-after-${operation.name}.png`);

        // Validate visual state consistency
        const visualState = await controller.evaluate(() => {
          const graph = (window as any).graph;
          return graph ? {
            hoveredElementId: graph.state.interaction.hoveredElementId,
            selectedElementIds: graph.state.interaction.selectedElementIds,
            camera: graph.state.camera,
          } : null;
        });

        expect(visualState).toBeTruthy();

        // Log state for debugging
        console.log(`After ${operation.name}:`, visualState);
      }
    }
  });

  /**
   * Test cross-plugin visual state synchronization
   */
  test('Cross-plugin visual state synchronization', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test scenario
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 5; i++) {
          nodes.push({
            id: `sync-node-${i}`,
            position: { x: i * 8 - 16, y: 0, z: 0 },
            label: `Sync ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Test synchronization between camera and interaction plugins
    const syncOperations = [
      {
        name: 'camera-to-interaction',
        actions: async () => {
          // Move camera to focus on specific area
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.flyTo({
                target: { x: 8, y: 0, z: 0 },
                distance: 30,
              }, { duration: 800 });
            }
          });

          await controller.waitForTimeout(1000);

          // Try to interact with nodes in the new camera view
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const hoverEvent = new MouseEvent('mousemove', {
              clientX: 400,
              clientY: 360,
              bubbles: true,
            });
            canvas.dispatchEvent(hoverEvent);
          }
        }
      },
      {
        name: 'interaction-to-camera',
        actions: async () => {
          // Select a node
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            await controller.click('canvas', {
              position: { x: canvasBox.x + canvasBox.width * 0.6, y: canvasBox.y + canvasBox.height * 0.5 }
            });

            await controller.waitForTimeout(200);

            // Auto-zoom to selection (camera responds to interaction)
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.frameSelected({ duration: 600 });
              }
            });
          }
        }
      },
      {
        name: 'simultaneous-sync',
        actions: async () => {
          // Perform simultaneous operations
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              // Start camera animation
              graph.cameraPlugin.flyTo({
                target: { x: -8, y: 0, z: 0 },
                phi: Math.PI / 3,
              }, { duration: 1200 });

              // Simulate interaction during camera movement
              setTimeout(() => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  const clickEvent = new MouseEvent('click', {
                    clientX: 600,
                    clientY: 360,
                    bubbles: true,
                  });
                  canvas.dispatchEvent(clickEvent);
                }
              }, 400);
            }
          });
        }
      }
    ];

    for (let i = 0; i < syncOperations.length; i++) {
      const operation = syncOperations[i];

      // Capture before synchronization
      await controller.captureScreenshot(`cross-plugin-sync-before-${operation.name}.png`);

      // Execute synchronization test
      await operation.actions();

      // Wait for synchronization to complete
      await controller.waitForTimeout(1500);

      // Capture after synchronization
      await controller.captureScreenshot(`cross-plugin-sync-after-${operation.name}.png`);

      // Validate synchronization state
      const syncState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          camera: graph.state.camera,
          interaction: graph.state.interaction,
          plugins: {
            camera: !!graph.cameraPlugin,
            interaction: !!graph.interactionPlugin,
          }
        } : null;
      });

      expect(syncState).toBeTruthy();
      expect(syncState!.plugins.camera).toBe(true);
      expect(syncState!.plugins.interaction).toBe(true);

      // Verify state consistency
      expect(syncState!.camera.distance).toBeGreaterThan(0);
      expect(syncState!.camera.target).toBeTruthy();
    }
  });

  /**
   * Test UI element positioning during camera movements
   */
  test('UI element positioning during camera movements', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create nodes for positioning tests
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 7; i++) {
          nodes.push({
            id: `positioning-node-${i}`,
            position: {
              x: Math.cos(i * Math.PI / 3) * 15,
              y: Math.sin(i * Math.PI / 3) * 15,
              z: 0
            },
            label: `Pos ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Test UI element positioning during various camera movements
    const cameraMovements = [
      {
        name: 'orbital-movement',
        cameraAction: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            graph.cameraPlugin.flyTo({
              phi: Math.PI / 4,
              theta: Math.PI / 2,
            }, { duration: 1000 });
          }
        })
      },
      {
        name: 'zoom-movement',
        cameraAction: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            graph.cameraPlugin.flyTo({
              distance: 25,
            }, { duration: 800 });
          }
        })
      },
      {
        name: 'pan-movement',
        cameraAction: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            graph.cameraPlugin.flyTo({
              target: { x: 10, y: 10, z: 0 },
            }, { duration: 1000 });
          }
        })
      },
      {
        name: 'complex-movement',
        cameraAction: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            graph.cameraPlugin.flyTo({
              target: { x: -10, y: -10, z: 5 },
              distance: 35,
              phi: Math.PI / 6,
              theta: -Math.PI / 4,
            }, { duration: 1500 });
          }
        })
      }
    ];

    for (let i = 0; i < cameraMovements.length; i++) {
      const movement = cameraMovements[i];

      // Capture before movement
      await controller.captureScreenshot(`ui-positioning-before-${movement.name}.png`);

      // Execute camera movement
      await movement.cameraAction();

      // Monitor UI element positions during movement
      const checkPositions = async (progress: number) => {
        await controller.waitForTimeout(200);

        const positioningData = await controller.evaluate(() => {
          const graph = (window as any).graph;
          if (!graph) return null;

          const camera = graph.render.getCamera();
          const nodeRenderer = graph.render.getNodeRenderer();

          if (!camera || !nodeRenderer) return null;

          // Get screen positions of nodes
          const nodePositions: any[] = [];
          graph.state.data.nodes.forEach((node: any) => {
            if (node.position) {
              const worldPosition = new THREE.Vector3(
                node.position.x,
                node.position.y,
                node.position.z
              );

              const screenPosition = worldPosition.clone();
              screenPosition.project(camera);

              nodePositions.push({
                id: node.id,
                worldPosition: { x: node.position.x, y: node.position.y, z: node.position.z },
                screenPosition: { x: screenPosition.x, y: screenPosition.y },
                visible: Math.abs(screenPosition.x) <= 1 && Math.abs(screenPosition.y) <= 1,
              });
            }
          });

          return {
            camera: graph.state.camera,
            nodePositions,
            progress,
          };
        });

        if (positioningData) {
          // Validate that nodes are positioned correctly relative to camera
          expect(positioningData.nodePositions.length).toBeGreaterThan(0);

          // Check that camera state is consistent
          expect(positioningData.camera.distance).toBeGreaterThan(0);
          expect(positioningData.camera.target).toBeTruthy();

          // Log positioning data for debugging
          console.log(`${movement.name} progress ${progress}:`, {
            cameraDistance: positioningData.camera.distance,
            visibleNodes: positioningData.nodePositions.filter((n: any) => n.visible).length,
            totalNodes: positioningData.nodePositions.length,
          });
        }

        await controller.captureScreenshot(`ui-positioning-during-${movement.name}-${Math.round(progress * 100)}.png`);
      };

      // Check positions at multiple points during movement
      await checkPositions(0.25);
      await checkPositions(0.5);
      await checkPositions(0.75);

      // Wait for movement to complete
      await controller.waitForTimeout(1000);

      // Final position check
      await checkPositions(1.0);

      // Capture after movement
      await controller.captureScreenshot(`ui-positioning-after-${movement.name}.png`);
    }
  });

  /**
   * Test visual state consistency across rapid operations
   */
  test('Visual state consistency across rapid operations', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test nodes
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 6; i++) {
          nodes.push({
            id: `rapid-ops-node-${i}`,
            position: { x: i * 10 - 25, y: 0, z: 0 },
            label: `Rapid ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Perform rapid sequence of operations
    const rapidOperations = [
      { type: 'hover', x: 0.3, y: 0.5 },
      { type: 'click', x: 0.3, y: 0.5 },
      { type: 'hover', x: 0.7, y: 0.5 },
      { type: 'click', x: 0.7, y: 0.5, modifiers: ['Control'] },
      { type: 'keyboard', key: 'PageUp' },
      { type: 'keyboard', key: 'PageDown' },
      { type: 'hover', x: 0.5, y: 0.3 },
      { type: 'click', x: 0.5, y: 0.7 },
    ];

    for (let i = 0; i < rapidOperations.length; i++) {
      const op = rapidOperations[i];

      // Capture before each operation
      await controller.captureScreenshot(`rapid-ops-before-${i}-${op.type}.png`);

      // Execute operation
      switch (op.type) {
        case 'hover':
          await controller.hover('canvas', {
            position: {
              x: 1280 * op.x!,
              y: 720 * op.y!
            }
          });
          break;
        case 'click':
          await controller.click('canvas', {
            position: {
              x: 1280 * op.x!,
              y: 720 * op.y!
            },
            modifiers: op.modifiers as any,
          });
          break;
        case 'keyboard':
          await controller.keyboard(op.key!);
          break;
      }

      // Brief wait between operations
      await controller.waitForTimeout(100);

      // Capture after each operation
      await controller.captureScreenshot(`rapid-ops-after-${i}-${op.type}.png`);

      // Validate state consistency after each operation
      const stateAfterOp = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          camera: graph.state.camera,
          interaction: graph.state.interaction,
          timestamp: Date.now(),
        } : null;
      });

      expect(stateAfterOp).toBeTruthy();
      expect(stateAfterOp!.camera.distance).toBeGreaterThan(0);
      expect(stateAfterOp!.camera.target).toBeTruthy();

      // Ensure state is not corrupted
      expect(isFinite(stateAfterOp!.camera.distance)).toBe(true);
      expect(isFinite(stateAfterOp!.camera.phi)).toBe(true);
      expect(isFinite(stateAfterOp!.camera.theta)).toBe(true);
    }

    // Final comprehensive validation
    const finalState = await controller.evaluate(() => {
      const graph = (window as any).graph;
      return graph ? {
        camera: graph.state.camera,
        interaction: graph.state.interaction,
        data: {
          nodeCount: graph.state.data.nodes.length,
          edgeCount: graph.state.data.edges.length,
        }
      } : null;
    });

    expect(finalState).toBeTruthy();
    expect(finalState!.data.nodeCount).toBe(6);
    expect(finalState!.camera.distance).toBeGreaterThan(0);

    await controller.captureScreenshot('rapid-ops-final-state.png');
  });
});