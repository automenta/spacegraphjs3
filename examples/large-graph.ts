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

const NUM_NODES = 1000;

const nodes: NodeSpec[] = [];
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

const spec: Spec = {
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
  performance: {
    instancingThreshold: 100,
    // useBasicRenderer: true, // Uncomment this line to use BasicRenderer instead of InstancedRenderer
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 1.0,
      zoomSpeed: 0.1,
      orbitSpeed: 0.005,
    },
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: [],
  },
};

const plugins = [
  new LayoutPlugin(),
  new CameraPlugin(),
  new InteractionPlugin(),
  new HUDPlugin(),
];

const graph = new SpaceGraph('#container', spec, plugins);

console.log('SpaceGraph instance with large graph created:', graph);
