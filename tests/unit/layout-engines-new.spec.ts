import { describe, expect, it } from 'vitest';
import { createTestGraph, nextTick } from './test-utils';
import { SpaceGraph, CircleLayoutSpec, ColumnLayoutSpec, RowLayoutSpec, LayoutPlugin } from '../../src';

describe('New Layout Engines', () => {
  it('should arrange nodes in a circle layout', async () => {
    const circleSpec: CircleLayoutSpec = {
      type: 'circle',
      radius: 10,
      dimensions: 2,
      center: { x: 0, y: 0, z: 0 },
      startAngle: 0,
      direction: 'clockwise',
      distribution: 'equal'
    };

    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere' },
          { id: 'n2', type: 'sphere' },
          { id: 'n3', type: 'sphere' },
          { id: 'n4', type: 'sphere' }
        ],
        edges: []
      },
      layout: circleSpec,
      style: {},
      camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
      controls: { keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 } },
      performance: { instancingThreshold: 200 },
      interaction: { hoveredElementId: null, selectedElementIds: [] }
    } as any);

    // Initialize the layout plugin to apply the layout
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    layoutPlugin.updateLayoutEngine();

    await nextTick();

    const nodes = graph.state.data.nodes;
    expect(nodes).toHaveLength(4);
    
    // Check that nodes are arranged in a circle
    nodes.forEach(node => {
      expect(node.position).toBeDefined();
      if (node.position) {
        // Calculate distance from center
        const distance = Math.sqrt(
          node.position.x * node.position.x + 
          node.position.y * node.position.y
        );
        // Should be approximately equal to radius (10)
        expect(distance).toBeCloseTo(10, 1);
        // All nodes should be at z = 0 for 2D layout
        expect(node.position.z).toBe(0);
      }
    });

    cleanup();
  });

  it('should arrange nodes in a column layout', async () => {
    const columnSpec: ColumnLayoutSpec = {
      type: 'column',
      spacing: 5,
      columns: 2,
      columnSpacing: 10,
      origin: { x: 0, y: 0, z: 0 },
      maxNodesPerColumn: 3
    };

    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere' },
          { id: 'n2', type: 'sphere' },
          { id: 'n3', type: 'sphere' },
          { id: 'n4', type: 'sphere' },
          { id: 'n5', type: 'sphere' }
        ],
        edges: []
      },
      layout: columnSpec,
      style: {},
      camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
      controls: { keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 } },
      performance: { instancingThreshold: 200 },
      interaction: { hoveredElementId: null, selectedElementIds: [] }
    } as any);

    // Initialize the layout plugin to apply the layout
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    layoutPlugin.updateLayoutEngine();

    await nextTick();

    const nodes = graph.state.data.nodes;
    expect(nodes).toHaveLength(5);
    
    // Check that nodes are arranged in columns
    nodes.forEach(node => {
      expect(node.position).toBeDefined();
      if (node.position) {
        // All nodes should be at z = 0
        expect(node.position.z).toBe(0);
      }
    });

    cleanup();
  });

  it('should arrange nodes in a row layout', async () => {
    const rowSpec: RowLayoutSpec = {
      type: 'row',
      spacing: 4,
      rows: 2,
      rowSpacing: 8,
      origin: { x: 0, y: 0, z: 0 },
      maxNodesPerRow: 3
    };

    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere' },
          { id: 'n2', type: 'sphere' },
          { id: 'n3', type: 'sphere' },
          { id: 'n4', type: 'sphere' },
          { id: 'n5', type: 'sphere' }
        ],
        edges: []
      },
      layout: rowSpec,
      style: {},
      camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
      controls: { keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 } },
      performance: { instancingThreshold: 200 },
      interaction: { hoveredElementId: null, selectedElementIds: [] }
    } as any);

    // Initialize the layout plugin to apply the layout
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    layoutPlugin.updateLayoutEngine();

    await nextTick();

    const nodes = graph.state.data.nodes;
    expect(nodes).toHaveLength(5);
    
    // Check that nodes are arranged in rows
    nodes.forEach(node => {
      expect(node.position).toBeDefined();
      if (node.position) {
        // All nodes should be at z = 0
        expect(node.position.z).toBe(0);
      }
    });

    cleanup();
  });

  it('should handle pinned nodes correctly in new layouts', async () => {
    const circleSpec: CircleLayoutSpec = {
      type: 'circle',
      radius: 10,
      dimensions: 2,
      center: { x: 0, y: 0, z: 0 }
    };

    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', pinning: { x: 100, y: 200, z: 0 } }, // Pinned node
          { id: 'n2', type: 'sphere' }, // Unpinned node
          { id: 'n3', type: 'sphere' }  // Unpinned node
        ],
        edges: []
      },
      layout: circleSpec,
      style: {},
      camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
      controls: { keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 } },
      performance: { instancingThreshold: 200 },
      interaction: { hoveredElementId: null, selectedElementIds: [] }
    } as any);

    // Initialize the layout plugin to apply the layout
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    layoutPlugin.updateLayoutEngine();

    await nextTick();

    const nodes = graph.state.data.nodes;
    
    // Pinned node should maintain its position
    const pinnedNode = nodes.find(n => n.id === 'n1');
    expect(pinnedNode?.position).toEqual({ x: 100, y: 200, z: 0 });
    
    // Unpinned nodes should be arranged in circle
    const unpinnedNodes = nodes.filter(n => n.id !== 'n1');
    unpinnedNodes.forEach(node => {
      expect(node.position).toBeDefined();
      if (node.position) {
        const distance = Math.sqrt(
          node.position.x * node.position.x + 
          node.position.y * node.position.y
        );
        expect(distance).toBeCloseTo(10, 1);
      }
    });

    cleanup();
  });
});