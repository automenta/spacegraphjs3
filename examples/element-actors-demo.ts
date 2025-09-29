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

// Create nodes of different types for the demo
const nodes: NodeSpec[] = [
  // Sphere nodes
  {
    id: 'sphere1',
    type: 'sphere',
    position: { x: -10, y: 5, z: 0 },
    color: '#ff0000',
    label: 'Red Sphere',
  },
  {
    id: 'sphere2',
    type: 'sphere',
    position: { x: -10, y: 0, z: 0 },
    color: '#00ff00',
    label: 'Green Sphere',
  },
  {
    id: 'sphere3',
    type: 'sphere',
    position: { x: -10, y: -5, z: 0 },
    color: '#0000ff',
    label: 'Blue Sphere',
  },
  
  // Box nodes
  {
    id: 'box1',
    type: 'box',
    position: { x: -5, y: 5, z: 0 },
    color: '#ffff00',
    label: 'Yellow Box',
  },
  {
    id: 'box2',
    type: 'box',
    position: { x: -5, y: 0, z: 0 },
    color: '#ff00ff',
    label: 'Magenta Box',
  },
  {
    id: 'box3',
    type: 'box',
    position: { x: -5, y: -5, z: 0 },
    color: '#00ffff',
    label: 'Cyan Box',
  },
  
  // Text nodes
  {
    id: 'text1',
    type: 'text',
    position: { x: 0, y: 5, z: 0 },
    color: '#ffffff',
    label: 'Hello',
  },
  {
    id: 'text2',
    type: 'text',
    position: { x: 0, y: 0, z: 0 },
    color: '#ff9900',
    label: 'World',
  },
  {
    id: 'text3',
    type: 'text',
    position: { x: 0, y: -5, z: 0 },
    color: '#00ff99',
    label: 'Text!',
  },
  
  // Custom geometry nodes
  {
    id: 'custom1',
    type: 'custom',
    position: { x: 5, y: 5, z: 0 },
    color: '#ff6600',
    label: 'Cone',
    data: {
      geometry: new THREE.ConeGeometry(0.5, 1, 8),
    },
  },
  {
    id: 'custom2',
    type: 'custom',
    position: { x: 5, y: 0, z: 0 },
    color: '#6600ff',
    label: 'Torus',
    data: {
      geometry: new THREE.TorusGeometry(0.5, 0.2, 16, 32),
    },
  },
  {
    id: 'custom3',
    type: 'custom',
    position: { x: 5, y: -5, z: 0 },
    color: '#00ff66',
    label: 'Pyramid',
    data: {
      geometry: new THREE.ConeGeometry(0.5, 1, 4),
    },
  },
];

// Create edges between nodes
const edges: EdgeSpec[] = [
  // Edges between spheres
  {
    id: 'e1',
    source: 'sphere1',
    target: 'sphere2',
    type: 'straight',
    color: '#ff0000',
  },
  {
    id: 'e2',
    source: 'sphere2',
    target: 'sphere3',
    type: 'curved',
    curvature: 0.5,
    color: '#00ff00',
  },
  
  // Edges between boxes
  {
    id: 'e3',
    source: 'box1',
    target: 'box2',
    type: 'dashed',
    dashSize: 0.2,
    gapSize: 0.1,
    color: '#ffff00',
  },
  {
    id: 'e4',
    source: 'box2',
    target: 'box3',
    type: 'straight',
    color: '#ff00ff',
  },
  
  // Edges between text nodes
  {
    id: 'e5',
    source: 'text1',
    target: 'text2',
    type: 'curved',
    curvature: -0.3,
    color: '#ffffff',
  },
  {
    id: 'e6',
    source: 'text2',
    target: 'text3',
    type: 'dashed',
    dashSize: 0.1,
    gapSize: 0.2,
    color: '#ff9900',
  },
  
  // Edges between custom nodes
  {
    id: 'e7',
    source: 'custom1',
    target: 'custom2',
    type: 'straight',
    color: '#ff6600',
  },
  {
    id: 'e8',
    source: 'custom2',
    target: 'custom3',
    type: 'curved',
    curvature: 0.4,
    color: '#6600ff',
  },
  
  // Cross-type edges
  {
    id: 'e9',
    source: 'sphere1',
    target: 'box1',
    type: 'straight',
    color: '#ff00ff',
  },
  {
    id: 'e10',
    source: 'box1',
    target: 'text1',
    type: 'curved',
    curvature: 0.3,
    color: '#ffff00',
  },
  {
    id: 'e11',
    source: 'text1',
    target: 'custom1',
    type: 'dashed',
    dashSize: 0.15,
    gapSize: 0.15,
    color: '#00ffff',
  },
];

const spec: Spec = {
  data: {
    nodes,
    edges,
  },
  style: {
    'node:hover': {
      color: '#ff0000',
      glow: { color: '#ff0000', strength: 0.7 },
    },
    'node:selected': {
      color: '#00ff00',
      glow: { color: '#00ff00', strength: 0.7 },
    },
    'edge:hover': {
      color: '#ff9900',
      width: 3,
    },
    'edge:selected': {
      color: '#0099ff',
      width: 4,
    },
  },
  layout: {
    type: 'force-directed',
    charge: -30,
    linkDistance: 3,
  },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: Math.PI / 3,
    theta: Math.PI / 4,
    distance: 30,
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 0.5,
      zoomSpeed: 0.5,
      orbitSpeed: 0.01,
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

// Expose graph to window for easy debugging
(window as any).graph = graph;

// Add UI controls to switch between element types
const createElementTypeControls = () => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.zIndex = '1000';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.color = 'white';
  container.style.fontFamily = 'Arial, sans-serif';

  const title = document.createElement('h3');
  title.textContent = 'Element Actors Demo';
  title.style.marginTop = '0';
  container.appendChild(title);

  const description = document.createElement('p');
  description.textContent = 'Different node types with unique geometries:';
  description.style.fontSize = '14px';
  container.appendChild(description);

  const types = [
    { name: 'All Types', filter: null },
    { name: 'Spheres Only', filter: 'sphere' },
    { name: 'Boxes Only', filter: 'box' },
    { name: 'Text Only', filter: 'text' },
    { name: 'Custom Only', filter: 'custom' },
  ];

  types.forEach(type => {
    const button = document.createElement('button');
    button.textContent = type.name;
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.margin = '5px 0';
    button.style.padding = '8px';
    button.style.backgroundColor = '#333';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', () => {
      if (type.filter === null) {
        // Show all nodes
        const updates = nodes.map(node => ({
          id: node.id,
          type: node.type,
          color: node.color,
        }));
        
        graph.update({
          data: {
            nodes: {
              update: updates,
            },
          },
        });
      } else {
        // Show only nodes of specific type
        const updates = nodes.map(node => ({
          id: node.id,
          type: node.type === type.filter ? node.type : 'sphere',
          color: node.type === type.filter ? node.color : '#888888',
        }));
        
        graph.update({
          data: {
            nodes: {
              update: updates,
            },
          },
        });
      }
    });
    
    container.appendChild(button);
  });

  document.body.appendChild(container);
};

// Add keyboard shortcuts info
const createHelpInfo = () => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.bottom = '10px';
  container.style.left = '10px';
  container.style.zIndex = '1000';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.color = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '12px';
  container.style.maxWidth = '300px';

  container.innerHTML = `
    <h3>Element Actors Demo</h3>
    <p>This demo shows all supported element types:</p>
    <ul style="margin: 5px 0; padding-left: 20px;">
      <li><strong>Sphere</strong>: Basic 3D spheres</li>
      <li><strong>Box</strong>: 3D cubes/boxes</li>
      <li><strong>Text</strong>: 3D text elements</li>
      <li><strong>Custom</strong>: Custom geometries (cone, torus, pyramid)</li>
    </ul>
    <p><strong>Controls:</strong></p>
    <ul style="margin: 5px 0; padding-left: 20px;">
      <li>Click nodes to select</li>
      <li>Hover over nodes and edges</li>
      <li>Drag to rotate view</li>
      <li>Scroll to zoom</li>
    </ul>
  `;

  document.body.appendChild(container);
};

// Initialize UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
  createElementTypeControls();
  createHelpInfo();
});

// Add default export
export default () => {
  // Initialization is handled by DOMContentLoaded event
  console.log('Element Actors Demo initialized');
};