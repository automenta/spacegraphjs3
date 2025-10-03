import { SpaceGraph } from '../src';

const NUM_NODES = 1000;

const nodes: any[] = [];
for (let i = 0; i < NUM_NODES; i++) {
  nodes.push({
    id: `n${i}`,
    type: 'sphere',
    position: {
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      z: Math.random() * 100 - 50,
    },
    color: `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`,
  });
}

// Create a SpaceGraph instance using the simplified API
const graph = SpaceGraph.create({
  nodes,
  edges: [], // No edges for this example
  layout: 'force-directed', // Explicitly use force-directed layout
  container: '#container',
  style: {
    'node:hover': {
      color: '#ff0000',
    },
    'node:selected': {
      color: '#00ff00',
    },
  },
  camera: {
    distance: 250,
  },
  performance: {
    instancingThreshold: 100,
    // useBasicRenderer: true, // Uncomment this line to use BasicRenderer instead of InstancedRenderer
  },
  controls: {
    keyboard: {
      panSpeed: 1.0,
      zoomSpeed: 0.1,
      orbitSpeed: 0.005,
    },
  },
});

console.log('SpaceGraph instance with large graph created:', graph);
