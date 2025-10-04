import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import * as path from 'path';

/**
 * End-to-End User Workflow Tests
 * Tests complete graph exploration workflows and complex interaction patterns
 */
test.describe('End-to-End User Workflow Tests', () => {
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
   * Test complete graph exploration workflows
   */
  test('Complete graph exploration workflows', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create a complex graph for exploration
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        const edges = [];

        // Create a multi-level graph structure
        for (let level = 0; level < 3; level++) {
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6 + (level * Math.PI / 3);
            const radius = 15 + level * 12;

            nodes.push({
              id: `exploration-node-l${level}-${i}`,
              position: {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                z: 0
              },
              label: `L${level} N${i}`,
            });
          }
        }

        // Create edges between levels
        for (let level = 0; level < 2; level++) {
          for (let i = 0; i < 6; i++) {
            edges.push({
              id: `exploration-edge-l${level}-${i}`,
              source: `exploration-node-l${level}-${i}`,
              target: `exploration-node-l${level + 1}-${i}`,
            });

            // Add some cross-level connections
            if (i < 5) {
              edges.push({
                id: `exploration-cross-edge-l${level}-${i}`,
                source: `exploration-node-l${level}-${i}`,
                target: `exploration-node-l${level + 1}-${(i + 1) % 6}`,
              });
            }
          }
        }

        graph.update({
          data: {
            nodes: { add: nodes },
            edges: { add: edges }
          }
        });
      }
    });

    await controller.waitForTimeout(2000);

    // Define complete exploration workflow
    const explorationWorkflow = [
      {
        name: 'Initial overview',
        actions: async () => {
          // Start with auto-zoom to see all nodes
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.autoZoom({
                duration: 1500,
                strategy: 'optimal',
                padding: 1.5,
              });
            }
          });

          await controller.waitForTimeout(2000);
        }
      },
      {
        name: 'Level-by-level exploration',
        actions: async () => {
          // Explore each level systematically
          for (let level = 0; level < 3; level++) {
            // Focus on level nodes
            await controller.evaluate((level: number) => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                // Calculate center of level
                const levelNodes = graph.state.data.nodes.filter((n: any) =>
                  n.id.startsWith(`exploration-node-l${level}-`)
                );

                if (levelNodes.length > 0) {
                  const centerX = levelNodes.reduce((sum: number, n: any) => sum + n.position.x, 0) / levelNodes.length;
                  const centerY = levelNodes.reduce((sum: number, n: any) => sum + n.position.y, 0) / levelNodes.length;

                  graph.cameraPlugin.flyTo({
                    target: { x: centerX, y: centerY, z: 0 },
                    distance: 25,
                  }, { duration: 1000 });
                }
              }
            }, level);

            await controller.waitForTimeout(1500);

            // Select all nodes in current level
            const canvas = controller.getLocator('canvas');
            const canvasBox = await canvas.boundingBox();

            if (canvasBox) {
              // Select multiple nodes in level (simulate Ctrl+Click for each)
              for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2) / 3 + (level * Math.PI / 3);
                const radius = 15 + level * 12;
                const worldX = Math.cos(angle) * radius;
                const worldY = Math.sin(angle) * radius;

                // Convert world coordinates to screen coordinates (simplified)
                const screenX = canvasBox.x + canvasBox.width * 0.5 + (worldX / 50) * canvasBox.width * 0.4;
                const screenY = canvasBox.y + canvasBox.height * 0.5 + (worldY / 50) * canvasBox.height * 0.4;

                await controller.click('canvas', {
                  position: { x: screenX, y: screenY },
                  modifiers: i === 0 ? [] : ['Control'],
                });

                await controller.waitForTimeout(200);
              }
            }

            await controller.waitForTimeout(1000);
          }
        }
      },
      {
        name: 'Edge relationship exploration',
        actions: async () => {
          // Clear selections and explore edge relationships
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph) {
              graph.update({ interaction: { selectedElementIds: [] } });
            }
          });

          await controller.waitForTimeout(500);

          // Select specific edges to understand relationships
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            // Select edges between levels (approximate positions)
            for (let level = 0; level < 2; level++) {
              for (let i = 0; i < 2; i++) {
                // Approximate edge position between levels
                const avgRadius = (15 + level * 12 + 15 + (level + 1) * 12) / 2;
                const angle = (i * Math.PI * 2) / 2 + (level * Math.PI / 3);
                const worldX = Math.cos(angle) * avgRadius;
                const worldY = Math.sin(angle) * avgRadius;

                const screenX = canvasBox.x + canvasBox.width * 0.5 + (worldX / 50) * canvasBox.width * 0.4;
                const screenY = canvasBox.y + canvasBox.height * 0.5 + (worldY / 50) * canvasBox.height * 0.4;

                await controller.click('canvas', {
                  position: { x: screenX, y: screenY },
                  modifiers: level === 0 && i === 0 ? [] : ['Control'],
                });

                await controller.waitForTimeout(300);
              }
            }
          }

          await controller.waitForTimeout(1000);
        }
      },
      {
        name: 'Pattern discovery',
        actions: async () => {
          // Look for patterns in the graph structure
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              // Zoom out to see overall pattern
              graph.cameraPlugin.flyTo({
                target: { x: 0, y: 0, z: 0 },
                distance: 80,
              }, { duration: 1500 });
            }
          });

          await controller.waitForTimeout(2000);

          // Select nodes that form a pattern
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            // Select nodes in a diagonal pattern
            const patternNodes = [
              { level: 0, index: 0 },
              { level: 1, index: 1 },
              { level: 2, index: 2 },
            ];

            for (let i = 0; i < patternNodes.length; i++) {
              const { level, index } = patternNodes[i];
              const angle = (index * Math.PI * 2) / 6 + (level * Math.PI / 3);
              const radius = 15 + level * 12;
              const worldX = Math.cos(angle) * radius;
              const worldY = Math.sin(angle) * radius;

              const screenX = canvasBox.x + canvasBox.width * 0.5 + (worldX / 50) * canvasBox.width * 0.4;
              const screenY = canvasBox.y + canvasBox.height * 0.5 + (worldY / 50) * canvasBox.height * 0.4;

              await controller.click('canvas', {
                position: { x: screenX, y: screenY },
                modifiers: i === 0 ? [] : ['Control'],
              });

              await controller.waitForTimeout(300);
            }
          }

          await controller.waitForTimeout(1000);
        }
      }
    ];

    // Execute complete exploration workflow
    for (let i = 0; i < explorationWorkflow.length; i++) {
      const step = explorationWorkflow[i];

      console.log(`Executing workflow step: ${step.name}`);

      // Capture before workflow step
      await controller.captureScreenshot(`exploration-workflow-before-${step.name}.png`);

      // Execute workflow step
      await step.actions();

      // Wait for workflow step to complete
      await controller.waitForTimeout(1000);

      // Verify workflow step success
      const workflowState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          camera: graph.state.camera,
          selection: graph.state.interaction.selectedElementIds,
          data: {
            nodeCount: graph.state.data.nodes.length,
            edgeCount: graph.state.data.edges.length,
          }
        } : null;
      });

      expect(workflowState).toBeTruthy();
      expect(workflowState!.camera.distance).toBeGreaterThan(0);
      expect(workflowState!.data.nodeCount).toBe(18); // 3 levels * 6 nodes

      console.log(`Workflow step ${step.name} completed:`, workflowState);

      // Capture after workflow step
      await controller.captureScreenshot(`exploration-workflow-after-${step.name}.png`);
    }

    // Final workflow validation
    await controller.captureScreenshot('exploration-workflow-final.png');
  });

  /**
   * Test multi-step interaction sequences
   */
  test('Multi-step interaction sequences', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create nodes for interaction sequence testing
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 12; i++) {
          nodes.push({
            id: `sequence-node-${i}`,
            position: {
              x: (i % 4) * 8 - 12,
              y: Math.floor(i / 4) * 8 - 4,
              z: 0
            },
            label: `Seq ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Define complex multi-step interaction sequences
    const interactionSequences = [
      {
        name: 'Selection and manipulation sequence',
        sequence: [
          { type: 'hover', x: 0.3, y: 0.3, description: 'Hover over first node' },
          { type: 'click', x: 0.3, y: 0.3, description: 'Select first node' },
          { type: 'keyboard', key: 'Control', description: 'Prepare for multi-select' },
          { type: 'click', x: 0.7, y: 0.3, description: 'Select second node' },
          { type: 'keyboard', key: 'Control', description: 'Prepare for more selections' },
          { type: 'click', x: 0.5, y: 0.7, description: 'Select third node' },
          { type: 'drag', from: { x: 0.5, y: 0.5 }, to: { x: 0.6, y: 0.6 }, description: 'Drag selected nodes' },
          { type: 'keyboard', key: 'Escape', description: 'Clear selection' },
        ]
      },
      {
        name: 'Camera and selection coordination',
        sequence: [
          { type: 'camera', target: { x: 8, y: 0, z: 0 }, description: 'Move camera to area of interest' },
          { type: 'hover', x: 0.6, y: 0.5, description: 'Hover over node in new view' },
          { type: 'click', x: 0.6, y: 0.5, description: 'Select node in new camera position' },
          { type: 'camera', target: { x: -8, y: 0, z: 0 }, description: 'Move camera to different area' },
          { type: 'click', x: 0.4, y: 0.5, modifiers: ['Control'], description: 'Multi-select across camera views' },
          { type: 'camera', target: { x: 0, y: 0, z: 0 }, description: 'Return to overview' },
        ]
      },
      {
        name: 'Complex navigation pattern',
        sequence: [
          { type: 'zoom', direction: 'in', description: 'Zoom in for detail' },
          { type: 'hover', x: 0.5, y: 0.5, description: 'Examine node details' },
          { type: 'zoom', direction: 'out', description: 'Zoom out for context' },
          { type: 'camera', target: { x: 10, y: 10, z: 0 }, description: 'Pan to different section' },
          { type: 'hover', x: 0.7, y: 0.7, description: 'Explore new area' },
          { type: 'click', x: 0.7, y: 0.7, description: 'Select node in new area' },
          { type: 'camera', target: { x: 0, y: 0, z: 0 }, description: 'Return to center' },
        ]
      }
    ];

    for (let seqIndex = 0; seqIndex < interactionSequences.length; seqIndex++) {
      const sequence = interactionSequences[seqIndex];

      console.log(`Executing interaction sequence: ${sequence.name}`);

      for (let stepIndex = 0; stepIndex < sequence.sequence.length; stepIndex++) {
        const step = sequence.sequence[stepIndex];

        // Capture before each step
        await controller.captureScreenshot(`sequence-${seqIndex}-${stepIndex}-before-${step.type}.png`);

        // Execute interaction step
        switch (step.type) {
          case 'hover':
            await controller.hover('canvas', {
              position: { x: 1280 * step.x!, y: 720 * step.y! }
            });
            break;
          case 'click':
            await controller.click('canvas', {
              position: { x: 1280 * step.x!, y: 720 * step.y! },
              modifiers: (step as any).modifiers || [],
            });
            break;
          case 'keyboard':
            await controller.keyboard((step as any).key!);
            break;
          case 'drag':
            await controller.evaluate(() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const startEvent = new MouseEvent('mousedown', {
                  clientX: 640,
                  clientY: 360,
                  bubbles: true,
                });
                canvas.dispatchEvent(startEvent);

                setTimeout(() => {
                  const moveEvent = new MouseEvent('mousemove', {
                    clientX: 768,
                    clientY: 432,
                    bubbles: true,
                  });
                  canvas.dispatchEvent(moveEvent);
                }, 100);

                setTimeout(() => {
                  const endEvent = new MouseEvent('mouseup', {
                    clientX: 768,
                    clientY: 432,
                    bubbles: true,
                  });
                  canvas.dispatchEvent(endEvent);
                }, 300);
              }
            });
            break;
          case 'camera':
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.flyTo({
                  target: (step as any).target,
                }, { duration: 800 });
              }
            });
            break;
          case 'zoom':
            await controller.keyboard((step as any).direction === 'in' ? 'PageUp' : 'PageDown');
            break;
        }

        // Wait for step to complete
        await controller.waitForTimeout(400);

        // Capture after each step
        await controller.captureScreenshot(`sequence-${seqIndex}-${stepIndex}-after-${step.type}.png`);

        // Verify step success
        const stepState = await controller.evaluate(() => {
          const graph = (window as any).graph;
          return graph ? {
            camera: graph.state.camera,
            interaction: graph.state.interaction,
            step: stepIndex,
          } : null;
        });

        expect(stepState).toBeTruthy();
        expect(stepState!.camera.distance).toBeGreaterThan(0);

        console.log(`Step ${stepIndex} (${step.description}) completed:`, stepState);
      }

      // Sequence completion capture
      await controller.captureScreenshot(`sequence-${seqIndex}-completed.png`);
    }

    // Final sequence validation
    await controller.captureScreenshot('multi-step-sequences-final.png');
  });

  /**
   * Test complex interaction patterns
   */
  test('Complex interaction patterns', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create complex graph for pattern testing
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        const edges = [];

        // Create a hub-and-spoke pattern
        const hubNode = {
          id: 'hub-node',
          position: { x: 0, y: 0, z: 0 },
          label: 'Hub',
        };
        nodes.push(hubNode);

        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const radius = 25;

          nodes.push({
            id: `spoke-node-${i}`,
            position: {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              z: 0
            },
            label: `Spoke ${i}`,
          });

          edges.push({
            id: `hub-edge-${i}`,
            source: 'hub-node',
            target: `spoke-node-${i}`,
          });
        }

        // Add some cross-connections
        for (let i = 0; i < 6; i++) {
          edges.push({
            id: `cross-edge-${i}`,
            source: `spoke-node-${i}`,
            target: `spoke-node-${(i + 2) % 8}`,
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

    await controller.waitForTimeout(2000);

    // Define complex interaction patterns
    const complexPatterns = [
      {
        name: 'Hub exploration pattern',
        pattern: async () => {
          // 1. Overview of entire structure
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.autoZoom({ duration: 1000 });
            }
          });

          await controller.waitForTimeout(1500);

          // 2. Focus on hub
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.flyTo({
                target: { x: 0, y: 0, z: 0 },
                distance: 15,
              }, { duration: 800 });
            }
          });

          await controller.waitForTimeout(1000);

          // 3. Explore each spoke
          for (let i = 0; i < 4; i++) {
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                const angle = 0 * Math.PI / 4;
                const radius = 25;

                graph.cameraPlugin.flyTo({
                  target: {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    z: 0
                  },
                  distance: 20,
                }, { duration: 600 });
              }
            });

            await controller.waitForTimeout(800);
          }

          // 4. Return to overview
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.autoZoom({ duration: 1000 });
            }
          });

          await controller.waitForTimeout(1500);
        }
      },
      {
        name: 'Path following pattern',
        pattern: async () => {
          // Follow a path through the graph
          const pathNodes = [
            { x: 0, y: 0, z: 0 }, // Hub
            { x: 25, y: 0, z: 0 }, // Spoke 0
            { x: 17.7, y: 17.7, z: 0 }, // Spoke 2
            { x: 0, y: 25, z: 0 }, // Spoke 4
            { x: -17.7, y: 17.7, z: 0 }, // Spoke 6
            { x: -25, y: 0, z: 0 }, // Spoke 1 (opposite)
          ];

          for (let i = 0; i < pathNodes.length; i++) {
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.flyTo({
                  target: pathNodes[0],
                  distance: 20,
                }, { duration: 800 });
              }
            });

            await controller.waitForTimeout(1000);

            // Select node at current location
            const canvas = controller.getLocator('canvas');
            const canvasBox = await canvas.boundingBox();

            if (canvasBox) {
              const screenX = canvasBox.x + canvasBox.width * 0.5;
              const screenY = canvasBox.y + canvasBox.height * 0.5;

              await controller.click('canvas', {
                position: { x: screenX, y: screenY }
              });

              await controller.waitForTimeout(300);
            }
          }
        }
      },
      {
        name: 'Multi-selection pattern',
        pattern: async () => {
          // Perform complex multi-selection
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            // Select hub first
            await controller.click('canvas', {
              position: { x: canvasBox.x + canvasBox.width * 0.5, y: canvasBox.y + canvasBox.height * 0.5 }
            });

            await controller.waitForTimeout(300);

            // Select spokes in a pattern
            const spokeAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
            for (let i = 0; i < spokeAngles.length; i++) {
              const angle = spokeAngles[i];
              const worldX = Math.cos(angle) * 25;
              const worldY = Math.sin(angle) * 25;

              const screenX = canvasBox.x + canvasBox.width * 0.5 + (worldX / 50) * canvasBox.width * 0.4;
              const screenY = canvasBox.y + canvasBox.height * 0.5 + (worldY / 50) * canvasBox.height * 0.4;

              await controller.click('canvas', {
                position: { x: screenX, y: screenY },
                modifiers: ['Control'],
              });

              await controller.waitForTimeout(200);
            }

            // Frame selection
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.frameSelected({
                  duration: 1000,
                  strategy: 'optimal',
                });
              }
            });

            await controller.waitForTimeout(1500);
          }
        }
      }
    ];

    for (let i = 0; i < complexPatterns.length; i++) {
      const pattern = complexPatterns[i];

      console.log(`Executing complex pattern: ${pattern.name}`);

      // Capture before pattern
      await controller.captureScreenshot(`complex-pattern-before-${pattern.name}.png`);

      // Execute pattern
      await pattern.pattern();

      // Wait for pattern completion
      await controller.waitForTimeout(1000);

      // Verify pattern success
      const patternState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          camera: graph.state.camera,
          selection: graph.state.interaction.selectedElementIds,
          data: {
            nodeCount: graph.state.data.nodes.length,
            edgeCount: graph.state.data.edges.length,
          }
        } : null;
      });

      expect(patternState).toBeTruthy();
      expect(patternState!.camera.distance).toBeGreaterThan(0);
      expect(patternState!.data.nodeCount).toBe(9); // 1 hub + 8 spokes

      console.log(`Pattern ${pattern.name} completed:`, patternState);

      // Capture after pattern
      await controller.captureScreenshot(`complex-pattern-after-${pattern.name}.png`);
    }

    // Final pattern validation
    await controller.captureScreenshot('complex-patterns-final.png');
  });

  /**
   * Test workflow interruption and recovery
   */
  test('Workflow interruption and recovery', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test scenario
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 10; i++) {
          nodes.push({
            id: `workflow-node-${i}`,
            position: {
              x: (i % 5) * 6 - 12,
              y: Math.floor(i / 5) * 6 - 3,
              z: 0
            },
            label: `WF ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(1000);

    // Test workflow interruption scenarios
    const interruptionTests = [
      {
        name: 'Camera animation interruption',
        trigger: async () => {
          // Start long camera animation
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.flyTo({
                target: { x: 20, y: 0, z: 0 },
                distance: 30,
                phi: Math.PI / 2,
              }, { duration: 3000 });
            }
          });

          await controller.waitForTimeout(1000);

          // Interrupt with user interaction
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            await controller.click('canvas', {
              position: { x: canvasBox.x + canvasBox.width * 0.5, y: canvasBox.y + canvasBox.height * 0.5 }
            });
          }

          await controller.waitForTimeout(2000);
        },
        expectedRecovery: 'Camera should handle interruption gracefully'
      },
      {
        name: 'Selection workflow interruption',
        trigger: async () => {
          // Start multi-selection process
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            // Select first node
            await controller.click('canvas', {
              position: { x: canvasBox.x + canvasBox.width * 0.3, y: canvasBox.y + canvasBox.height * 0.5 }
            });

            await controller.waitForTimeout(200);

            // Start camera movement during selection
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.flyTo({
                  target: { x: -10, y: 0, z: 0 },
                }, { duration: 1500 });
              }
            });

            await controller.waitForTimeout(500);

            // Continue selection during camera movement
            await controller.click('canvas', {
              position: { x: canvasBox.x + canvasBox.width * 0.7, y: canvasBox.y + canvasBox.height * 0.5 },
              modifiers: ['Control'],
            });

            await controller.waitForTimeout(1000);
          }
        },
        expectedRecovery: 'Selection should work correctly during camera movement'
      }
    ];

    for (let i = 0; i < interruptionTests.length; i++) {
      const test = interruptionTests[i];

      console.log(`Testing workflow interruption: ${test.name}`);

      // Capture before interruption
      await controller.captureScreenshot(`workflow-interruption-before-${test.name}.png`);

      // Trigger interruption scenario
      await test.trigger();

      // Wait for recovery
      await controller.waitForTimeout(1000);

      // Verify recovery
      const recoveryState = await controller.evaluate(() => {
        const graph = (window as any).graph;
        return graph ? {
          camera: graph.state.camera,
          interaction: graph.state.interaction,
          systemStable: graph.state.camera.distance > 0 &&
                       isFinite(graph.state.camera.distance) &&
                       Array.isArray(graph.state.interaction.selectedElementIds),
        } : null;
      });

      expect(recoveryState).toBeTruthy();
      expect(recoveryState!.systemStable).toBe(true);

      console.log(`Workflow recovery verified for ${test.name}:`, recoveryState);

      // Capture after interruption
      await controller.captureScreenshot(`workflow-interruption-after-${test.name}.png`);
    }

    // Final workflow validation
    await controller.captureScreenshot('workflow-interruption-final.png');
  });
});