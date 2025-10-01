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
    position: { x: -10, y: 5, z: 0 },
    color: '#ff0000',
    label: 'Red Sphere'
  },
  {
    id: 'sphere-2',
    type: 'sphere',
    position: { x: -10, y: 0, z: 0 },
    color: '#00ff00',
    label: 'Green Sphere'
  },
  {
    id: 'sphere-3',
    type: 'sphere',
    position: { x: -10, y: -5, z: 0 },
    color: '#0000ff',
    label: 'Blue Sphere'
  },
  
  // Box nodes
  {
    id: 'box-1',
    type: 'box',
    position: { x: -5, y: 5, z: 0 },
    color: '#ffff00',
    label: 'Yellow Box'
  },
  {
    id: 'box-2',
    type: 'box',
    position: { x: -5, y: 0, z: 0 },
    color: '#ff00ff',
    label: 'Magenta Box'
  },
  {
    id: 'box-3',
    type: 'box',
    position: { x: -5, y: -5, z: 0 },
    color: '#00ffff',
    label: 'Cyan Box'
  },
  
  // Text nodes
  {
    id: 'text-1',
    type: 'text',
    position: { x: 0, y: 5, z: 0 },
    color: '#ffffff',
    label: 'Hello'
  },
  {
    id: 'text-2',
    type: 'text',
    position: { x: 0, y: 0, z: 0 },
    color: '#ff9900',
    label: 'World'
  },
  {
    id: 'text-3',
    type: 'text',
    position: { x: 0, y: -5, z: 0 },
    color: '#00ff99',
    label: 'Text!'
  },
  
  // Custom geometry nodes
  {
    id: 'custom-1',
    type: 'custom',
    position: { x: 5, y: 5, z: 0 },
    color: '#ff6600',
    label: 'Cone',
    data: {
      geometry: new THREE.ConeGeometry(0.5, 1, 8),
    },
  },
  {
    id: 'custom-2',
    type: 'custom',
    position: { x: 5, y: 0, z: 0 },
    color: '#6600ff',
    label: 'Torus',
    data: {
      geometry: new THREE.TorusGeometry(0.5, 0.2, 16, 32),
    },
  },
  {
    id: 'custom-3',
    type: 'custom',
    position: { x: 5, y: -5, z: 0 },
    color: '#00ff66',
    label: 'Pyramid',
    data: {
      geometry: new THREE.ConeGeometry(0.5, 1, 4),
    },
  },
  
  // HTML nodes
  {
    id: 'html-1',
    type: 'html',
    position: { x: 10, y: 5, z: 0 },
    content: '<div style="padding: 10px; background: #333; color: white; border-radius: 5px;">HTML Node 1</div>',
    className: 'spacegraph-html-node'
  } as HtmlNodeSpec,
  {
    id: 'html-2',
    type: 'html',
    position: { x: 10, y: 0, z: 0 },
    content: '<div style="padding: 10px; background: #333; color: white; border-radius: 5px;">HTML Node 2</div>',
    className: 'spacegraph-html-node'
  } as HtmlNodeSpec
];

// Create edges with different types
const edges: EdgeSpec[] = [
  // Edges between spheres
  {
    id: 'e1',
    source: 'sphere-1',
    target: 'sphere-2',
    type: 'straight',
    color: '#ff0000',
    width: 3,
    label: 'Straight Edge'
  },
  {
    id: 'e2',
    source: 'sphere-2',
    target: 'sphere-3',
    type: 'curved',
    curvature: 0.5,
    color: '#00ff00',
    width: 2,
    label: 'Curved Edge'
  },
  
  // Edges between boxes
  {
    id: 'e3',
    source: 'box-1',
    target: 'box-2',
    type: 'dashed',
    dashSize: 0.2,
    gapSize: 0.1,
    color: '#ffff00',
    width: 2,
    label: 'Dashed Edge'
  },
  {
    id: 'e4',
    source: 'box-2',
    target: 'box-3',
    type: 'straight',
    color: '#ff00ff',
    width: 2,
    label: 'Straight Edge'
  },
  
  // Edges between text nodes
  {
    id: 'e5',
    source: 'text-1',
    target: 'text-2',
    type: 'curved',
    curvature: -0.3,
    color: '#ffffff',
    width: 1,
    label: 'Curved Edge'
  },
  {
    id: 'e6',
    source: 'text-2',
    target: 'text-3',
    type: 'dashed',
    dashSize: 0.1,
    gapSize: 0.2,
    color: '#ff9900',
    width: 1,
    label: 'Dashed Edge'
  },
  
  // Edges between custom nodes
  {
    id: 'e7',
    source: 'custom-1',
    target: 'custom-2',
    type: 'straight',
    color: '#ff6600',
    width: 2,
    label: 'Straight Edge'
  },
  {
    id: 'e8',
    source: 'custom-2',
    target: 'custom-3',
    type: 'curved',
    curvature: 0.4,
    color: '#6600ff',
    width: 2,
    label: 'Curved Edge'
  },
  
  // Cross-type edges
  {
    id: 'e9',
    source: 'sphere-1',
    target: 'box-1',
    type: 'straight',
    color: '#ff00ff',
    width: 1,
    label: 'Cross Type'
  },
  {
    id: 'e10',
    source: 'box-1',
    target: 'text-1',
    type: 'curved',
    curvature: 0.3,
    color: '#ffff00',
    width: 1,
    label: 'Cross Type'
  },
  {
    id: 'e11',
    source: 'text-1',
    target: 'custom-1',
    type: 'dashed',
    dashSize: 0.15,
    gapSize: 0.15,
    color: '#00ffff',
    width: 1,
    label: 'Cross Type'
  },
  
  // Edges to HTML nodes
  {
    id: 'e12',
    source: 'html-1',
    target: 'html-2',
    type: 'straight',
    color: '#ffffff',
    width: 2,
    label: 'HTML Connection'
  },
  {
    id: 'e13',
    source: 'html-1',
    target: 'sphere-1',
    type: 'curved',
    curvature: -0.4,
    color: '#ff0000',
    width: 1,
    label: 'HTML to Sphere'
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
    },
    'edge:source-selected': {
      color: '#ffaa00',
      width: 4,
      opacity: 0.9
    },
    'edge:target-selected': {
      color: '#00aaff',
      width: 4,
      opacity: 0.9
    },
    'edge:both-selected': {
      color: '#ff00ff',
      width: 5,
      opacity: 1.0
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

export default function init() {
  const graph = new SpaceGraph('#container', spec, plugins);
  
  // Expose graph to window for easy debugging and testing
  (window as any).graph = graph;
  
  console.log('Comprehensive demo initialized');
}

// If running directly, initialize
if (typeof window !== 'undefined' && document.getElementById('container')) {
  init();
}