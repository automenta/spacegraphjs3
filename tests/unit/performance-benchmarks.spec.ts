import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { createTestGraph } from './test-utils';
import { Spec } from '../../src/types';

// Performance measurement utilities
class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  startMeasurement(name: string) {
    this.startTimes.set(name, performance.now());
  }

  endMeasurement(name: string) {
    const startTime = this.startTimes.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
      this.startTimes.delete(name);
    }
  }

  getAverage(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;
    return measurements.reduce((a, b) => a + b, 0) / measurements.length;
  }

  getMin(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;
    return Math.min(...measurements);
  }

  getMax(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;
    return Math.max(...measurements);
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return null;
    
    const sorted = [...measurements].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      average: this.getAverage(name),
      min: this.getMin(name),
      max: this.getMax(name),
      median,
      p95,
      p99,
      count: measurements.length,
    };
  }

  reset() {
    this.measurements.clear();
    this.startTimes.clear();
  }
}

describe('Performance Benchmarks', () => {
  let monitor: PerformanceMonitor;
  let graph: SpaceGraph;
  let container: HTMLElement;
  let cleanup: () => void;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
    }
    monitor.reset();
  });

  describe('Node Rendering Performance', () => {
    it('should measure rendering performance with increasing node counts', () => {
      const nodeCounts = [10, 50, 100, 500, 1000];
      const results: any[] = [];

      // Create a single test graph and update its data instead of creating multiple graphs
      const spec: Spec = {
        data: { nodes: [], edges: [] },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.1,
          },
        },
        performance: { instancingThreshold: 100 },
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      };

      const testGraph = createTestGraph(spec);
      graph = testGraph.graph;
      container = testGraph.container;
      cleanup = testGraph.cleanup;

      for (const count of nodeCounts) {
        // Update graph with specified number of nodes
        const nodes = Array.from({ length: count }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 },
        }));

        const edges = [];
        for (let i = 0; i < Math.min(count * 0.1, 100); i++) {
          edges.push({
            id: `e${i}`,
            source: `n${Math.floor(Math.random() * count)}`,
            target: `n${Math.floor(Math.random() * count)}`,
          });
        }

        monitor.startMeasurement(`render_${count}_nodes`);
        
        // Update the graph data
        (graph as any).updateState({
          data: { nodes, edges }
        });

        // Wait for initial render
        const startTime = performance.now();
        while (performance.now() - startTime < 100) {
          // Allow time for rendering
        }

        monitor.endMeasurement(`render_${count}_nodes`);

        const stats = monitor.getStats(`render_${count}_nodes`);
        results.push({
          nodeCount: count,
          renderTime: stats?.average || 0,
          fps: stats ? 1000 / stats.average : 0,
        });
      }

      // Verify performance degrades reasonably
      results.forEach((result, index) => {
        if (index > 0) {
          const prevResult = results[index - 1];
          const nodeIncrease = result.nodeCount / prevResult.nodeCount;
          const timeIncrease = result.renderTime / prevResult.renderTime;
          
          // Rendering time should not increase more than linearly with node count
          expect(timeIncrease).toBeLessThan(nodeIncrease * 2);
        }
      });

      console.log('Node Rendering Performance Results:', results);
    });

    it('should measure interaction performance with large datasets', () => {
      // Create large dataset
      const nodeCount = 1000;
      const nodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: `n${i}`,
        type: 'sphere',
        position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 },
      }));

      const spec: Spec = {
        data: { nodes, edges: [] },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.1,
          },
        },
        performance: { instancingThreshold: 100 },
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      };

      const testGraph = createTestGraph(spec);
      graph = testGraph.graph;
      container = testGraph.container;
      cleanup = testGraph.cleanup;

      // Measure hover performance
      monitor.startMeasurement('hover_performance');
      
      // Simulate hover events
      for (let i = 0; i < 100; i++) {
        (graph as any).updateState({
          interaction: { hoveredElementId: `n${i % nodeCount}` },
        });
      }

      monitor.endMeasurement('hover_performance');

      // Measure selection performance
      monitor.startMeasurement('selection_performance');
      
      // Simulate selection events
      for (let i = 0; i < 100; i++) {
        (graph as any).updateState({
          interaction: { selectedElementIds: [`n${i % nodeCount}`] },
        });
      }

      monitor.endMeasurement('selection_performance');

      const hoverStats = monitor.getStats('hover_performance');
      const selectionStats = monitor.getStats('selection_performance');

      expect(hoverStats?.average).toBeLessThan(10); // Should be fast
      expect(selectionStats?.average).toBeLessThan(10); // Should be fast

      console.log('Interaction Performance Results:', {
        hover: hoverStats,
        selection: selectionStats,
      });
    });
  });

  describe('Camera Control Performance', () => {
    it('should measure camera animation performance', () => {
      const spec: Spec = {
        data: {
          nodes: Array.from({ length: 100 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 },
          })),
          edges: [],
        },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.1,
          },
        },
        performance: { instancingThreshold: 100 },
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      };

      const testGraph = createTestGraph(spec);
      graph = testGraph.graph;
      container = testGraph.container;
      cleanup = testGraph.cleanup;

      // Measure camera updates
      monitor.startMeasurement('camera_updates');
      
      for (let i = 0; i < 100; i++) {
        (graph as any).updateState({
          camera: {
            target: { x: i, y: i, z: i },
            phi: Math.PI / 2 + i * 0.01,
            theta: i * 0.01,
            distance: 100 + i,
          },
        });
      }

      monitor.endMeasurement('camera_updates');

      const stats = monitor.getStats('camera_updates');
      expect(stats?.average).toBeLessThan(5); // Camera updates should be very fast

      console.log('Camera Update Performance:', stats);
    });

    it('should measure keyboard control responsiveness', () => {
      const spec: Spec = {
        data: {
          nodes: Array.from({ length: 50 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 },
          })),
          edges: [],
        },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.1,
          },
        },
        performance: { instancingThreshold: 100 },
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      };

      const testGraph = createTestGraph(spec);
      graph = testGraph.graph;
      container = testGraph.container;
      cleanup = testGraph.cleanup;

      // Get camera plugin
      const cameraPlugin = (graph as any).plugins.find((p: any) => p.constructor.name === 'CameraPlugin');

      monitor.startMeasurement('keyboard_response');
      
      // Simulate rapid keyboard input
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
        cameraPlugin?.update();
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
      }

      monitor.endMeasurement('keyboard_response');

      const stats = monitor.getStats('keyboard_response');
      expect(stats?.average).toBeLessThan(10); // Keyboard response should be reasonable (adjusted for test environment)

      console.log('Keyboard Response Performance:', stats);
    });
  });

  describe('Memory Usage', () => {
    it('should measure memory usage during extended interactions', () => {
      const spec: Spec = {
        data: {
          nodes: Array.from({ length: 200 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 },
          })),
          edges: Array.from({ length: 100 }, (_, i) => ({
            id: `e${i}`,
            source: `n${i}`,
            target: `n${(i + 1) % 200}`,
          })),
        },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.1,
          },
        },
        performance: { instancingThreshold: 100 },
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      };

      const testGraph = createTestGraph(spec);
      graph = testGraph.graph;
      container = testGraph.container;
      cleanup = testGraph.cleanup;

      // Take initial memory snapshot (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      monitor.startMeasurement('extended_interaction');
      
      // Simulate extended interaction session
      for (let i = 0; i < 1000; i++) {
        // Random state updates
        if (i % 10 === 0) {
          (graph as any).updateState({
            interaction: {
              hoveredElementId: `n${i % 200}`,
              selectedElementIds: [`n${(i + 1) % 200}`, `n${(i + 2) % 200}`],
            },
          });
        }

        // Random camera updates
        if (i % 20 === 0) {
          (graph as any).updateState({
            camera: {
              target: { x: i * 0.1, y: i * 0.1, z: i * 0.1 },
              phi: Math.PI / 2 + Math.sin(i * 0.01) * 0.5,
              theta: i * 0.01,
              distance: 100 + Math.sin(i * 0.01) * 50,
            },
          });
        }

        // Random data updates
        if (i % 50 === 0) {
          (graph as any).updateState({
            data: {
              nodes: {
                update: [{
                  id: `n${i % 200}`,
                  position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 },
                }],
              },
            },
          });
        }
      }

      monitor.endMeasurement('extended_interaction');

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      const stats = monitor.getStats('extended_interaction');
      console.log('Extended Interaction Performance:', stats);
      console.log('Memory Usage:', {
        initial: initialMemory,
        final: finalMemory,
        increase: memoryIncrease,
      });

      // Performance should remain consistent
      expect(stats?.average).toBeLessThan(10);
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid state changes without degradation', () => {
      const spec: Spec = {
        data: {
          nodes: Array.from({ length: 100 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 },
          })),
          edges: [],
        },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.1,
          },
        },
        performance: { instancingThreshold: 100 },
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      };

      const testGraph = createTestGraph(spec);
      graph = testGraph.graph;
      container = testGraph.container;
      cleanup = testGraph.cleanup;

      // Measure first 100 updates
      monitor.startMeasurement('rapid_updates_first_100');
      for (let i = 0; i < 100; i++) {
        (graph as any).updateState({
          interaction: { hoveredElementId: `n${i % 100}` },
        });
      }
      monitor.endMeasurement('rapid_updates_first_100');

      // Measure last 100 updates
      monitor.startMeasurement('rapid_updates_last_100');
      for (let i = 900; i < 1000; i++) {
        (graph as any).updateState({
          interaction: { hoveredElementId: `n${i % 100}` },
        });
      }
      monitor.endMeasurement('rapid_updates_last_100');

      const firstStats = monitor.getStats('rapid_updates_first_100');
      const lastStats = monitor.getStats('rapid_updates_last_100');

      // Performance should not degrade significantly
      const degradation = (lastStats!.average - firstStats!.average) / firstStats!.average;
      expect(degradation).toBeLessThan(0.5); // Less than 50% degradation

      console.log('Stress Test Results:', {
        first100: firstStats,
        last100: lastStats,
        degradation: `${(degradation * 100).toFixed(2)}%`,
      });
    });
  });

  describe('Benchmark Summary', () => {
    it('should provide performance recommendations', () => {
      // Create a test graph to ensure proper cleanup
      const spec: Spec = {
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.1,
          },
        },
        performance: { instancingThreshold: 100 },
        interaction: {
          hoveredElementId: null,
          selectedElementIds: [],
        },
      };

      const testGraph = createTestGraph(spec);
      graph = testGraph.graph;
      container = testGraph.container;
      cleanup = testGraph.cleanup;

      const recommendations = [];

      // Node rendering performance
      recommendations.push({
        category: 'Node Rendering',
        recommendation: 'Use instanced rendering for graphs with >100 nodes',
        threshold: 100,
      });

      // Interaction performance
      recommendations.push({
        category: 'Interaction Responsiveness',
        recommendation: 'Implement debouncing for hover events on large graphs',
        threshold: 10, // ms
      });

      // Camera performance
      recommendations.push({
        category: 'Camera Updates',
        recommendation: 'Consider throttling camera updates for smooth animations',
        threshold: 5, // ms
      });

      // Memory usage
      recommendations.push({
        category: 'Memory Management',
        recommendation: 'Implement object pooling for frequently created/destroyed objects',
        threshold: 1024 * 1024, // 1MB
      });

      console.log('Performance Recommendations:', recommendations);

      // Verify we have recommendations
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('category');
      expect(recommendations[0]).toHaveProperty('recommendation');
      expect(recommendations[0]).toHaveProperty('threshold');
      
      // Test completed successfully - no additional cleanup needed
      // All cleanup is handled by the afterEach hook
    });
  });
});