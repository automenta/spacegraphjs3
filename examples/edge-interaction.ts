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
  EdgeSpec,
} from '../src';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Create nodes
const nodes: NodeSpec[] = [
  {
    id: 'node-1',
    type: 'sphere',
    position: { x: -10, y: 0, z: 0 },
    color: '#ff0000',
    label: 'Node 1'
  },
  {
    id: 'node-2',
    type: 'box',
    position: { x: 0, y: 10, z: 0 },
    color: '#00ff00',
    label: 'Node 2'
  },
  {
    id: 'node-3',
    type: 'sphere',
    position: { x: 10, y: 0, z: 0 },
    color: '#0000ff',
    label: 'Node 3'
  },
  {
    id: 'node-4',
    type: 'custom',
    position: { x: 0, y: -10, z: 0 },
    color: '#ffff00',
    label: 'Node 4'
  }
];

// Create edges with different types
const edges: EdgeSpec[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    color: '#ff0000',
    width: 3,
    type: 'straight',
    label: 'Edge 1-2'
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    color: '#00ff00',
    width: 2,
    type: 'curved',
    curvature: 0.5,
    label: 'Edge 2-3'
  },
  {
    id: 'edge-3',
    source: 'node-3',
    target: 'node-4',
    color: '#0000ff',
    width: 4,
    type: 'dashed',
    dashSize: 0.5,
    gapSize: 0.3,
    label: 'Edge 3-4'
  },
  {
    id: 'edge-4',
    source: 'node-4',
    target: 'node-1',
    color: '#ffff00',
    width: 1,
    type: 'straight',
    label: 'Edge 4-1'
  }
];

const spec: Spec = {
  data: {
    nodes,
    edges,
  },
  style: {
    'node:hover': {
      color: '#ffffff',
      glow: {
        color: '#ffffff',
        strength: 0.8
      }
    },
    'node:selected': {
      color: '#ffffff',
      glow: {
        color: '#ffffff',
        strength: 1.0
      }
    },
    'edge:hover': {
      color: '#ffffff',
      width: 5,
      opacity: 1.0
    },
    'edge:selected': {
      color: '#ffffff',
      width: 6,
      opacity: 1.0,
      glow: {
        color: '#ffffff',
        strength: 0.5
      }
    }
  },
  layout: {
    type: 'force-directed',
    charge: -30,
    linkDistance: 20,
  },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: Math.PI / 4,
    theta: Math.PI / 4,
    distance: 50,
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 0.1,
      zoomSpeed: 0.1,
      orbitSpeed: 0.1,
    },
  },
  performance: {
    instancingThreshold: 100,
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

// Add event listeners to demonstrate edge interaction
graph.on('edge:click', ({ target, event, sourceNode, targetNode }) => {
  console.log('Edge clicked:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
  console.log('Event:', event);
});

graph.on('edge:hover:enter', ({ target, sourceNode, targetNode }) => {
  console.log('Edge hover enter:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
});

graph.on('edge:hover:leave', ({ target, sourceNode, targetNode }) => {
  console.log('Edge hover leave:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
});

graph.on('edge:select', ({ target, sourceNode, targetNode }) => {
  console.log('Edge selected:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
});

// Expose graph to window for easy debugging and testing
(window as any).graph = graph;