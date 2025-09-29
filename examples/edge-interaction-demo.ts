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

// Create nodes with different types
const nodes: NodeSpec[] = [
  {
    id: 'node-1',
    type: 'sphere',
    position: { x: -10, y: 0, z: 0 },
    color: '#ff0000',
    label: 'Sphere Node'
  },
  {
    id: 'node-2',
    type: 'box',
    position: { x: 0, y: 10, z: 0 },
    color: '#00ff00',
    label: 'Box Node'
  },
  {
    id: 'node-3',
    type: 'sphere',
    position: { x: 10, y: 0, z: 0 },
    color: '#0000ff',
    label: 'Sphere Node'
  },
  {
    id: 'node-4',
    type: 'text',
    position: { x: 0, y: -10, z: 0 },
    color: '#ffff00',
    label: 'Text Node'
  },
  {
    id: 'node-5',
    type: 'custom',
    position: { x: 0, y: 0, z: 10 },
    color: '#ff00ff',
    label: 'Custom Node'
  }
];

// Create edges with different types and styles
const edges: EdgeSpec[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    color: '#ff0000',
    width: 3,
    type: 'straight',
    label: 'Straight Edge'
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    color: '#00ff00',
    width: 2,
    type: 'curved',
    curvature: 0.5,
    label: 'Curved Edge'
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
    label: 'Dashed Edge'
  },
  {
    id: 'edge-4',
    source: 'node-4',
    target: 'node-1',
    color: '#ffff00',
    width: 1,
    type: 'straight',
    label: 'Thin Edge'
  },
  {
    id: 'edge-5',
    source: 'node-1',
    target: 'node-5',
    color: '#ff00ff',
    width: 5,
    type: 'curved',
    curvature: -0.3,
    label: 'Reverse Curved'
  },
  {
    id: 'edge-6',
    source: 'node-2',
    target: 'node-5',
    color: '#00ffff',
    width: 2,
    type: 'dashed',
    dashSize: 0.3,
    gapSize: 0.7,
    label: 'Sparse Dashed'
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
  const container = document.getElementById('graph')!;
  const graph = new SpaceGraph('#graph', spec, plugins);

  // Add UI controls
  const controls = document.getElementById('controls')!;
  
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

  // Add node interaction events
  graph.on('element:click', ({ target, event }) => {
    console.log('Node clicked:', target.id);
    console.log('Event:', event);
  });

  graph.on('element:hover:enter', ({ target }) => {
    console.log('Node hover enter:', target.id);
  });

  graph.on('element:hover:leave', ({ target }) => {
    console.log('Node hover leave:', target.id);
  });

  // Add buttons for different edge types
  const edgeTypes = [
    { id: 'all', label: 'All Edges', filter: null },
    { id: 'straight', label: 'Straight', filter: 'straight' },
    { id: 'curved', label: 'Curved', filter: 'curved' },
    { id: 'dashed', label: 'Dashed', filter: 'dashed' }
  ];

  edgeTypes.forEach(type => {
    const button = document.createElement('button');
    button.id = type.id;
    button.textContent = type.label;
    button.addEventListener('click', () => {
      // Update active button
      document.querySelectorAll('#controls button').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      if (type.filter === null) {
        // Show all edges
        graph.update({
          data: {
            edges: {
              update: edges.map(edge => ({
                id: edge.id,
                type: edge.type,
                color: edge.color,
                width: edge.width,
              }))
            }
          }
        });
      } else {
        // Show only edges of specific type
        const updates = edges.map(edge => ({
          id: edge.id,
          type: edge.type === type.filter ? edge.type : 'straight',
          color: edge.type === type.filter ? edge.color : '#888888',
          width: edge.type === type.filter ? edge.width : 1,
        }));

        graph.update({
          data: {
            edges: {
              update: updates
            }
          }
        });
      }
    });
    controls.appendChild(button);
  });

  // Add reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset View';
  resetButton.addEventListener('click', () => {
    graph.update({
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: Math.PI / 4,
        theta: Math.PI / 4,
        distance: 50,
      }
    });
  });
  controls.appendChild(resetButton);

  // Expose graph to window for easy debugging and testing
  (window as any).graph = graph;
}

// If running directly, initialize
if (typeof window !== 'undefined' && document.getElementById('graph')) {
  init();
}