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

const spec: Spec = {
  data: {
    nodes: [
      { id: 'n1', type: 'sphere', label: 'Node 1', color: '#ff5733' },
      { id: 'n2', type: 'sphere', label: 'Node 2', color: '#33ff57' },
      { id: 'n3', type: 'sphere', label: 'Node 3', color: '#3357ff' },
      { id: 'n4', type: 'sphere', label: 'Node 4', color: '#ff33a1' },
      { id: 'n5', type: 'sphere', label: 'Node 5', color: '#a133ff' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n1', target: 'n3' },
      { id: 'e3', source: 'n1', target: 'n4' },
      { id: 'e4', source: 'n1', target: 'n5' },
    ],
  },
  style: {
    'node:hover': { color: '#ffff00' },
    'node:selected': {
      color: '#ffffff',
      glow: { color: '#ffffff', strength: 1.5 },
    },
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
  performance: {
    instancingThreshold: 100, // This will trigger instanced rendering
    useBasicRenderer: true, // Use BasicRenderer instead of InstancedRenderer
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

// Expose graph to window for easy debugging and testing
(window as any).graph = graph;
console.log('SpaceGraph instance with BasicRenderer created:', graph);