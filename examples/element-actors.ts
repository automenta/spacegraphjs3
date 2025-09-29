import { SpaceGraph } from '../src/index';

// Create a simple graph with different element actor types
const graph = new SpaceGraph('#app', {
  data: {
    nodes: [
      { id: '1', type: 'sphere', position: { x: -2, y: 0, z: 0 }, color: '#ff0000' },
      { id: '2', type: 'box', position: { x: 0, y: 0, z: 0 }, color: '#00ff00' },
      { id: '3', type: 'custom', position: { x: 2, y: 0, z: 0 }, color: '#0000ff' },
      { id: '4', type: 'text', position: { x: 4, y: 0, z: 0 }, color: '#ffff00' }
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' }
    ]
  },
  style: {},
  layout: { type: 'force-directed' },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: Math.PI / 2,
    theta: 0,
    distance: 5
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 1,
      zoomSpeed: 1,
      orbitSpeed: 1
    }
  },
  performance: {
    instancingThreshold: 1000
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: []
  }
});

// Add some interactivity
graph.on('element:click', ({ target }) => {
  console.log('Clicked element:', target);
});

// Add a button to add more nodes
const addButton = document.createElement('button');
addButton.textContent = 'Add Node';
addButton.onclick = () => {
  const nodeId = Date.now().toString();
  graph.update({
    data: {
      nodes: {
        add: [{ id: nodeId, type: 'box', position: { x: Math.random() * 4 - 2, y: Math.random() * 4 - 2, z: 0 }, color: '#ff00ff' }]
      }
    }
  });
};
document.body.appendChild(addButton);

// Clean up when the page is unloaded
window.addEventListener('beforeunload', () => {
  graph.destroy();
});