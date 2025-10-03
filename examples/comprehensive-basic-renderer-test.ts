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
  NodeSpec,
} from '../src';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Create a comprehensive test with all node types
const nodes: NodeSpec[] = [
  // Sphere nodes
  {
    id: 'sphere1',
    type: 'sphere',
    label: 'Red Sphere',
    color: '#ff0000',
    position: { x: -50, y: 50, z: 0 },
  },
  {
    id: 'sphere2',
    type: 'sphere',
    label: 'Green Sphere',
    color: '#00ff00',
    position: { x: 50, y: 50, z: 0 },
  },

  // Box nodes
  {
    id: 'box1',
    type: 'box',
    label: 'Yellow Box',
    color: '#ffff00',
    position: { x: -50, y: 0, z: 0 },
  },
  {
    id: 'box2',
    type: 'box',
    label: 'Magenta Box',
    color: '#ff00ff',
    position: { x: 50, y: 0, z: 0 },
  },

  // Text node
  {
    id: 'text1',
    type: 'text',
    text: 'TEXT',
    color: '#00ffff',
    position: { x: 0, y: -50, z: 0 },
  } as NodeSpec,

  // Custom geometry node
  {
    id: 'custom1',
    type: 'custom',
    label: 'Custom',
    color: '#ff8000',
    position: { x: 0, y: 0, z: 50 },
  },

  // HTML nodes
  {
    id: 'html1',
    type: 'html',
    content: '<div style="background: gray; color: white; padding: 5px; border-radius: 3px;">HTML Node 1</div>',
    position: { x: -25, y: -25, z: 0 },
  } as NodeSpec,
  {
    id: 'html2',
    type: 'html',
    content: '<div style="background: gray; color: white; padding: 5px; border-radius: 3px;">HTML Node 2</div>',
    position: { x: 25, y: -25, z: 0 },
  } as NodeSpec,
];

const edges = [
  // Straight edges
  { id: 'e1', source: 'sphere1', target: 'box1' },
  { id: 'e2', source: 'sphere2', target: 'box2' },

  // Curved edges
  { id: 'e3', source: 'box1', target: 'text1', style: { type: 'curved' } },
  { id: 'e4', source: 'box2', target: 'text1', style: { type: 'curved' } },

  // Dashed edges
  { id: 'e5', source: 'text1', target: 'custom1', style: { type: 'dashed' } },
  { id: 'e6', source: 'custom1', target: 'html1', style: { type: 'dashed' } },
  { id: 'e7', source: 'custom1', target: 'html2', style: { type: 'dashed' } },
];

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
    distance: 150,
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
    
    'edge:hover': {
      color: '#ffffff',
      width: 3,
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
  SpaceGraphJS Comprehensive BasicRenderer Test Initialized!
  ---------------------------------------------------------
  This test demonstrates all node types with the BasicRenderer.

  Node Types:
  - Sphere nodes (red, green)
  - Box nodes (yellow, magenta)
  - Text node (cyan)
  - Custom geometry node (orange)
  - HTML nodes (gray with white text)

  Edge Types:
  - Straight edges
  - Curved edges
  - Dashed edges

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