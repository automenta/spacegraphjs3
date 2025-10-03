import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import {
  CameraPlugin,
  HUDPlugin,
  InteractionPlugin,
  LayoutPlugin,
  SpaceGraph,
  Spec,
} from '../src';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Create a graph with enough nodes to trigger BasicRenderer (> 100 nodes)
const nodes = [];
for (let i = 0; i < 150; i++) {
  nodes.push({
    id: `n${i}`,
    type: 'sphere',
    label: `Node ${i}`,
    color: `hsl(${i * 2.4}, 70%, 50%)`,
    position: {
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      z: (Math.random() - 0.5) * 200,
    },
  });
}

const edges = [];
for (let i = 0; i < 50; i++) {
  const source = Math.floor(Math.random() * nodes.length);
  const target = Math.floor(Math.random() * nodes.length);
  if (source !== target) {
    edges.push({
      id: `e${i}`,
      source: `n${source}`,
      target: `n${target}`,
    });
  }
}

// 1. Define the initial state of the graph.
const initialSpec: Spec = {
  data: {
    nodes,
    edges,
  },
  layout: {
    type: 'random',
  },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: 0.2,
    theta: 0.1,
    distance: 300,
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 0.1,
      zoomSpeed: 0.1,
      orbitSpeed: 0.02,
    },
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: [],
  },
  style: {
    'node:hover': { color: '#ffff00' },
    'node:selected': {
      color: '#ffffff',
      glow: { color: '#ffffff', strength: 1.5 },
    },
  },
  performance: {
    instancingThreshold: 100,
    useBasicRenderer: true, // Force BasicRenderer for testing
  },
};

// 2. Define the plugins to use.
const plugins = [
  new LayoutPlugin(),
  new CameraPlugin(),
  new InteractionPlugin(),
  new HUDPlugin(),
];

// 3. Create the SpaceGraph instance.
const graph = new SpaceGraph('#container', initialSpec, plugins);

// 4. Expose the graph instance for debugging and testing via the console and the HUD REPL.
(window as any).graph = graph;
console.log(`
  SpaceGraphJS BasicRenderer Test Initialized!
  --------------------------------------------
  This test uses the BasicRenderer for ${nodes.length} nodes.

  You can interact with the graph instance via the 'graph' variable in the console,
  or by using the REPL at the bottom of the screen.

  Try commands like:
  - graph.camera.flyTo({ distance: 5 }, { duration: 1000 })
  - graph.update({ style: { 'node:selected': { color: '#ff00ff' } } })
  - const nodes = graph.state.data.nodes; graph.camera.frame(nodes)

  Keyboard Controls:
  - Pan: W, A, S, D
  - Orbit: Arrow Keys
  - Zoom: + (or =) / -
`);

// 5. Use the new event system to react to graph events.
graph.on('element:click', ({ target }) => {
  console.log(`Element clicked:`, target);
});

graph.on('element:hover:enter', ({ target }) => {
  console.log('Hover entered:', target.id);
});

graph.on('element:hover:leave', ({ target }) => {
  console.log('Hover left:', target.id);
});
