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
  HtmlNodeSpec,
} from '../src';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Create nodes with all types including HTML nodes
const nodes: NodeSpec[] = [
  // Sphere nodes
  {
    id: 'sphere-1',
    type: 'sphere',
    position: { x: -5, y: 5, z: 0 },
    color: '#ff0000',
    label: 'Red Sphere'
  },
  {
    id: 'sphere-2',
    type: 'sphere',
    position: { x: 5, y: 5, z: 0 },
    color: '#00ff00',
    label: 'Green Sphere'
  },
  
  // Box nodes
  {
    id: 'box-1',
    type: 'box',
    position: { x: -5, y: -5, z: 0 },
    color: '#ffff00',
    label: 'Yellow Box'
  },
  {
    id: 'box-2',
    type: 'box',
    position: { x: 5, y: -5, z: 0 },
    color: '#ff00ff',
    label: 'Magenta Box'
  },
  
  // Text nodes
  {
    id: 'text-1',
    type: 'text',
    position: { x: 0, y: 0, z: 5 },
    color: '#00ffff',
    label: 'Cyan Text'
  },
  
  // Custom geometry nodes
  {
    id: 'custom-1',
    type: 'custom',
    position: { x: 0, y: 0, z: -5 },
    color: '#ffa500',
    label: 'Orange Custom'
  },
  
  // HTML nodes
  {
    id: 'html-1',
    type: 'html',
    position: { x: -5, y: 0, z: 5 },
    content: '<div style="padding: 10px; background: #333; color: white; border-radius: 5px;">HTML Node 1</div>',
    className: 'spacegraph-html-node'
  } as HtmlNodeSpec,
  {
    id: 'html-2',
    type: 'html',
    position: { x: 5, y: 0, z: 5 },
    content: '<div style="padding: 10px; background: #333; color: white; border-radius: 5px;">HTML Node 2</div>',
    className: 'spacegraph-html-node'
  } as HtmlNodeSpec
];

// Create edges connecting nodes
const edges: EdgeSpec[] = [
  {
    id: 'edge-1',
    source: 'sphere-1',
    target: 'sphere-2',
    color: '#ff0000',
    width: 3,
    type: 'straight',
    label: 'Sphere Connection'
  },
  {
    id: 'edge-2',
    source: 'box-1',
    target: 'box-2',
    color: '#ffff00',
    width: 2,
    type: 'curved',
    curvature: 0.5,
    label: 'Box Connection'
  },
  {
    id: 'edge-3',
    source: 'text-1',
    target: 'custom-1',
    color: '#00ffff',
    width: 4,
    type: 'dashed',
    dashSize: 0.5,
    gapSize: 0.3,
    label: 'Text to Custom'
  },
  {
    id: 'edge-4',
    source: 'html-1',
    target: 'sphere-1',
    color: '#ff00ff',
    width: 2,
    type: 'straight',
    label: 'HTML to Sphere'
  },
  {
    id: 'edge-5',
    source: 'html-2',
    target: 'box-2',
    color: '#00ffff',
    width: 2,
    type: 'curved',
    curvature: -0.3,
    label: 'HTML to Box'
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
    distance: 30,
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

export default function init() {
  const graph = new SpaceGraph('#container', spec, plugins);
  
  // Expose graph to window for easy debugging and testing
  (window as any).graph = graph;
  
  console.log('Comprehensive BasicRenderer test initialized');
}

// If running directly, initialize
if (typeof window !== 'undefined' && document.getElementById('container')) {
  init();
}