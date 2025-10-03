import { SpaceGraph } from '../src';

// Example demonstrating the simplified getting started API
async function createSimpleGraph() {
  // Create a simple graph with just nodes and edges
  const graph = SpaceGraph.create({
    nodes: [
      { id: '1', type: 'sphere', label: 'Node 1', position: { x: 0, y: 0, z: 0 } },
      { id: '2', type: 'sphere', label: 'Node 2', position: { x: 10, y: 0, z: 0 } },
      { id: '3', type: 'sphere', label: 'Node 3', position: { x: 5, y: 10, z: 0 } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2', color: '#ff6b6b' },
      { id: 'e2', source: '2', target: '3', color: '#4ecdc4' },
      { id: 'e3', source: '3', target: '1', color: '#45b7d1' },
    ],
    container: '#graph-container',
  });

  // The graph is now fully set up with:
  // - Automatic BVH acceleration for fast raycasting
  // - Default plugins (Layout, Camera, Interaction)
  // - Auto-selected layout based on data size (force-directed for small graphs)
  // - Zero-config camera positioning
  // - Default styling presets

  console.log('Simple graph created successfully!');

  // You can still interact with the graph normally
  graph.on('element:click', ({ target }) => {
    console.log('Clicked element:', target.id);
  });

  return graph;
}

// Example with custom configuration
async function createCustomGraph() {
  const graph = SpaceGraph.create({
    nodes: [
      // Many more nodes for a larger graph
      ...Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        type: 'sphere',
        label: `Node ${i}`,
      })),
    ],
    edges: [
      // Generate some random edges
      ...Array.from({ length: 150 }, (_, i) => ({
        id: `edge-${i}`,
        source: `node-${Math.floor(Math.random() * 100)}`,
        target: `node-${(Math.floor(Math.random() * 100) + 1) % 100}`,
      })),
    ],
    layout: 'grid', // Explicitly choose grid layout for large datasets
    useBasicRenderer: true, // Use basic renderer for better performance
    style: {
      'node:hover': {
        color: '#ff0000',
        glow: { color: '#ff0000', strength: 1.0 },
      },
    },
    camera: {
      distance: 100,
    },
  });

  console.log('Custom large graph created with grid layout and basic renderer!');
  return graph;
}

// Export for use in examples
export { createSimpleGraph, createCustomGraph };