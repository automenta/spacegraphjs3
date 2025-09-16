import { SpaceGraph } from '../src/index';
import { GraphElement } from '../src/types';

const NUM_NODES = 10000;

const nodes: GraphElement[] = [];
for (let i = 0; i < NUM_NODES; i++) {
  nodes.push({
    id: `n${i}`,
    type: 'sphere',
    position: {
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      z: Math.random() * 100 - 50,
    },
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  });
}

const graph = new SpaceGraph('#container', {
  data: {
    nodes,
    edges: [],
  },
  style: {
    'node:hover': {
      color: '#ff0000',
    },
    'node:selected': {
      color: '#00ff00',
    },
  },
  layout: {
    type: 'force-directed',
    charge: -30,
    linkDistance: 1,
  },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: 0,
    theta: 0,
    distance: 250,
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 10,
      zoomSpeed: 1,
      orbitSpeed: 1,
    },
  },
  performance: {
    instancingThreshold: 100,
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: [],
  },
});

console.log('SpaceGraph instance with large graph created:', graph);
