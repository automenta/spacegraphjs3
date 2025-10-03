import { SpaceGraph } from '../src';

// Create a graph with enhanced text element actors
const graph = new SpaceGraph('#container', {
  data: {
    nodes: [
      {
        id: 'node1',
        type: 'text',
        position: { x: 0, y: 0, z: 0 },
        label: 'Enhanced Text Node',
        data: {
          fontSize: 24,
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 255, 0.7)',
          padding: 10,
          borderRadius: 5,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        },
      },
      {
        id: 'node2',
        type: 'text',
        position: { x: 5, y: 0, z: 0 },
        label: 'Another Text Node',
        data: {
          fontSize: 20,
          color: '#ffff00',
          backgroundColor: 'rgba(255, 0, 0, 0.7)',
          padding: 8,
          borderRadius: 3,
          fontStyle: 'italic',
        },
      },
      {
        id: 'node3',
        type: 'text',
        position: { x: 0, y: 5, z: 0 },
        label: 'Large Text Node',
        data: {
          fontSize: 32,
          color: '#00ff00',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 15,
          borderRadius: 10,
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        label: 'Connection',
      },
      {
        id: 'edge2',
        source: 'node1',
        target: 'node3',
        label: 'Another Connection',
      },
    ],
  },
  layout: {
    type: 'force-directed',
  },
  style: {},
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: Math.PI / 2,
    theta: 0,
    distance: 5,
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 1,
      zoomSpeed: 1,
      orbitSpeed: 1,
    },
  },
  performance: {
    instancingThreshold: 1000,
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: [],
  },
});

// Add some interactivity
graph.on('element:click', ({ target }) => {
  console.log('Clicked element:', target);
});

// Add a button to change the text of a node
const button = document.createElement('button');
button.textContent = 'Change Text';
button.onclick = () => {
  graph.update({
    data: {
      nodes: {
        update: [
          {
            id: 'node1',
            label: `Updated at ${new Date().toLocaleTimeString()}`,
          },
        ],
      },
    },
  });
};
document.body.appendChild(button);

// Add a button to add a new text node
const addButton = document.createElement('button');
addButton.textContent = 'Add Text Node';
addButton.onclick = () => {
  const newNodeId = `node${Date.now()}`;
  graph.update({
    data: {
      nodes: {
        add: [
          {
            id: newNodeId,
            type: 'text',
            position: {
              x: Math.random() * 10 - 5,
              y: Math.random() * 10 - 5,
              z: Math.random() * 10 - 5,
            },
            label: `New Node ${newNodeId}`,
            data: {
              fontSize: 18,
              color: '#ff00ff',
              backgroundColor: 'rgba(0, 255, 255, 0.5)',
              padding: 10,
              borderRadius: 5,
            },
          },
        ],
      },
    },
  });
};
document.body.appendChild(addButton);

export default graph;
