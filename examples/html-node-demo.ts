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

// Function to generate random HTML content for nodes
function generateHtmlContent(id: string, title: string): string {
  const status = Math.random() > 0.5 ? 'online' : 'offline';
  const cpu = Math.floor(Math.random() * 100);
  const memory = Math.floor(Math.random() * 100);
  const network = Math.floor(Math.random() * 100);
  
  return `
    <div class="spacegraph-html-node">
      <h4>${title} (${id})</h4>
      <p><span class="status-indicator status-${status}"></span> Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
      <p>CPU Usage: <span class="metric-value">${cpu}%</span></p>
      <progress value="${cpu}" max="100"></progress>
      <p>Memory: <span class="metric-value">${memory}%</span></p>
      <progress value="${memory}" max="100"></progress>
      <p>Network: <span class="metric-value">${network}%</span></p>
      <progress value="${network}" max="100"></progress>
      <input type="text" placeholder="Enter command..." />
      <select>
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
      </select>
      <button onclick="console.log('Button clicked in node ${id}')">Execute</button>
    </div>
  `;
}

// Create nodes with different types including HTML nodes
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
    id: 'html-node-1',
    type: 'html',
    position: { x: -5, y: 5, z: 5 },
    content: generateHtmlContent('html-node-1', 'Server Node'),
    className: 'spacegraph-html-node'
  } as HtmlNodeSpec,
  {
    id: 'html-node-2',
    type: 'html',
    position: { x: 5, y: -5, z: -5 },
    content: generateHtmlContent('html-node-2', 'Database Node'),
    className: 'spacegraph-html-node'
  } as HtmlNodeSpec,
  {
    id: 'html-node-3',
    type: 'html',
    position: { x: 5, y: 5, z: 5 },
    content: generateHtmlContent('html-node-3', 'API Gateway'),
    className: 'spacegraph-html-node'
  } as HtmlNodeSpec
];

// Create edges connecting nodes
const edges: EdgeSpec[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    color: '#ff0000',
    width: 3,
    type: 'straight',
    label: 'Connection'
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    color: '#00ff00',
    width: 2,
    type: 'curved',
    curvature: 0.5,
    label: 'Data Flow'
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
    label: 'Backup Link'
  },
  {
    id: 'edge-4',
    source: 'html-node-1',
    target: 'node-1',
    color: '#ff00ff',
    width: 2,
    type: 'straight',
    label: 'Control'
  },
  {
    id: 'edge-5',
    source: 'html-node-2',
    target: 'node-3',
    color: '#00ffff',
    width: 2,
    type: 'curved',
    curvature: -0.3,
    label: 'Database'
  },
  {
    id: 'edge-6',
    source: 'html-node-3',
    target: 'html-node-1',
    color: '#ffff00',
    width: 3,
    type: 'straight',
    label: 'API Calls'
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
  
  // Use container to avoid linting error
  console.log('Graph initialized in container:', container.id);

  // Add event listeners for HTML node interaction
  graph.on('element:click', ({ target, event }) => {
    console.log('Element clicked:', target.id);
    console.log('Event:', event);
    
    // If it's an HTML node, we might want to handle specific interactions
    if (target.type === 'html') {
      console.log('HTML node clicked:', target.id);
    }
  });

  graph.on('element:hover:enter', ({ target }) => {
    console.log('Element hover enter:', target.id);
  });

  graph.on('element:hover:leave', ({ target }) => {
    console.log('Element hover leave:', target.id);
  });

  // Add button to add new HTML nodes
  const addNodeButton = document.getElementById('addNode');
  if (addNodeButton) {
    addNodeButton.addEventListener('click', () => {
      const newNodeId = `html-node-${Date.now()}`;
      const newNode: HtmlNodeSpec = {
        id: newNodeId,
        type: 'html',
        position: { 
          x: (Math.random() - 0.5) * 20, 
          y: (Math.random() - 0.5) * 20, 
          z: (Math.random() - 0.5) * 20 
        },
        content: generateHtmlContent(newNodeId, 'New Node'),
        className: 'spacegraph-html-node'
      };
      
      graph.update({
        data: {
          nodes: {
            add: [newNode]
          }
        }
      });
    });
  }

  // Add reset view button
  const resetViewButton = document.getElementById('resetView');
  if (resetViewButton) {
    resetViewButton.addEventListener('click', () => {
      graph.update({
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 4,
          theta: Math.PI / 4,
          distance: 50,
        }
      });
    });
  }

  // Expose graph to window for easy debugging and testing
  (window as any).graph = graph;
  
  // Update node data periodically to simulate real-time data
  setInterval(() => {
    const updates = nodes
      .filter(node => node.type === 'html')
      .map(node => {
        return {
          id: node.id,
          content: generateHtmlContent(node.id, `${node.id.split('-')[0]} Node`)
        };
      });
      
    if (updates.length > 0) {
      graph.update({
        data: {
          nodes: {
            update: updates
          }
        }
      });
    }
  }, 3000);
}

// If running directly, initialize
if (typeof window !== 'undefined' && document.getElementById('graph')) {
  init();
}