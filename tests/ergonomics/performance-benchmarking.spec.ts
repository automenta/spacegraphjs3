import { test, expect } from '@playwright/test';

/**
 * Performance Benchmarking for Ergonomics
 *
 * This test suite benchmarks performance metrics critical to user experience
 * and ergonomics, ensuring videogame-like responsiveness and smooth interactions.
 */

test.describe('Performance Benchmarking for Ergonomics', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000); // Extended timeout for performance tests
  });

  test('Camera movement performance benchmark', async ({ page }) => {
    await page.goto('/examples/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Benchmark camera movement performance
    const benchmarkResults = await page.evaluate(async () => {
      const graph = (window as any).graph;
      if (!graph?.cameraPlugin) return null;

      const results = {
        wasdMovement: [] as number[],
        mouseOrbit: [] as number[],
        zoomOperations: [] as number[],
        flyToAnimations: [] as number[],
        frameDrops: 0,
        averageFps: 0,
      };

      // Monitor frame rate during operations
      let frameCount = 0;
      let lastFrameTime = performance.now();
      const frameTimes: number[] = [];

      const frameMonitor = () => {
        const now = performance.now();
        const delta = now - lastFrameTime;
        frameTimes.push(delta);
        lastFrameTime = now;
        frameCount++;

        if (frameCount < 300) {
          // Monitor for 5 seconds at 60fps
          requestAnimationFrame(frameMonitor);
        }
      };
      requestAnimationFrame(frameMonitor);

      // Test WASD movement
      const wasdKeys = ['w', 's', 'a', 'd'];
      for (const key of wasdKeys) {
        const startTime = performance.now();

        // Simulate key press (in real browser this would be handled by keyboard events)
        if (graph.cameraPlugin) {
          // Trigger movement programmatically for benchmarking
          const currentState = { ...graph.state.camera };
          const newState = { ...currentState };

          switch (key) {
            case 'w':
              newState.target.z -= 1;
              break;
            case 's':
              newState.target.z += 1;
              break;
            case 'a':
              newState.target.x -= 1;
              break;
            case 'd':
              newState.target.x += 1;
              break;
          }

          graph.update({ camera: newState });
        }

        const endTime = performance.now();
        results.wasdMovement.push(endTime - startTime);
      }

      // Test flyTo animations
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();

        const targets = [
          { target: { x: 5, y: 5, z: 5 }, distance: 20 },
          { target: { x: -5, y: -5, z: -5 }, distance: 25 },
          { target: { x: 0, y: 10, z: 0 }, distance: 30 },
        ];

        await new Promise<void>((resolve) => {
          graph.cameraPlugin.flyTo(targets[i], {
            duration: 300,
            onComplete: () => resolve(),
          });
        });

        const endTime = performance.now();
        results.flyToAnimations.push(endTime - startTime);
      }

      // Wait for frame monitoring to complete
      await new Promise((resolve) => setTimeout(resolve, 5100));

      // Calculate frame statistics
      if (frameTimes.length > 0) {
        const avgFrameTime =
          frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        results.averageFps = 1000 / avgFrameTime;
        results.frameDrops = frameTimes.filter((time) => time > 16.67).length; // Frames over 16.67ms (60fps)
      }

      return results;
    });

    expect(benchmarkResults).not.toBeNull();
    if (benchmarkResults) {
      // Camera movement should be very fast (< 10ms)
      const avgWASDMovement =
        benchmarkResults.wasdMovement.reduce((a, b) => a + b, 0) /
        benchmarkResults.wasdMovement.length;
      expect(avgWASDMovement).toBeLessThan(10);

      // FlyTo animations should complete within expected time bounds
      const avgFlyToTime =
        benchmarkResults.flyToAnimations.reduce((a, b) => a + b, 0) /
        benchmarkResults.flyToAnimations.length;
      expect(avgFlyToTime).toBeGreaterThan(250); // At least 250ms
      expect(avgFlyToTime).toBeLessThan(500); // Less than 500ms

      // Should maintain reasonable frame rate
      expect(benchmarkResults.averageFps).toBeGreaterThan(30);
      expect(
        benchmarkResults.frameDrops / benchmarkResults.wasdMovement.length
      ).toBeLessThan(0.2); // Less than 20% frame drops

      console.log(
        `Camera Performance - WASD: ${avgWASDMovement.toFixed(2)}ms, FlyTo: ${avgFlyToTime.toFixed(2)}ms, FPS: ${benchmarkResults.averageFps.toFixed(1)}, Frame drops: ${benchmarkResults.frameDrops}`
      );
    }
  });

  test('Interaction responsiveness benchmark', async ({ page }) => {
    await page.goto('/examples/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    const benchmarkResults = await page.evaluate(async () => {
      const graph = (window as any).graph;
      if (!graph) return null;

      const results = {
        hoverResponseTimes: [] as number[],
        clickResponseTimes: [] as number[],
        selectionResponseTimes: [] as number[],
        averageFps: 0,
        memoryUsage: 0,
      };

      // Monitor performance during interactions
      let frameCount = 0;
      const frameTimes: number[] = [];
      let lastFrameTime = performance.now();

      const frameMonitor = () => {
        const now = performance.now();
        frameTimes.push(now - lastFrameTime);
        lastFrameTime = now;
        frameCount++;

        if (frameCount < 180) {
          // Monitor for 3 seconds
          requestAnimationFrame(frameMonitor);
        }
      };
      requestAnimationFrame(frameMonitor);

      // Simulate hover interactions
      const nodes = graph.state.data.nodes || [];
      for (let i = 0; i < Math.min(5, nodes.length); i++) {
        const startTime = performance.now();

        // Simulate hover by updating interaction state
        graph.update({
          interaction: { hoveredElementId: nodes[i].id },
        });

        // Wait a bit for processing
        await new Promise((resolve) => setTimeout(resolve, 10));

        const endTime = performance.now();
        results.hoverResponseTimes.push(endTime - startTime);
      }

      // Simulate click interactions
      for (let i = 0; i < Math.min(3, nodes.length); i++) {
        const startTime = performance.now();

        // Simulate click by updating selection
        const currentSelection =
          graph.state.interaction?.selectedElementIds || [];
        graph.update({
          interaction: {
            selectedElementIds: [...currentSelection, nodes[i].id],
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        const endTime = performance.now();
        results.clickResponseTimes.push(endTime - startTime);
      }

      // Wait for monitoring to complete
      await new Promise((resolve) => setTimeout(resolve, 3100));

      // Calculate results
      if (frameTimes.length > 0) {
        const avgFrameTime =
          frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        results.averageFps = 1000 / avgFrameTime;
      }

      // Memory usage (if available)
      if ('memory' in performance) {
        results.memoryUsage =
          (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      return results;
    });

    expect(benchmarkResults).not.toBeNull();
    if (benchmarkResults) {
      // Hover should be very responsive
      const avgHoverTime =
        benchmarkResults.hoverResponseTimes.reduce((a, b) => a + b, 0) /
        benchmarkResults.hoverResponseTimes.length;
      expect(avgHoverTime).toBeLessThan(20);

      // Click should be reasonably responsive
      const avgClickTime =
        benchmarkResults.clickResponseTimes.reduce((a, b) => a + b, 0) /
        benchmarkResults.clickResponseTimes.length;
      expect(avgClickTime).toBeLessThan(50);

      // Should maintain good frame rate during interactions
      expect(benchmarkResults.averageFps).toBeGreaterThan(40);

      console.log(
        `Interaction Performance - Hover: ${avgHoverTime.toFixed(2)}ms, Click: ${avgClickTime.toFixed(2)}ms, FPS: ${benchmarkResults.averageFps.toFixed(1)}, Memory: ${benchmarkResults.memoryUsage.toFixed(1)}MB`
      );
    }
  });

  test('Rendering performance under load', async ({ page }) => {
    await page.goto('/examples/large-graph.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(3000); // Extra time for large graph

    const performanceResults = await page.evaluate(async () => {
      const graph = (window as any).graph;
      if (!graph) return null;

      const results = {
        nodeCount: 0,
        edgeCount: 0,
        initialLoadTime: 0,
        averageFrameTime: 0,
        fps: 0,
        memoryUsage: 0,
        drawCalls: 0,
      };

      // Count elements
      results.nodeCount = graph.state.data.nodes?.length || 0;
      results.edgeCount = graph.state.data.edges?.length || 0;

      // Monitor frame performance
      const frameTimes: number[] = [];
      let frameCount = 0;
      const startMonitorTime = performance.now();

      const monitorFrames = () => {
        frameCount++;
        const now = performance.now();
        const elapsed = now - startMonitorTime;

        if (frameCount > 1) {
          frameTimes.push(
            performance.now() - startMonitorTime - (frameCount - 1) * 16.67
          );
        }

        if (elapsed < 2000) {
          // Monitor for 2 seconds
          requestAnimationFrame(monitorFrames);
        }
      };
      requestAnimationFrame(monitorFrames);

      // Wait for monitoring
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // Calculate performance metrics
      if (frameTimes.length > 0) {
        results.averageFrameTime =
          frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        results.fps = 1000 / results.averageFrameTime;
      }

      // Memory usage
      if ('memory' in performance) {
        results.memoryUsage =
          (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }

      return results;
    });

    expect(performanceResults).not.toBeNull();
    if (performanceResults) {
      // Should handle large graphs reasonably well
      expect(performanceResults.fps).toBeGreaterThan(20); // At least 20 FPS for large graphs
      expect(performanceResults.averageFrameTime).toBeLessThan(50); // Less than 50ms frame time

      console.log(
        `Large Graph Performance - Nodes: ${performanceResults.nodeCount}, Edges: ${performanceResults.edgeCount}, FPS: ${performanceResults.fps.toFixed(1)}, Memory: ${performanceResults.memoryUsage.toFixed(1)}MB`
      );
    }
  });

  test('Animation system performance', async ({ page }) => {
    await page.goto('/examples/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    const animationResults = await page.evaluate(async () => {
      const graph = (window as any).graph;
      if (!graph?.cameraPlugin) return null;

      const results = {
        tweenPerformance: [] as number[],
        keyframePerformance: [] as number[],
        parallelAnimationPerformance: 0,
        fpsDuringAnimation: 0,
      };

      // Monitor frame rate during animations
      const frameTimes: number[] = [];
      let monitoring = true;

      const monitorFrames = () => {
        if (!monitoring) return;

        const now = performance.now();
        if (frameTimes.length > 0) {
          frameTimes.push(now - frameTimes[frameTimes.length - 1]);
        } else {
          frameTimes.push(now);
        }

        if (frameTimes.length < 120) {
          // Monitor for ~2 seconds
          requestAnimationFrame(monitorFrames);
        } else {
          monitoring = false;
        }
      };
      requestAnimationFrame(monitorFrames);

      // Test camera flyTo animation performance
      const flyToStart = performance.now();

      await new Promise<void>((resolve) => {
        graph.cameraPlugin.flyTo(
          {
            target: { x: 10, y: 0, z: 0 },
            distance: 35,
            phi: Math.PI / 4,
            theta: Math.PI / 6,
          },
          {
            duration: 800,
            onComplete: () => resolve(),
          }
        );
      });

      const flyToEnd = performance.now();
      results.tweenPerformance.push(flyToEnd - flyToStart);

      // Wait for frame monitoring to complete
      while (monitoring) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Calculate FPS during animation
      if (frameTimes.length > 1) {
        const deltas = [];
        for (let i = 1; i < frameTimes.length; i++) {
          deltas.push(frameTimes[i] - frameTimes[i - 1]);
        }
        const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        results.fpsDuringAnimation = 1000 / avgDelta;
      }

      return results;
    });

    expect(animationResults).not.toBeNull();
    if (animationResults) {
      // Animation should complete within expected time
      const avgTweenTime =
        animationResults.tweenPerformance.reduce((a, b) => a + b, 0) /
        animationResults.tweenPerformance.length;
      expect(avgTweenTime).toBeGreaterThan(700); // At least 700ms
      expect(avgTweenTime).toBeLessThan(1200); // Less than 1200ms

      // Should maintain good FPS during animation
      expect(animationResults.fpsDuringAnimation).toBeGreaterThan(30);

      console.log(
        `Animation Performance - Tween: ${avgTweenTime.toFixed(2)}ms, FPS during animation: ${animationResults.fpsDuringAnimation.toFixed(1)}`
      );
    }
  });

  test('Memory usage and cleanup efficiency', async ({ page }) => {
    await page.goto('/examples/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    const memoryResults = await page.evaluate(async () => {
      if (!('memory' in performance)) return null;

      const results = {
        initialMemory: 0,
        afterInteractions: 0,
        afterCleanup: 0,
        memoryLeak: 0,
      };

      const mem = (performance as any).memory;
      results.initialMemory = mem.usedJSHeapSize / 1024 / 1024;

      // Perform many interactions
      const graph = (window as any).graph;
      for (let i = 0; i < 50; i++) {
        graph.update({
          interaction: { hoveredElementId: `node-${i % 10}` },
        });
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      results.afterInteractions = mem.usedJSHeapSize / 1024 / 1024;

      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      results.afterCleanup = mem.usedJSHeapSize / 1024 / 1024;
      results.memoryLeak = results.afterCleanup - results.initialMemory;

      return results;
    });

    if (memoryResults) {
      // Memory leak should be minimal
      expect(memoryResults.memoryLeak).toBeLessThan(10); // Less than 10MB leak

      console.log(
        `Memory Usage - Initial: ${memoryResults.initialMemory.toFixed(1)}MB, After interactions: ${memoryResults.afterInteractions.toFixed(1)}MB, After cleanup: ${memoryResults.afterCleanup.toFixed(1)}MB, Leak: ${memoryResults.memoryLeak.toFixed(1)}MB`
      );
    }
  });
});
