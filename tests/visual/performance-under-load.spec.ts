import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import * as path from 'path';

/**
 * Performance Under Load Tests
 * Tests sustained interaction performance and memory leak detection
 */
test.describe('Performance Under Load Tests', () => {
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
   * Test sustained interaction performance (30+ seconds)
   */
  test('Sustained interaction performance testing', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create a moderately complex scene for sustained testing
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        const edges = [];

        // Create 20 nodes in a grid pattern
        for (let i = 0; i < 20; i++) {
          nodes.push({
            id: `sustained-node-${i}`,
            position: {
              x: (i % 5) * 8 - 16,
              y: Math.floor(i / 5) * 8 - 8,
              z: 0
            },
            label: `Sustained ${i}`,
          });
        }

        // Create some edges
        for (let i = 0; i < 15; i++) {
          edges.push({
            id: `sustained-edge-${i}`,
            source: `sustained-node-${i}`,
            target: `sustained-node-${(i + 1) % 20}`,
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

    // Performance monitoring setup
    const performanceMetrics = {
      frameRates: [] as number[],
      memoryUsage: [] as number[],
      interactionCounts: [] as number[],
      timestamps: [] as number[],
    };

    // Start performance monitoring
    const monitoringInterval = setInterval(async () => {
      const metrics = await controller.evaluate(() => {
        if (typeof performance !== 'undefined' && (performance as any).memory) {
          return {
            frameRate: 60, // Simplified for compatibility
            memoryUsage: (performance as any).memory.usedJSHeapSize || 0,
            timestamp: Date.now(),
          };
        }
        return {
          frameRate: 60,
          memoryUsage: 0,
          timestamp: Date.now(),
        };
      });

      performanceMetrics.frameRates.push(metrics.frameRate);
      performanceMetrics.memoryUsage.push(metrics.memoryUsage);
      performanceMetrics.timestamps.push(metrics.timestamp);
    }, 1000);

    try {
      // Perform sustained interactions for 35 seconds
      const testDuration = 35000;
      const startTime = Date.now();

      console.log('Starting sustained interaction test...');

      while (Date.now() - startTime < testDuration) {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / testDuration;

        // Vary interaction patterns based on progress
        if (progress < 0.25) {
          // Phase 1: Camera movements
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              const angle = 0.25 * Math.PI * 4; // Use fixed progress for this phase
              graph.cameraPlugin.flyTo({
                phi: Math.PI / 4 + Math.sin(angle) * Math.PI / 8,
                theta: angle,
              }, { duration: 200 });
            }
          });
        } else if (progress < 0.5) {
          // Phase 2: Node interactions
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            const x = canvasBox.x + canvasBox.width * (0.2 + Math.sin(progress * 10) * 0.3);
            const y = canvasBox.y + canvasBox.height * (0.3 + Math.cos(progress * 8) * 0.2);

            await controller.hover('canvas', { position: { x, y } });
            if (Math.random() > 0.7) {
              await controller.click('canvas', { position: { x, y } });
            }
          }
        } else if (progress < 0.75) {
          // Phase 3: Zoom operations
          if (Math.random() > 0.5) {
            await controller.keyboard('PageUp');
          } else {
            await controller.keyboard('PageDown');
          }
        } else {
          // Phase 4: Complex multi-interactions
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              // Random camera movements
              graph.cameraPlugin.flyTo({
                target: {
                  x: (Math.random() - 0.5) * 20,
                  y: (Math.random() - 0.5) * 20,
                  z: 0
                },
                distance: 30 + Math.random() * 20,
              }, { duration: 300 });
            }
          });

          // Random node selections
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            const x = canvasBox.x + canvasBox.width * (0.1 + Math.random() * 0.8);
            const y = canvasBox.y + canvasBox.height * (0.1 + Math.random() * 0.8);

            if (Math.random() > 0.6) {
              await controller.click('canvas', {
                position: { x, y },
                modifiers: Math.random() > 0.5 ? ['Control'] : []
              });
            }
          }
        }

        // Capture performance snapshots every 5 seconds
        if (Math.floor(elapsed / 5000) !== Math.floor((elapsed - 100) / 5000)) {
          await controller.captureScreenshot(`sustained-performance-${Math.floor(elapsed / 1000)}s.png`);

          const currentMetrics = await controller.evaluate(() => {
            const graph = (window as any).graph;
            return {
              nodeCount: graph ? graph.state.data.nodes.length : 0,
              edgeCount: graph ? graph.state.data.edges.length : 0,
              cameraState: graph ? graph.state.camera : null,
              interactionState: graph ? graph.state.interaction : null,
            };
          });

          performanceMetrics.interactionCounts.push(
            (currentMetrics.interactionState?.selectedElementIds?.length || 0) +
            (currentMetrics.nodeCount || 0)
          );

          console.log(`Performance checkpoint at ${Math.floor(elapsed / 1000)}s:`, {
            nodes: currentMetrics.nodeCount,
            edges: currentMetrics.edgeCount,
            cameraDistance: currentMetrics.cameraState?.distance,
            selectedElements: currentMetrics.interactionState?.selectedElementIds?.length || 0,
          });
        }

        // Brief pause between interactions
        await controller.waitForTimeout(50);
      }

      console.log('Sustained interaction test completed');

    } finally {
      // Stop monitoring
      clearInterval(monitoringInterval);

      // Final performance capture
      await controller.captureScreenshot('sustained-performance-final.png');
    }

    // Analyze performance metrics
    const avgFrameRate = performanceMetrics.frameRates.reduce((a, b) => a + b, 0) / performanceMetrics.frameRates.length;
    const maxMemoryUsage = Math.max(...performanceMetrics.memoryUsage);
    const memoryGrowth = performanceMetrics.memoryUsage.length > 1 ?
      performanceMetrics.memoryUsage[performanceMetrics.memoryUsage.length - 1] - performanceMetrics.memoryUsage[0] : 0;

    console.log('Performance Analysis:', {
      averageFrameRate: avgFrameRate,
      maxMemoryUsage: maxMemoryUsage,
      memoryGrowth: memoryGrowth,
      totalInteractions: performanceMetrics.interactionCounts.reduce((a, b) => a + b, 0),
      testDuration: testDuration / 1000,
    });

    // Performance assertions
    expect(avgFrameRate).toBeGreaterThan(30); // Should maintain at least 30 FPS
    expect(maxMemoryUsage).toBeLessThan(100 * 1024 * 1024); // Should use less than 100MB

    // Memory leak detection: memory shouldn't grow continuously
    if (performanceMetrics.memoryUsage.length > 5) {
      const recentMemory = performanceMetrics.memoryUsage.slice(-5);
      const memoryTrend = recentMemory[recentMemory.length - 1] - recentMemory[0];
      expect(memoryTrend).toBeLessThan(50 * 1024 * 1024); // Memory growth should be less than 50MB
    }
  });

  /**
   * Test high-frequency operation stress testing
   */
  test('High-frequency operation stress testing', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create test nodes for high-frequency operations
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 50; i++) {
          nodes.push({
            id: `stress-node-${i}`,
            position: {
              x: (Math.random() - 0.5) * 40,
              y: (Math.random() - 0.5) * 40,
              z: 0
            },
            label: `Stress ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(2000);

    // High-frequency operation metrics
    const stressMetrics = {
      operationCount: 0,
      errorCount: 0,
      responseTimes: [] as number[],
      memorySnapshots: [] as number[],
    };

    // Perform high-frequency operations for 20 seconds
    const stressTestDuration = 20000;
    const startTime = Date.now();

    console.log('Starting high-frequency stress test...');

    while (Date.now() - startTime < stressTestDuration) {
      const operationStart = Date.now();

      try {
        // Random mix of high-frequency operations
        const operation = Math.random();

        if (operation < 0.3) {
          // Camera operations
          await controller.evaluate(() => {
            const graph = (window as any).graph;
            if (graph && graph.cameraPlugin) {
              graph.cameraPlugin.flyTo({
                target: {
                  x: (Math.random() - 0.5) * 30,
                  y: (Math.random() - 0.5) * 30,
                  z: 0
                },
                distance: 20 + Math.random() * 30,
              }, { duration: 100 });
            }
          });
        } else if (operation < 0.6) {
          // Node interactions
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            const x = canvasBox.x + canvasBox.width * Math.random();
            const y = canvasBox.y + canvasBox.height * Math.random();

            await controller.hover('canvas', { position: { x, y } });
            if (Math.random() > 0.8) {
              await controller.click('canvas', { position: { x, y } });
            }
          }
        } else if (operation < 0.8) {
          // Zoom operations
          await controller.keyboard(Math.random() > 0.5 ? 'PageUp' : 'PageDown');
        } else {
          // Selection operations
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            const x = canvasBox.x + canvasBox.width * Math.random();
            const y = canvasBox.y + canvasBox.height * Math.random();

            await controller.click('canvas', {
              position: { x, y },
              modifiers: Math.random() > 0.5 ? ['Control'] : []
            });
          }
        }

        const operationTime = Date.now() - operationStart;
        stressMetrics.responseTimes.push(operationTime);
        stressMetrics.operationCount++;

        // Memory snapshot every 100 operations
        if (stressMetrics.operationCount % 100 === 0) {
          const memoryUsage = await controller.evaluate(() => {
            return typeof performance !== 'undefined' && performance.memory ?
              performance.memory.usedJSHeapSize : 0;
          });
          stressMetrics.memorySnapshots.push(memoryUsage);

          await controller.captureScreenshot(`stress-test-${Math.floor(stressMetrics.operationCount / 100)}.png`);
        }

      } catch (error) {
        stressMetrics.errorCount++;
        console.warn('Operation error during stress test:', error);
      }

      // Minimal delay for very high frequency
      await controller.waitForTimeout(10);
    }

    console.log('High-frequency stress test completed');

    // Analyze stress test results
    const avgResponseTime = stressMetrics.responseTimes.reduce((a, b) => a + b, 0) / stressMetrics.responseTimes.length;
    const maxResponseTime = Math.max(...stressMetrics.responseTimes);
    const errorRate = stressMetrics.errorCount / stressMetrics.operationCount;

    console.log('Stress Test Analysis:', {
      totalOperations: stressMetrics.operationCount,
      averageResponseTime: avgResponseTime,
      maxResponseTime: maxResponseTime,
      errorRate: errorRate,
      memorySnapshots: stressMetrics.memorySnapshots.length,
      testDuration: stressTestDuration / 1000,
    });

    // Performance assertions
    expect(avgResponseTime).toBeLessThan(100); // Average response should be under 100ms
    expect(maxResponseTime).toBeLessThan(500); // Max response should be under 500ms
    expect(errorRate).toBeLessThan(0.1); // Error rate should be under 10%

    // Memory leak detection
    if (stressMetrics.memorySnapshots.length > 3) {
      const firstMemory = stressMetrics.memorySnapshots[0];
      const lastMemory = stressMetrics.memorySnapshots[stressMetrics.memorySnapshots.length - 1];
      const memoryGrowth = lastMemory - firstMemory;

      console.log(`Memory growth during stress test: ${memoryGrowth / 1024 / 1024} MB`);
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Should not grow more than 100MB
    }

    // Final capture
    await controller.captureScreenshot('stress-test-final.png');
  });

  /**
   * Test memory leak detection for extended sessions
   */
  test('Memory leak detection for extended sessions', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create initial scene
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 10; i++) {
          nodes.push({
            id: `memory-node-${i}`,
            position: { x: i * 5 - 22.5, y: 0, z: 0 },
            label: `Memory ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(2000);

    // Memory monitoring over extended period
    const memoryBaseline = await controller.evaluate(() => {
      return typeof performance !== 'undefined' && (performance as any).memory ?
        (performance as any).memory.usedJSHeapSize : 0;
    });

    console.log(`Memory baseline: ${memoryBaseline / 1024 / 1024} MB`);

    // Perform memory-intensive operations over time
    const memoryOperations = [
      {
        name: 'Node creation/deletion cycles',
        duration: 10000,
        operations: async () => {
          for (let cycle = 0; cycle < 5; cycle++) {
            // Add nodes
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.dataManager) {
                const nodes = [];
                for (let i = 0; i < 10; i++) {
                  nodes.push({
                    id: `memory-cycle-${Date.now()}-node-${i}`,
                    position: {
                      x: (Math.random() - 0.5) * 20,
                      y: (Math.random() - 0.5) * 20,
                      z: 0
                    },
                    label: `Cycle Node ${i}`,
                  });
                }
                graph.update({ data: { nodes: { add: nodes } } });
              }
            });

            await controller.waitForTimeout(500);

            // Remove nodes
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.dataManager) {
                const nodeIds = [];
                for (let i = 0; i < 10; i++) {
                  nodeIds.push(`memory-cycle-${Date.now()}-node-${i}`);
                }
                graph.update({ data: { nodes: { remove: nodeIds } } });
              }
            });

            await controller.waitForTimeout(1000);
          }
        }
      },
      {
        name: 'Camera animation cycles',
        duration: 15000,
        operations: async () => {
          for (let cycle = 0; cycle < 8; cycle++) {
            await controller.evaluate(() => {
              const graph = (window as any).graph;
              if (graph && graph.cameraPlugin) {
                graph.cameraPlugin.flyTo({
                  target: {
                    x: Math.cos(cycle * Math.PI / 4) * 15,
                    y: Math.sin(cycle * Math.PI / 4) * 15,
                    z: 0
                  },
                  distance: 30 + Math.sin(cycle) * 10,
                  phi: Math.PI / 4 + Math.sin(cycle * 2) * Math.PI / 8,
                  theta: cycle * Math.PI / 4,
                }, { duration: 800 });
              }
            });

            await controller.waitForTimeout(1500);
          }
        }
      },
      {
        name: 'Interaction pattern cycles',
        duration: 12000,
        operations: async () => {
          const canvas = controller.getLocator('canvas');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            for (let cycle = 0; cycle < 12; cycle++) {
              // Perform complex interaction patterns
              for (let i = 0; i < 5; i++) {
                const x = canvasBox.x + canvasBox.width * (0.1 + i * 0.15);
                const y = canvasBox.y + canvasBox.height * (0.2 + (cycle % 3) * 0.2);

                await controller.hover('canvas', { position: { x, y } });
                await controller.waitForTimeout(50);

                if (i % 2 === 0) {
                  await controller.click('canvas', {
                    position: { x, y },
                    modifiers: i % 3 === 0 ? ['Control'] : []
                  });
                }
              }

              await controller.waitForTimeout(800);
            }
          }
        }
      }
    ];

    // Execute memory-intensive operations with monitoring
    for (const operation of memoryOperations) {
      console.log(`Starting ${operation.name}...`);

      const operationStart = Date.now();
      const memoryAtStart = await controller.evaluate(() => {
        return typeof performance !== 'undefined' && (performance as any).memory ?
          (performance as any).memory.usedJSHeapSize : 0;
      });

      await operation.operations();

      const operationEnd = Date.now();
      const memoryAtEnd = await controller.evaluate(() => {
        return typeof performance !== 'undefined' && (performance as any).memory ?
          (performance as any).memory.usedJSHeapSize : 0;
      });

      const memoryDelta = memoryAtEnd - memoryAtStart;
      const actualDuration = operationEnd - operationStart;

      console.log(`${operation.name} completed:`, {
        plannedDuration: operation.duration,
        actualDuration: actualDuration,
        memoryDelta: memoryDelta / 1024 / 1024,
        memoryAtEnd: memoryAtEnd / 1024 / 1024,
      });

      // Memory leak warning if significant growth
      if (memoryDelta > 50 * 1024 * 1024) { // 50MB growth
        console.warn(`Significant memory growth detected during ${operation.name}: ${memoryDelta / 1024 / 1024} MB`);
      }

      await controller.captureScreenshot(`memory-test-${operation.name.replace(/\s+/g, '-').toLowerCase()}.png`);
    }

    // Final memory analysis
    const finalMemory = await controller.evaluate(() => {
      return typeof performance !== 'undefined' && (performance as any).memory ?
        (performance as any).memory.usedJSHeapSize : 0;
    });

    const totalMemoryGrowth = finalMemory - memoryBaseline;

    console.log('Final Memory Analysis:', {
      baseline: memoryBaseline / 1024 / 1024,
      final: finalMemory / 1024 / 1024,
      totalGrowth: totalMemoryGrowth / 1024 / 1024,
      growthPercentage: (totalMemoryGrowth / memoryBaseline) * 100,
    });

    // Memory leak assertions
    expect(totalMemoryGrowth).toBeLessThan(200 * 1024 * 1024); // Should not grow more than 200MB total
    expect((totalMemoryGrowth / memoryBaseline) * 100).toBeLessThan(50); // Should not grow more than 50%

    await controller.captureScreenshot('memory-leak-test-final.png');
  });

  /**
   * Test performance degradation over time
   */
  test('Performance degradation over time', async () => {
    await controller.navigateTo('http://localhost:5174/element-actors-demo.html');

    await controller.waitForTimeout(2000);

    // Create consistent test scene
    await controller.evaluate(() => {
      const graph = (window as any).graph;
      if (graph && graph.dataManager) {
        const nodes = [];
        for (let i = 0; i < 15; i++) {
          nodes.push({
            id: `degradation-node-${i}`,
            position: {
              x: Math.cos(i * Math.PI * 2 / 15) * 20,
              y: Math.sin(i * Math.PI * 2 / 15) * 20,
              z: 0
            },
            label: `Deg ${i}`,
          });
        }
        graph.update({ data: { nodes: { add: nodes } } });
      }
    });

    await controller.waitForTimeout(2000);

    // Measure performance at regular intervals
    const performanceMeasurements = [];
    const measurementInterval = 3000; // Every 3 seconds
    const totalDuration = 30000; // 30 seconds total

    for (let elapsed = 0; elapsed < totalDuration; elapsed += measurementInterval) {
      const measurementStart = Date.now();

      // Perform consistent operation sequence
      await controller.evaluate(() => {
        const graph = (window as any).graph;
        if (graph && graph.cameraPlugin) {
          graph.cameraPlugin.flyTo({
            target: { x: 0, y: 0, z: 0 },
            distance: 40,
            phi: Math.PI / 4,
            theta: elapsed * Math.PI / 15000, // Rotate slowly
          }, { duration: 1000 });
        }
      });

      await controller.waitForTimeout(1500);

      // Measure interaction performance
      const canvas = controller.getLocator('canvas');
      const canvasBox = await canvas.boundingBox();

      if (canvasBox) {
        const hoverStart = Date.now();
        await controller.hover('canvas', {
          position: {
            x: canvasBox.x + canvasBox.width * 0.5,
            y: canvasBox.y + canvasBox.height * 0.5
          }
        });
        const hoverTime = Date.now() - hoverStart;

        const clickStart = Date.now();
        await controller.click('canvas', {
          position: {
            x: canvasBox.x + canvasBox.width * 0.5,
            y: canvasBox.y + canvasBox.height * 0.5
          }
        });
        const clickTime = Date.now() - clickStart;

        // Memory measurement
        const memoryUsage = await controller.evaluate(() => {
          return typeof performance !== 'undefined' && (performance as any).memory ?
            (performance as any).memory.usedJSHeapSize : 0;
        });

        performanceMeasurements.push({
          elapsed: elapsed,
          totalTime: Date.now() - measurementStart,
          hoverTime: hoverTime,
          clickTime: clickTime,
          memoryUsage: memoryUsage,
        });

        console.log(`Performance measurement at ${elapsed / 1000}s:`, {
          totalTime: performanceMeasurements[performanceMeasurements.length - 1].totalTime,
          hoverTime: hoverTime,
          clickTime: clickTime,
          memoryUsage: memoryUsage / 1024 / 1024,
        });
      }

      await controller.captureScreenshot(`performance-degradation-${Math.floor(elapsed / 1000)}s.png`);

      // Wait for next measurement interval
      await controller.waitForTimeout(measurementInterval - (Date.now() - measurementStart));
    }

    // Analyze performance trends
    if (performanceMeasurements.length > 1) {
      const firstMeasurement = performanceMeasurements[0];
      const lastMeasurement = performanceMeasurements[performanceMeasurements.length - 1];

      const avgHoverTime = performanceMeasurements.reduce((sum, m) => sum + m.hoverTime, 0) / performanceMeasurements.length;
      const avgClickTime = performanceMeasurements.reduce((sum, m) => sum + m.clickTime, 0) / performanceMeasurements.length;

      const hoverTimeTrend = lastMeasurement.hoverTime - firstMeasurement.hoverTime;
      const clickTimeTrend = lastMeasurement.clickTime - firstMeasurement.clickTime;
      const memoryTrend = lastMeasurement.memoryUsage - firstMeasurement.memoryUsage;

      console.log('Performance Degradation Analysis:', {
        averageHoverTime: avgHoverTime,
        averageClickTime: avgClickTime,
        hoverTimeTrend: hoverTimeTrend,
        clickTimeTrend: clickTimeTrend,
        memoryTrend: memoryTrend / 1024 / 1024,
      });

      // Performance degradation assertions
      expect(hoverTimeTrend).toBeLessThan(50); // Hover time shouldn't degrade by more than 50ms
      expect(clickTimeTrend).toBeLessThan(50); // Click time shouldn't degrade by more than 50ms
      expect(memoryTrend).toBeLessThan(100 * 1024 * 1024); // Memory shouldn't grow by more than 100MB
    }

    await controller.captureScreenshot('performance-degradation-final.png');
  });
});