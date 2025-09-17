import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import { SpaceGraph } from '../src/core/SpaceGraph';
import { Spec } from '../src/types';
import { LayoutPlugin } from '../src/plugins/LayoutPlugin';
import { CameraPlugin } from '../src/plugins/CameraPlugin';
import { InteractionPlugin } from '../src/plugins/InteractionPlugin';
import { HUDPlugin } from '../src/plugins/HUDPlugin';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// 1. Define the initial state of the graph.
const initialSpec: Spec = {
  data: {
    nodes: [
      { id: 'n1', type: 'sphere', label: 'Node 1', color: '#ff5733' },
      { id: 'n2', type: 'sphere', label: 'Node 2', color: '#33ff57' },
      { id: 'n3', type: 'sphere', label: 'Node 3', color: '#3357ff' },
      { id: 'n4', type: 'sphere', label: 'Node 4', color: '#ff33a1' },
      { id: 'n5', type: 'sphere', label: 'Node 5', color: '#a133ff' },
      {
        id: 'n6',
        type: 'html',
        content: '<div>Hello World!</div>',
        className: 'my-html-node',
      },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e5', source: 'n2', target: 'n6' },
      { id: 'e2', source: 'n1', target: 'n3' },
      { id: 'e3', source: 'n1', target: 'n4' },
      { id: 'e4', source: 'n1', target: 'n5' },
    ],
  },
  layout: {
    type: 'random',
  },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: 0.2,
    theta: 0.1,
    distance: 15,
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
  SpaceGraphJS Initialized!
  -------------------------
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
