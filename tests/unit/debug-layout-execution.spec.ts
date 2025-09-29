import { describe, expect, it, vi } from 'vitest';
import { createTestGraph, nextTick } from './test-utils';
import { SpaceGraph, LayoutPlugin, CircleLayout } from '../../src';

describe('Layout Execution Debug', () => {
  it('should instantiate and call circle layout', async () => {
    // Create a simple graph with circle layout
    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere' },
          { id: 'n2', type: 'sphere' },
          { id: 'n3', type: 'sphere' }
        ],
        edges: []
      },
      layout: {
        type: 'circle',
        radius: 10,
        dimensions: 2,
        center: { x: 0, y: 0, z: 0 }
      },
      style: {},
      camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
      controls: { keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 } },
      performance: { instancingThreshold: 200 },
      interaction: { hoveredElementId: null, selectedElementIds: [] }
    } as any);

    // Initialize layout plugin
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    layoutPlugin.updateLayoutEngine();

    console.log('=== LAYOUT DEBUG INFO ===');
    console.log('Layout engine type:', layoutPlugin.currentLayoutEngine?.constructor.name);
    console.log('Graph layout type:', graph.state.layout.type);
    console.log('Layout engine instance:', layoutPlugin.currentLayoutEngine);

    await nextTick();

    // Check if nodes have positions
    const nodes = graph.state.data.nodes;
    console.log('Nodes after layout:', nodes.map(n => ({
      id: n.id,
      hasPosition: !!n.position,
      position: n.position
    })));

    console.log('=== END DEBUG INFO ===');

    // Clean up
    cleanup();
  });
});