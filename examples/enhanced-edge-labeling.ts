import { SpaceGraph } from '../src';

// Create a graph with enhanced edge labeling
const graph = new SpaceGraph('#container', {
  data: {
    nodes: [
      {
        id: 'node1',
        type: 'sphere',
        position: { x: -2, y: 0, z: 0 },
        color: '#ff0000',
      },
      {
        id: 'node2',
        type: 'box',
        position: { x: 0, y: 2, z: 0 },
        color: '#00ff00',
      },
      {
        id: 'node3',
        type: 'sphere',
        position: { x: 2, y: 0, z: 0 },
        color: '#0000ff',
      },
      {
        id: 'node4',
        type: 'box',
        position: { x: 0, y: -2, z: 0 },
        color: '#ffff00',
      },
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        label: 'Top Connection',
        color: '#ff0000',
        width: 3,
        type: 'curved',
        curvature: 0.3,
      },
      {
        id: 'edge2',
        source: 'node2',
        target: 'node3',
        label: 'Right Connection',
        color: '#00ff00',
        width: 2,
        type: 'straight',
      },
      {
        id: 'edge3',
        source: 'node3',
        target: 'node4',
        label: 'Bottom Connection',
        color: '#0000ff',
        width: 4,
        type: 'curved',
        curvature: -0.3,
      },
      {
        id: 'edge4',
        source: 'node4',
        target: 'node1',
        label: 'Left Connection',
        color: '#ffff00',
        width: 1,
        type: 'dashed',
        dashSize: 0.2,
        gapSize: 0.1,
      },
    ],
  },
  layout: {
    type: 'force-directed',
  },
  style: {
    'edge:hover': {
      width: 5,
      color: '#ffffff',
      label: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
    'edge:selected': {
      width: 6,
      color: '#ff00ff',
      label: {
        color: '#ff00ff',
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'rgba(255, 0, 255, 0.3)',
      },
    },
  },
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

// Add interactivity for edges
graph.on('edge:click', ({ target }) => {
  console.log('Clicked edge:', target);

  // Toggle selection
  const isSelected = graph.state.interaction.selectedElementIds.includes(
    target.id
  );
  if (isSelected) {
    graph.update({
      interaction: {
        selectedElementIds: graph.state.interaction.selectedElementIds.filter(
          (id) => id !== target.id
        ),
      },
    });
  } else {
    graph.update({
      interaction: {
        selectedElementIds: [
          ...graph.state.interaction.selectedElementIds,
          target.id,
        ],
      },
    });
  }
});

// Add a button to add a new edge with labeling
const addButton = document.createElement('button');
addButton.textContent = 'Add Labeled Edge';
addButton.onclick = () => {
  const edgeId = `edge${Date.now()}`;
  graph.update({
    data: {
      edges: {
        add: [
          {
            id: edgeId,
            source: 'node1',
            target: 'node3',
            label: `New Edge ${edgeId}`,
            color: '#ff00ff',
            width: 2,
            type: 'curved',
            curvature: Math.random() * 0.5,
          },
        ],
      },
    },
  });
};
document.body.appendChild(addButton);

// Add a button to update edge labels
const updateButton = document.createElement('button');
updateButton.textContent = 'Update Edge Labels';
updateButton.onclick = () => {
  graph.update({
    data: {
      edges: {
        update: [
          {
            id: 'edge1',
            label: `Updated: ${new Date().toLocaleTimeString()}`,
          },
        ],
      },
    },
  });
};
document.body.appendChild(updateButton);

export default graph;
