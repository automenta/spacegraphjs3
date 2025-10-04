import { test, expect, devices } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import * as path from 'path';

/**
 * Cross-Platform Compatibility Tests
 * Tests mobile browser optimization and browser-specific rendering validation
 */
test.describe('Cross-Platform Compatibility Tests', () => {
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
   * Test mobile browser optimization testing
   */
  test('Mobile browser optimization testing', async () => {
    // Test with mobile viewport
    await controller.cleanup();

    controller = await VisualSemanticsController.init({
      viewport: { width: 375, height: 667 }, // iPhone size
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create mobile-optimized test scene
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 6; i++) {
          nodes.push({
            id: `mobile-node-${i}`,
            position: {
              x: (i % 3) * 12 - 12,
              y: Math.floor(i / 3) * 12 - 6,
              z: 0
            },
            label: `Mobile ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture mobile initial state
    await controller.captureScreenshot('mobile-optimization-initial.png');

    // Test mobile-specific interactions
    const mobileTests = [
      {
        name: 'Touch interactions',
        actions: async () => {
          // Simulate touch interactions
          await controller.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              // Create touch events for mobile testing
              const touchStart = new TouchEvent('touchstart', {
                touches: [{
                  identifier: 0,
                  target: canvas,
                  clientX: 100,
                  clientY: 200,
                } as any],
                targetTouches: [{
                  identifier: 0,
                  target: canvas,
                  clientX: 100,
                  clientY: 200,
                } as any],
                changedTouches: [{
                  identifier: 0,
                  target: canvas,
                  clientX: 100,
                  clientY: 200,
                } as any],
                bubbles: true,
                cancelable: true,
              });

              canvas.dispatchEvent(touchStart);

              setTimeout(() => {
                const touchMove = new TouchEvent('touchmove', {
                  touches: [{
                    identifier: 0,
                    target: canvas,
                    clientX: 150,
                    clientY: 250,
                  } as any],
                  targetTouches: [{
                    identifier: 0,
                    target: canvas,
                    clientX: 150,
                    clientY: 250,
                  } as any],
                  changedTouches: [{
                    identifier: 0,
                    target: canvas,
                    clientX: 150,
                    clientY: 250,
                  } as any],
                  bubbles: true,
                  cancelable: true,
                });

                canvas.dispatchEvent(touchMove);
              }, 100);

              setTimeout(() => {
                const touchEnd = new TouchEvent('touchend', {
                  touches: [],
                  targetTouches: [],
                  changedTouches: [{
                    identifier: 0,
                    target: canvas,
                    clientX: 150,
                    clientY: 250,
                  } as any],
                  bubbles: true,
                  cancelable: true,
                });

                canvas.dispatchEvent(touchEnd);
              }, 300);
            }
          });

          await controller.waitForTimeout(1000);
        }
      },
      {
        name: 'Mobile camera controls',
        actions: async () => {
          // Test camera controls optimized for mobile
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              // Mobile-optimized camera movements
              graph.cameraPlugin.flyTo({
                target: { x: 0, y: 0, z: 0 },
                distance: 60, // Larger distance for mobile
                phi: Math.PI / 6,
                theta: 0,
              }, { duration: 800 });
            }
          });

          await controller.waitForTimeout(1000);
        }
      },
      {
        name: 'Mobile viewport adaptation',
        actions: async () => {
          // Test viewport changes
          await controller.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              // Simulate orientation change
              const orientationChange = new Event('orientationchange');
              (window as any).orientation = 90;
              window.dispatchEvent(orientationChange);

              setTimeout(() => {
                (window as any).orientation = 0;
                window.dispatchEvent(orientationChange);
              }, 1000);
            }
          });

          await controller.waitForTimeout(2000);
        }
      }
    ];

    for (let i = 0; i < mobileTests.length; i++) {
      const test = mobileTests[i];

      console.log(`Testing mobile optimization: ${test.name}`);

      // Capture before mobile interaction
      await controller.captureScreenshot(`mobile-before-${test.name}.png`);

      // Execute mobile interaction
      await test.actions();

      // Wait for mobile interaction to complete
      await controller.waitForTimeout(500);

      // Verify mobile compatibility
      const mobileCheck = await controller.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { valid: false, reason: 'No canvas found' };

        const rect = canvas.getBoundingClientRect();
        const graph = (window as any).graph;

        return {
          valid: rect.width > 0 && rect.height > 0,
          canvasSize: { width: rect.width, height: rect.height },
          isMobile: 'ontouchstart' in window,
          touchSupport: true,
          graphState: graph ? {
            cameraValid: graph.state.camera && isFinite(graph.state.camera.distance),
            nodesValid: Array.isArray(graph.state.data.nodes),
          } : null,
        };
      });

      expect(mobileCheck).toBeTruthy();
      expect(mobileCheck!.valid).toBe(true);
      expect(mobileCheck!.isMobile).toBe(true);

      console.log(`Mobile compatibility verified for ${test.name}:`, mobileCheck);

      // Capture after mobile interaction
      await controller.captureScreenshot(`mobile-after-${test.name}.png`);
    }

    // Final mobile validation
    await controller.captureScreenshot('mobile-optimization-final.png');
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
            id: `webgl-recovery-node-${i}`,
            position: { x: i * 8 - 16, y: 0, z: 0 },
            label: `WebGL ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Capture initial state
    await controller.captureScreenshot('webgl-context-initial.png');

    // Test WebGL context loss and recovery
    const webglRecoveryTests = [
      {
        name: 'Context loss simulation',
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
        name: 'Renderer recreation',
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

    for (let i = 0; i < webglRecoveryTests.length; i++) {
      const test = webglRecoveryTests[i];

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

    // Final WebGL validation
    await controller.captureScreenshot('webgl-context-final.png');
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
        for (let i = 0; i < 8; i++) {
          nodes.push({
            id: `browser-compat-node-${i}`,
            position: {
              x: Math.cos(i * Math.PI / 4) * 20,
              y: Math.sin(i * Math.PI / 4) * 20,
              z: 0
            },
            label: `Compat ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Test browser-specific scenarios
    const browserCompatibilityTests = [
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
      },
      {
        name: 'High DPI display handling',
        trigger: async () => {
          // Test high DPI scenarios
          await controller.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              // Simulate high DPI scenarios
              const originalWidth = canvas.width;
              const originalHeight = canvas.height;

              // Test canvas scaling
              canvas.width = originalWidth * 2;
              canvas.height = originalHeight * 2;
              canvas.style.width = `${originalWidth}px`;
              canvas.style.height = `${originalHeight}px`;

              setTimeout(() => {
                // Restore original dimensions
                canvas.width = originalWidth;
                canvas.height = originalHeight;
                canvas.style.width = `${originalWidth}px`;
                canvas.style.height = `${originalHeight}px`;
              }, 1000);
            }
          });

          await controller.waitForTimeout(2000);
        },
        expectedRecovery: 'Canvas should handle high DPI scaling correctly'
      }
    ];

    for (let i = 0; i < browserCompatibilityTests.length; i++) {
      const test = browserCompatibilityTests[i];

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
          devicePixelRatio: window.devicePixelRatio || 1,
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
    await controller.captureScreenshot('browser-compatibility-final.png');
  });

  /**
   * Test different viewport sizes and aspect ratios
   */
  test('Viewport size and aspect ratio compatibility', async () => {
    const viewportTests = [
      { width: 1920, height: 1080, name: 'Full HD' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 375, height: 667, name: 'Mobile Portrait' },
      { width: 667, height: 375, name: 'Mobile Landscape' },
    ];

    for (const viewport of viewportTests) {
      console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      // Create new controller for each viewport
      await controller.cleanup();

      controller = await VisualSemanticsController.init({
        viewport: viewport,
        deviceScaleFactor: viewport.width < 800 ? 2 : 1,
      });

      await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

      await controller.waitForTimeout(2000);

      // Create test nodes for this viewport
      await controller.evaluate(() => {
        const graph = (window as any).graph;
        if (graph && graph.dataManager) {
          const nodes = [];
          for (let i = 0; i < 5; i++) {
            nodes.push({
              id: `viewport-node-${i}`,
              position: {
                x: (i - 2) * 10,
                y: 0,
                z: 0
              },
              label: `VP ${i}`,
            });
          }
          graph.update({ data: { nodes: { add: nodes } } });
        }
      });

      await controller.waitForTimeout(1000);

      // Capture viewport-specific screenshot
      await controller.captureScreenshot(`viewport-${viewport.name.toLowerCase().replace(' ', '-')}.png`);

      // Test viewport-specific interactions
      const canvas = controller.getLocator('canvas');
      const canvasBox = await canvas.boundingBox();

      if (canvasBox) {
        // Test touch/mobile interactions for small viewports
        if (viewport.width < 800) {
          // Mobile-style interactions
          await controller.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const touchStart = new TouchEvent('touchstart', {
                touches: [{
                  identifier: 0,
                  target: canvas,
                  clientX: canvas.width / 2,
                  clientY: canvas.height / 2,
                } as any],
                targetTouches: [{
                  identifier: 0,
                  target: canvas,
                  clientX: canvas.width / 2,
                  clientY: canvas.height / 2,
                } as any],
                changedTouches: [{
                  identifier: 0,
                  target: canvas,
                  clientX: canvas.width / 2,
                  clientY: canvas.height / 2,
                } as any],
                bubbles: true,
                cancelable: true,
              });

              canvas.dispatchEvent(touchStart);

              setTimeout(() => {
                const touchEnd = new TouchEvent('touchend', {
                  touches: [],
                  targetTouches: [],
                  changedTouches: [{
                    identifier: 0,
                    target: canvas,
                    clientX: canvas.width / 2,
                    clientY: canvas.height / 2,
                  } as any],
                  bubbles: true,
                  cancelable: true,
                });

                canvas.dispatchEvent(touchEnd);
              }, 200);
            }
          });

          await controller.waitForTimeout(500);
        } else {
          // Desktop-style interactions
          await controller.hover('canvas', {
            position: {
              x: canvasBox.width * 0.5,
              y: canvasBox.height * 0.5
            }
          });

          await controller.waitForTimeout(200);

          await controller.click('canvas', {
            position: {
              x: canvasBox.width * 0.5,
              y: canvasBox.height * 0.5
            }
          });

          await controller.waitForTimeout(200);
        }

        // Test camera operations for this viewport
        await controller.evaluate(() => {
          const graph = (window as any).graph;
          if (graph && graph.cameraPlugin) {
            // Viewport-appropriate camera settings
            const distance = Math.max(viewport.width, viewport.height) / 8;
            graph.cameraPlugin.flyTo({
              target: { x: 0, y: 0, z: 0 },
              distance: distance,
            }, { duration: 600 });
          }
        });

        await controller.waitForTimeout(1000);
      }

      // Verify viewport compatibility
      const viewportCheck = await controller.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { valid: false, reason: 'No canvas found' };

        const rect = canvas.getBoundingClientRect();
        const graph = (window as any).graph;

        return {
          valid: rect.width === viewport.width && rect.height === viewport.height,
          actualSize: { width: rect.width, height: rect.height },
          expectedSize: viewport,
          aspectRatio: rect.width / rect.height,
          graphState: graph ? {
            cameraValid: graph.state.camera && isFinite(graph.state.camera.distance),
            nodesValid: Array.isArray(graph.state.data.nodes),
          } : null,
        };
      });

      expect(viewportCheck).toBeTruthy();
      expect(viewportCheck!.valid).toBe(true);

      console.log(`Viewport compatibility verified for ${viewport.name}:`, viewportCheck);

      // Capture final viewport state
      await controller.captureScreenshot(`viewport-${viewport.name.toLowerCase().replace(' ', '-')}-final.png`);
    }
  });
});