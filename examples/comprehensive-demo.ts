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

// Create nodes with all element actor types
const nodes: NodeSpec[] = [
  // Sphere nodes
  {
    id: 'node-1',
    type: 'sphere',
    position: { x: -10, y: 0, z: 0 },
    color: '#ff0000',
    label: 'Red Sphere'
  },
  {
    id: 'node-2',
    type: 'sphere',
    position: { x: 0, y: 10, z: 0 },
    color: '#00ff00',
    label: 'Green Sphere'
  },
  {
    id: 'node-3',
    type: 'sphere',
    position: { x: 10, y: 0, z: 0 },
    color: '#0000ff',
    label: 'Blue Sphere'
  },
  
  // Box nodes
  {
    id: 'node-4',
    type: 'box',
    position: { x: 0, y: -10, z: 0 },
    color: '#ffff00',
    label: 'Yellow Box'
  },
  {
    id: 'node-5',
    type: 'box',
    position: { x: 0, y: 0, z: 10 },
    color: '#ff00ff',
    label: 'Magenta Box'
  },
  
  // Text nodes
  {
    id: 'node-6',
    type: 'text',
    position: { x: -5, y: 5, z: 5 },
    color: '#00ffff',
    label: 'Cyan Text'
  },
  {
    id: 'node-7',
    type: 'text',
    position: { x: 5, y: -5, z: -5 },
    color: '#ffffff',
    label: 'White Text'
  },
  
  // Custom geometry nodes
  {
    id: 'node-8',
    type: 'custom',
    position: { x: -5, y: -5, z: 5 },
    color: '#ffa500',
    label: 'Orange Custom'
  },
  {
    id: 'node-9',
    type: 'custom',
    position: { x: 5, y: 5, z: -5 },
    color: '#800080',
    label: 'Purple Custom'
  }
];

// Create edges with all types
const edges: EdgeSpec[] = [
  // Straight edges
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    color: '#ff0000',
    width: 3,
    type: 'straight',
    label: 'Straight Red'
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    color: '#00ff00',
    width: 2,
    type: 'straight',
    label: 'Straight Green'
  },
  
  // Curved edges
  {
    id: 'edge-3',
    source: 'node-3',
    target: 'node-4',
    color: '#0000ff',
    width: 4,
    type: 'curved',
    curvature: 0.5,
    label: 'Curved Blue'
  },
  {
    id: 'edge-4',
    source: 'node-4',
    target: 'node-1',
    color: '#ffff00',
    width: 1,
    type: 'curved',
    curvature: -0.3,
    label: 'Curved Yellow'
  },
  
  // Dashed edges
  {
    id: 'edge-5',
    source: 'node-1',
    target: 'node-5',
    color: '#ff00ff',
    width: 3,
    type: 'dashed',
    dashSize: 0.5,
    gapSize: 0.3,
    label: 'Dashed Magenta'
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
    label: 'Dashed Cyan'
  },
  
  // Additional connections
  {
    id: 'edge-7',
    source: 'node-3',
    target: 'node-5',
    color: '#ffa500',
    width: 2,
    type: 'straight',
    label: 'Orange Connection'
  },
  {
    id: 'edge-8',
    source: 'node-6',
    target: 'node-7',
    color: '#800080',
    width: 3,
    type: 'curved',
    curvature: 0.7,
    label: 'Purple Curve'
  },
  {
    id: 'edge-9',
    source: 'node-8',
    target: 'node-9',
    color: '#00ff00',
    width: 2,
    type: 'dashed',
    dashSize: 0.4,
    gapSize: 0.4,
    label: 'Green Dashed'
  }
];

const spec: Spec = {
  data: {
    nodes,
    edges,
  },
  style: {
    // Node styles
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
    
    // Edge styles
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
  hud: {
    visible: true,
    console: {
      enabled: true
    }
  }
};

const plugins = [
  new LayoutPlugin(),
  new CameraPlugin(),
  new InteractionPlugin(),
  new HUDPlugin(),
];

export default function init() {
  const graph = new SpaceGraph('#graph', spec, plugins);

  // Add UI controls
  const controls = document.getElementById('controls')!;
  
  // Add event listeners for edge interaction
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

  // Add event listeners for node interaction
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

  // Add buttons for different layout engines
  const layouts = [
    { id: 'force', label: 'Force Directed', type: 'force-directed' },
    { id: 'grid', label: 'Grid', type: 'grid' },
    { id: 'circle', label: 'Circle', type: 'circle' },
    { id: 'column', label: 'Column', type: 'column' },
    { id: 'row', label: 'Row', type: 'row' },
    { id: 'random', label: 'Random', type: 'random' }
  ];

  const layoutGroup = document.createElement('div');
  layoutGroup.innerHTML = '<h4>Layout Engines</h4>';
  
  layouts.forEach(layout => {
    const button = document.createElement('button');
    button.id = layout.id;
    button.textContent = layout.label;
    button.addEventListener('click', () => {
      // Update active button
      document.querySelectorAll('#layout-buttons button').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      graph.update({
        layout: {
          type: layout.type as any
        }
      });
    });
    layoutGroup.appendChild(button);
  });
  
  const layoutButtonsDiv = document.createElement('div');
  layoutButtonsDiv.id = 'layout-buttons';
  layoutButtonsDiv.appendChild(layoutGroup);
  controls.appendChild(layoutButtonsDiv);

  // Add buttons for different edge types
  const edgeTypes = [
    { id: 'all-edges', label: 'All Edges', filter: null },
    { id: 'straight-edges', label: 'Straight', filter: 'straight' },
    { id: 'curved-edges', label: 'Curved', filter: 'curved' },
    { id: 'dashed-edges', label: 'Dashed', filter: 'dashed' }
  ];

  const edgeGroup = document.createElement('div');
  edgeGroup.innerHTML = '<h4>Edge Types</h4>';
  
  edgeTypes.forEach(type => {
    const button = document.createElement('button');
    button.id = type.id;
    button.textContent = type.label;
    button.addEventListener('click', () => {
      // Update active button
      document.querySelectorAll('#edge-buttons button').forEach(btn => {
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
    edgeGroup.appendChild(button);
  });
  
  const edgeButtonsDiv = document.createElement('div');
  edgeButtonsDiv.id = 'edge-buttons';
  edgeButtonsDiv.appendChild(edgeGroup);
  controls.appendChild(edgeButtonsDiv);

  // Add buttons for different node types
  const nodeTypes = [
    { id: 'all-nodes', label: 'All Nodes', filter: null },
    { id: 'sphere-nodes', label: 'Spheres', filter: 'sphere' },
    { id: 'box-nodes', label: 'Boxes', filter: 'box' },
    { id: 'text-nodes', label: 'Text', filter: 'text' },
    { id: 'custom-nodes', label: 'Custom', filter: 'custom' }
  ];

  const nodeGroup = document.createElement('div');
  nodeGroup.innerHTML = '<h4>Node Types</h4>';
  
  nodeTypes.forEach(type => {
    const button = document.createElement('button');
    button.id = type.id;
    button.textContent = type.label;
    button.addEventListener('click', () => {
      // Update active button
      document.querySelectorAll('#node-buttons button').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

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
    nodeGroup.appendChild(button);
  });
  
  const nodeButtonsDiv = document.createElement('div');
  nodeButtonsDiv.id = 'node-buttons';
  nodeButtonsDiv.appendChild(nodeGroup);
  controls.appendChild(nodeButtonsDiv);

  // Add camera view buttons
  const cameraViews = [
    { id: 'top-view', label: 'Top', view: 'top' },
    { id: 'front-view', label: 'Front', view: 'front' },
    { id: 'side-view', label: 'Side', view: 'right' },
    { id: 'isometric-view', label: 'Isometric', view: 'isometric' },
    { id: 'auto-view', label: 'Auto Zoom', view: 'auto' }
  ];

  const cameraGroup = document.createElement('div');
  cameraGroup.innerHTML = '<h4>Camera Views</h4>';
  
  cameraViews.forEach(view => {
    const button = document.createElement('button');
    button.id = view.id;
    button.textContent = view.label;
    button.addEventListener('click', () => {
      if (view.view === 'auto') {
        if (graph.cameraPlugin) {
          graph.cameraPlugin.autoZoom({ duration: 1000 });
        }
      } else {
        if (graph.cameraPlugin) {
          graph.cameraPlugin.setView(view.view as any, { duration: 1000 });
        }
      }
    });
    cameraGroup.appendChild(button);
  });
  
  controls.appendChild(cameraGroup);

  // Add reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Graph';
  resetButton.addEventListener('click', () => {
    graph.update({
      data: {
        nodes: {
          update: nodes.map(node => ({
            id: node.id,
            type: node.type,
            color: node.color,
            label: node.label
          }))
        },
        edges: {
          update: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            color: edge.color,
            width: edge.width,
            label: edge.label
          }))
        }
      },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: Math.PI / 4,
        theta: Math.PI / 4,
        distance: 50,
      },
      layout: {
        type: 'force-directed',
        charge: -30,
        linkDistance: 20,
      }
    });
  });
  controls.appendChild(resetButton);

  // Expose graph to window for easy debugging and testing
  (window as any).graph = graph;
  
  // Add some sample REPL commands to demonstrate HUD functionality
  console.log('SpaceGraphJS Comprehensive Demo Loaded');
  console.log('Try these REPL commands in the HUD console:');
  console.log('- help: Show available commands');
  console.log('- nodes: List all nodes');
  console.log('- edges: List all edges');
  console.log('- select node-1: Select the first node');
  console.log('- flyTo {"target":{"x":0,"y":0,"z":0},"distance":30}: Fly to center');
}

// If running directly, initialize
if (typeof window !== 'undefined' && document.getElementById('graph')) {
  init();
}