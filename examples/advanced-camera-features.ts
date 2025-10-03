import { SpaceGraph } from '../src';

// Create a graph to demonstrate advanced camera features
const graph = new SpaceGraph('#container', {
  data: {
    nodes: [
      {
        id: 'center',
        type: 'sphere',
        position: { x: 0, y: 0, z: 0 },
        color: '#ff0000',
      },
      {
        id: 'top',
        type: 'box',
        position: { x: 0, y: 5, z: 0 },
        color: '#00ff00',
      },
      {
        id: 'bottom',
        type: 'sphere',
        position: { x: 0, y: -5, z: 0 },
        color: '#0000ff',
      },
      {
        id: 'left',
        type: 'box',
        position: { x: -5, y: 0, z: 0 },
        color: '#ffff00',
      },
      {
        id: 'right',
        type: 'sphere',
        position: { x: 5, y: 0, z: 0 },
        color: '#ff00ff',
      },
      {
        id: 'front',
        type: 'box',
        position: { x: 0, y: 0, z: 5 },
        color: '#00ffff',
      },
      {
        id: 'back',
        type: 'sphere',
        position: { x: 0, y: 0, z: -5 },
        color: '#ffffff',
      },
    ],
    edges: [
      { id: 'e1', source: 'center', target: 'top' },
      { id: 'e2', source: 'center', target: 'bottom' },
      { id: 'e3', source: 'center', target: 'left' },
      { id: 'e4', source: 'center', target: 'right' },
      { id: 'e5', source: 'center', target: 'front' },
      { id: 'e6', source: 'center', target: 'back' },
    ],
  },
  layout: {
    type: 'force-directed',
  },
  style: {},
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: Math.PI / 3,
    theta: Math.PI / 4,
    distance: 10,
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

// Add buttons for different camera views
const topViewButton = document.createElement('button');
topViewButton.textContent = 'Top View';
topViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('top');
  }
};
document.body.appendChild(topViewButton);

const bottomViewButton = document.createElement('button');
bottomViewButton.textContent = 'Bottom View';
bottomViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('bottom');
  }
};
document.body.appendChild(bottomViewButton);

const leftViewButton = document.createElement('button');
leftViewButton.textContent = 'Left View';
leftViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('left');
  }
};
document.body.appendChild(leftViewButton);

const rightViewButton = document.createElement('button');
rightViewButton.textContent = 'Right View';
rightViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('right');
  }
};
document.body.appendChild(rightViewButton);

const frontViewButton = document.createElement('button');
frontViewButton.textContent = 'Front View';
frontViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('front');
  }
};
document.body.appendChild(frontViewButton);

const backViewButton = document.createElement('button');
backViewButton.textContent = 'Back View';
backViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('back');
  }
};
document.body.appendChild(backViewButton);

const diagonalViewButton = document.createElement('button');
diagonalViewButton.textContent = 'Diagonal View';
diagonalViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('diagonal');
  }
};
document.body.appendChild(diagonalViewButton);

const perspectiveViewButton = document.createElement('button');
perspectiveViewButton.textContent = 'Perspective View';
perspectiveViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.setView('perspective');
  }
};
document.body.appendChild(perspectiveViewButton);

const autoViewButton = document.createElement('button');
autoViewButton.textContent = 'Auto Zoom';
autoViewButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.autoZoom({ duration: 1000 });
  }
};
document.body.appendChild(autoViewButton);

const autoViewWithEdgesButton = document.createElement('button');
autoViewWithEdgesButton.textContent = 'Auto Zoom (Include Edges)';
autoViewWithEdgesButton.onclick = () => {
  if (graph.cameraPlugin) {
    graph.cameraPlugin.autoZoom({ duration: 1000, includeEdges: true });
  }
};
document.body.appendChild(autoViewWithEdgesButton);

// Bookmark buttons
const createBookmarkButton = document.createElement('button');
createBookmarkButton.textContent = 'Create Bookmark';
createBookmarkButton.onclick = async () => {
  if (graph.cameraPlugin) {
    const name = prompt('Enter bookmark name:') || 'Unnamed Bookmark';
    try {
      await graph.cameraPlugin.createBookmark(name);
      alert(`Bookmark '${name}' created!`);
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      alert('Failed to create bookmark');
    }
  }
};
document.body.appendChild(createBookmarkButton);

const listBookmarksButton = document.createElement('button');
listBookmarksButton.textContent = 'List Bookmarks';
listBookmarksButton.onclick = () => {
  if (graph.cameraPlugin) {
    const bookmarks = graph.cameraPlugin.getBookmarks();
    if (bookmarks.length > 0) {
      const bookmarkNames = bookmarks.map((b) => b.name).join(', ');
      alert(`Bookmarks: ${bookmarkNames}`);
    } else {
      alert('No bookmarks found.');
    }
  }
};
document.body.appendChild(listBookmarksButton);

// Add a button to add more nodes and test auto-zoom
const addNodesButton = document.createElement('button');
addNodesButton.textContent = 'Add Random Nodes';
addNodesButton.onclick = () => {
  const newNodes = [];
  const newEdges = [];

  for (let i = 0; i < 5; i++) {
    const nodeId = `node${Date.now()}_${i}`;
    newNodes.push({
      id: nodeId,
      type: 'sphere',
      position: {
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        z: Math.random() * 20 - 10,
      },
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });

    // Connect to center node
    newEdges.push({
      id: `edge${Date.now()}_${i}`,
      source: 'center',
      target: nodeId,
    });
  }

  graph.update({
    data: {
      nodes: { add: newNodes },
      edges: { add: newEdges },
    },
  });
};
document.body.appendChild(addNodesButton);

export default graph;
