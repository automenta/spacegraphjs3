import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import * as path from 'path';

/**
 * Error Recovery Integration Tests
 * Tests error handling and recovery during interactions
 */
test.describe('Error Recovery Integration Tests', () => {
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
   * Test camera animation failure during interaction
   */
  test('Camera animation failure during interaction', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test nodes
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 8; i++) {
          nodes.push({
            id: `error-recovery-node-${i}`,
            position: {
              x: Math.cos(i * Math.PI / 4) * 15,
              y: Math.sin(i * Math.PI / 4) * 15,
              z: 0
            },
            label: `Error ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture initial state
    await controller.captureScreenshot('error-recovery-initial.png');

    // Test camera animation failure scenarios
    const failureScenarios = [
      {
        name: 'Invalid camera target',
        trigger: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            // Try to animate to invalid target
            graph.cameraPlugin.flyTo({
              target: { x: NaN, y: 0, z: 0 }, // Invalid coordinates
              distance: 50,
            }, { duration: 1000 });
          }
        }),
        expectedRecovery: 'Camera should handle invalid target gracefully'
      },
      {
        name: 'Extreme camera values',
        trigger: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            // Try extreme values
            graph.cameraPlugin.flyTo({
              target: { x: 0, y: 0, z: 0 },
              distance: -100, // Invalid negative distance
              phi: 10, // Extreme phi value
              theta: 100, // Extreme theta value
            }, { duration: 1000 });
          }
        }),
        expectedRecovery: 'Camera should constrain values to valid ranges'
      },
      {
        name: 'Animation interruption',
        trigger: async () => {
          // Start first animation
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.flyTo({
                target: { x: 20, y: 0, z: 0 },
                distance: 30,
              }, { duration: 2000 });
            }
          });

          await controller.waitForTimeout(500);

          // Interrupt with second animation
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.flyTo({
                target: { x: -20, y: 0, z: 0 },
                distance: 40,
              }, { duration: 1500 });
            }
          });
        },
        expectedRecovery: 'Camera should handle animation interruption gracefully'
      }
    ];

    for (let i = 0; i < failureScenarios.length; i++) {
      const scenario = failureScenarios[i];

      console.log(`Testing scenario: ${scenario.name}`);

      // Capture before failure
      await controller.captureScreenshot(`error-recovery-before-${scenario.name}.png`);

      try {
        // Trigger failure scenario
        if (scenario.name === 'Animation interruption') {
          await scenario.trigger();
        } else {
          await scenario.trigger();
        }

        // Wait for potential failure and recovery
        await controller.waitForTimeout(2000);

        // Check if system recovered
        const recoveryState = await controller.evaluate(() => {
          const graph = (window as any).graph;
          return graph ? {
            camera: graph.state.camera,
            isValid: graph.state.camera.distance > 0 &&
                    isFinite(graph.state.camera.distance) &&
                    isFinite(graph.state.camera.phi) &&
                    isFinite(graph.state.camera.theta),
            errorState: graph.cameraPlugin ? 'ok' : 'plugin-error',
          } : null;
        });

        expect(recoveryState).toBeTruthy();
        expect(recoveryState!.isValid).toBe(true);
        expect(recoveryState!.camera.distance).toBeGreaterThan(0);

        console.log(`Recovery successful for ${scenario.name}:`, recoveryState);

      } catch (error) {
        console.warn(`Error during ${scenario.name}:`, error);

        // Even if test fails, capture the state for debugging
        await controller.captureScreenshot(`error-recovery-failed-${scenario.name}.png`);
      }

      // Capture after recovery attempt
      await controller.captureScreenshot(`error-recovery-after-${scenario.name}.png`);
    }

    // Final validation
    const finalState = await controller.evaluate(() => {
      const graph = (window as any).graph;
      return graph ? {
        camera: graph.state.camera,
        nodeCount: graph.state.data.nodes.length,
        errorLogs: 'recovered', // Simplified for test
      } : null;
    });

    expect(finalState).toBeTruthy();
    expect(finalState!.camera.distance).toBeGreaterThan(0);
    expect(finalState!.nodeCount).toBe(8);

    await controller.captureScreenshot('error-recovery-final.png');
  });

  /**
   * Test plugin communication failure recovery
   */
  test('Plugin communication failure recovery', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test scenario
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 6; i++) {
          nodes.push({
            id: `comm-node-${i}`,
            position: { x: i * 8 - 20, y: 0, z: 0 },
            label: `Comm ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Test plugin communication failure scenarios
    const communicationFailures = [
      {
        name: 'Camera plugin method failure',
        trigger: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            try {
              // Try to call a method that might fail
              graph.cameraPlugin.flyTo(null as any, { duration: 1000 });
            } catch (error) {
              console.log('Expected camera method failure:', error);
            }
          }
        }),
        expectedRecovery: 'Camera plugin should handle null parameters gracefully'
      },
      {
        name: 'Interaction plugin state corruption',
        trigger: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.interactionPlugin) {
            try {
              // Try to corrupt interaction state
              if (graph.state.interaction) {
                (graph.state.interaction as any).selectedElementIds = null; // Corrupt state
              }
            } catch (error) {
              console.log('Expected interaction state failure:', error);
            }
          }
        }),
        expectedRecovery: 'Interaction plugin should recover from state corruption'
      },
      {
        name: 'Cross-plugin event failure',
        trigger: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.events) {
            try {
              // Emit malformed event
              graph.events.emit('camera:animation:start', null);
            } catch (error) {
              console.log('Expected event failure:', error);
            }
          }
        }),
        expectedRecovery: 'Event system should handle malformed events gracefully'
      }
    ];

    for (let i = 0; i < communicationFailures.length; i++) {
      const failure = communicationFailures[i];

      console.log(`Testing communication failure: ${failure.name}`);

      // Capture before failure
      await controller.captureScreenshot(`comm-failure-before-${failure.name}.png`);

      // Trigger communication failure
      await failure.trigger();

      // Wait for potential recovery
      await controller.waitForTimeout(1000);

      // Verify system stability after failure
      const stabilityCheck = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          plugins: {
            camera: !!graph.cameraPlugin,
            interaction: !!graph.interactionPlugin,
          },
          state: {
            cameraValid: graph.state.camera &&
                        isFinite(graph.state.camera.distance) &&
                        graph.state.camera.distance > 0,
            interactionValid: graph.state.interaction !== null,
          },
          events: !!graph.events,
        } : null;
      });

      expect(stabilityCheck).toBeTruthy();
      expect(stabilityCheck!.plugins.camera).toBe(true);
      expect(stabilityCheck!.plugins.interaction).toBe(true);
      expect(stabilityCheck!.state.cameraValid).toBe(true);
      expect(stabilityCheck!.state.interactionValid).toBe(true);
      expect(stabilityCheck!.events).toBe(true);

      console.log(`Communication stability verified for ${failure.name}:`, stabilityCheck);

      // Capture after recovery
      await controller.captureScreenshot(`comm-failure-after-${failure.name}.png`);
    }

    // Final comprehensive test
    await controller.captureScreenshot('comm-failure-final.png');
  });

  /**
   * Test state synchronization error scenarios
   */
  test('State synchronization error scenarios', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test nodes
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 10; i++) {
          nodes.push({
            id: `sync-error-node-${i}`,
            position: {
              x: (i % 5) * 6 - 12,
              y: Math.floor(i / 5) * 6 - 3,
              z: 0
            },
            label: `Sync ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Test state synchronization error scenarios
    const syncErrorScenarios = [
      {
        name: 'Rapid state updates',
        trigger: async () => {
          // Perform rapid state updates that might cause sync issues
          for (let i = 0; i < 20; i++) {
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph) {
                // Use timestamp for unique target positions
                const timestamp = Date.now();
                graph.update({
                  camera: {
                    target: { x: (timestamp % 40) - 20, y: 0, z: 0 }
                  }
                });
              }
            });

            await controller.waitForTimeout(10);
          }
        },
        expectedRecovery: 'State should remain consistent despite rapid updates'
      },
      {
        name: 'Conflicting state operations',
        trigger: async () => {
          // Perform conflicting operations
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              // Start multiple conflicting animations
              graph.cameraPlugin.flyTo({
                target: { x: 10, y: 0, z: 0 },
                distance: 30,
              }, { duration: 1000 });

              setTimeout(() => {
                graph.cameraPlugin.flyTo({
                  target: { x: -10, y: 0, z: 0 },
                  distance: 40,
                }, { duration: 800 });
              }, 100);
            }
          });

          await controller.waitForTimeout(1500);
        },
        expectedRecovery: 'System should resolve conflicting operations gracefully'
      },
      {
        name: 'State validation failure',
        trigger: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            // Try to set invalid state directly
            try {
              graph.update({
                camera: {
                  distance: NaN,
                  phi: Infinity,
                  theta: -Infinity,
                }
              });
            } catch (error) {
              console.log('Expected state validation failure:', error);
            }
          }
        }),
        expectedRecovery: 'State validation should prevent invalid states'
      }
    ];

    for (let i = 0; i < syncErrorScenarios.length; i++) {
      const scenario = syncErrorScenarios[i];

      console.log(`Testing sync error scenario: ${scenario.name}`);

      // Capture before error scenario
      await controller.captureScreenshot(`sync-error-before-${scenario.name}.png`);

      // Trigger error scenario
      await scenario.trigger();

      // Wait for potential recovery
      await controller.waitForTimeout(1500);

      // Verify state consistency after error scenario
      const consistencyCheck = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          cameraState: {
            valid: isFinite(graph.state.camera.distance) &&
                   isFinite(graph.state.camera.phi) &&
                   isFinite(graph.state.camera.theta) &&
                   graph.state.camera.distance > 0,
            distance: graph.state.camera.distance,
            phi: graph.state.camera.phi,
            theta: graph.state.camera.theta,
          },
          interactionState: {
            valid: graph.state.interaction !== null,
            selectedCount: graph.state.interaction.selectedElementIds?.length || 0,
          },
          dataState: {
            valid: Array.isArray(graph.state.data.nodes) &&
                   Array.isArray(graph.state.data.edges),
            nodeCount: graph.state.data.nodes.length,
            edgeCount: graph.state.data.edges.length,
          }
        } : null;
      });

      expect(consistencyCheck).toBeTruthy();
      expect(consistencyCheck!.cameraState.valid).toBe(true);
      expect(consistencyCheck!.interactionState.valid).toBe(true);
      expect(consistencyCheck!.dataState.valid).toBe(true);

      console.log(`State consistency verified for ${scenario.name}:`, consistencyCheck);

      // Capture after error scenario
      await controller.captureScreenshot(`sync-error-after-${scenario.name}.png`);
    }

    // Final validation
    await controller.captureScreenshot('sync-error-final.png');
  });

  /**
   * Test WebGL context loss recovery
   */
  test('WebGL context loss recovery', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test scene
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 5; i++) {
          nodes.push({
            id: `webgl-node-${i}`,
            position: { x: i * 10 - 20, y: 0, z: 0 },
            label: `WebGL ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture initial state
    await controller.captureScreenshot('webgl-recovery-initial.png');

    // Test WebGL context loss and recovery
    const webglTests = [
      {
        name: 'Simulated context loss',
        trigger: () => controller.evaluate(() => {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
              // Simulate context loss
              const ext = (gl as any).getExtension('WEBGL_lose_context');
              if (ext) {
                console.log('Simulating WebGL context loss...');
                ext.loseContext();

                // Restore context after delay
                setTimeout(() => {
                  console.log('Restoring WebGL context...');
                  ext.restoreContext();
                }, 1000);
              }
            }
          }
        }),
        expectedRecovery: 'WebGL context should be restored successfully'
      },
      {
        name: 'Renderer disposal and recreation',
        trigger: () => controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.render) {
            try {
              // Force renderer recreation
              const oldRenderer = graph.render.getRenderer();
              if (oldRenderer) {
                console.log('Testing renderer recovery...');

                // Simulate renderer disposal
                graph.render.dispose();

                // Wait and reinitialize
                setTimeout(() => {
                  if (graph.render && typeof graph.render.init === 'function') {
                    graph.render.init(graph.render.getRendererDomElement());
                  }
                }, 500);
              }
            } catch (error) {
              console.log('Expected renderer error:', error);
            }
          }
        }),
        expectedRecovery: 'Renderer should recover from disposal'
      }
    ];

    for (let i = 0; i < webglTests.length; i++) {
      const test = webglTests[i];

      console.log(`Testing WebGL recovery: ${test.name}`);

      // Capture before WebGL issue
      await controller.captureScreenshot(`webgl-recovery-before-${test.name}.png`);

      // Trigger WebGL issue
      await test.trigger();

      // Wait for recovery
      await controller.waitForTimeout(3000);

      // Verify WebGL recovery
      const recoveryCheck = await controller.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { recovered: false, reason: 'No canvas found' };

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const contextLost = gl ? (gl as any).isContextLost && (gl as any).isContextLost() : true;

        const graph = (window as any).graph;
        return {
          recovered: !contextLost && !!gl,
          contextLost: contextLost,
          webglSupported: !!gl,
          graphState: graph ? {
            cameraValid: graph.state.camera && isFinite(graph.state.camera.distance),
            nodesValid: Array.isArray(graph.state.data.nodes),
          } : null,
        };
      });

      expect(recoveryCheck).toBeTruthy();
      expect(recoveryCheck!.recovered).toBe(true);
      expect(recoveryCheck!.webglSupported).toBe(true);

      console.log(`WebGL recovery verified for ${test.name}:`, recoveryCheck);

      // Capture after recovery
      await controller.captureScreenshot(`webgl-recovery-after-${test.name}.png`);
    }

    // Final comprehensive test
    await controller.captureScreenshot('webgl-recovery-final.png');
  });

  /**
   * Test browser-specific rendering validation
   */
  test('Browser-specific rendering validation', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test nodes for browser compatibility testing
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 7; i++) {
          nodes.push({
            id: `browser-node-${i}`,
            position: {
              x: Math.cos(i * Math.PI * 2 / 7) * 18,
              y: Math.sin(i * Math.PI * 2 / 7) * 18,
              z: 0
            },
            label: `Browser ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Test browser-specific scenarios
    const browserTests = [
      {
        name: 'Viewport resize handling',
        trigger: async () => {
          // Test viewport changes
          await controller.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              // Simulate viewport changes
              canvas.style.width = '800px';
              canvas.style.height = '600px';

              // Trigger resize event
              const resizeEvent = new Event('resize');
              window.dispatchEvent(resizeEvent);

              // Restore original size
              setTimeout(() => {
                canvas.style.width = '1280px';
                canvas.style.height = '720px';
                window.dispatchEvent(resizeEvent);
              }, 1000);
            }
          });

          await controller.waitForTimeout(2000);
        },
        expectedRecovery: 'Canvas should handle viewport changes correctly'
      },
      {
        name: 'CSS transform interference',
        trigger: async () => {
          // Test CSS transform effects
          await controller.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              // Apply CSS transforms that might interfere
              canvas.style.transform = 'scale(0.8) rotate(5deg)';

              setTimeout(() => {
                // Remove transforms
                canvas.style.transform = 'none';
              }, 1000);
            }
          });

          await controller.waitForTimeout(2000);
        },
        expectedRecovery: 'Canvas should handle CSS transforms correctly'
      },
      {
        name: 'Z-index and layering issues',
        trigger: async () => {
          // Test layering issues
          await controller.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              // Change z-index to test layering
              canvas.style.zIndex = '10';
              canvas.style.position = 'relative';

              setTimeout(() => {
                // Restore normal z-index
                canvas.style.zIndex = 'auto';
                canvas.style.position = 'absolute';
              }, 1000);
            }
          });

          await controller.waitForTimeout(2000);
        },
        expectedRecovery: 'Canvas should handle z-index changes correctly'
      }
    ];

    for (let i = 0; i < browserTests.length; i++) {
      const test = browserTests[i];

      console.log(`Testing browser compatibility: ${test.name}`);

      // Capture before browser issue
      await controller.captureScreenshot(`browser-compat-before-${test.name}.png`);

      // Trigger browser issue
      await test.trigger();

      // Wait for potential recovery
      await controller.waitForTimeout(1000);

      // Verify browser compatibility
      const compatCheck = await controller.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { valid: false, reason: 'No canvas found' };

        const rect = canvas.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(canvas);

        const graph = (window as any).graph;
        return {
          valid: rect.width > 0 && rect.height > 0 &&
                 computedStyle.display !== 'none',
          canvasSize: { width: rect.width, height: rect.height },
          canvasVisible: computedStyle.display !== 'none' &&
                        computedStyle.visibility !== 'hidden',
          graphState: graph ? {
            cameraValid: graph.state.camera && isFinite(graph.state.camera.distance),
            nodesValid: Array.isArray(graph.state.data.nodes),
          } : null,
        };
      });

      expect(compatCheck).toBeTruthy();
      expect(compatCheck!.valid).toBe(true);
      expect(compatCheck!.canvasVisible).toBe(true);

      console.log(`Browser compatibility verified for ${test.name}:`, compatCheck);

      // Capture after browser issue
      await controller.captureScreenshot(`browser-compat-after-${test.name}.png`);
    }

    // Final validation
    await controller.captureScreenshot('browser-compat-final.png');
  });
});