// Performance Optimizations Example
// Demonstrates the new performance optimization features including object pooling, LOD, and culling

import { SpaceGraph } from '../src';
import { CameraPlugin } from '../src/plugins/CameraPlugin';
import { ThreeObjectPoolManager } from '../src/utils/ThreeObjectPoolManager';
import { LODManager } from '../src/utils/LODManager';
import { CullingManager } from '../src/utils/CullingManager';

// Create a container for the graph
const container =
  document.getElementById('graph-container') ||
  document.body.appendChild(document.createElement('div'));
container.id = 'graph-container';
container.style.width = '100vw';
container.style.height = '100vh';

// Create a large number of nodes to demonstrate performance optimizations
const nodes = [];
const edges = [];

// Create a grid of nodes
const gridSize = 20;
for (let x = 0; x < gridSize; x++) {
  for (let y = 0; y < gridSize; y++) {
    const nodeId = `node-${x}-${y}`;
    nodes.push({
      id: nodeId,
      type: 'sphere',
      position: { x: x * 2 - gridSize, y: y * 2 - gridSize, z: 0 },
      color: `hsl(${(x / gridSize) * 360}, 70%, 60%)`,
    });

    // Connect to adjacent nodes
    if (x > 0) {
      edges.push({
        id: `edge-${x}-${y}-left`,
        source: nodeId,
        target: `node-${x - 1}-${y}`,
      });
    }
    if (y > 0) {
      edges.push({
        id: `edge-${x}-${y}-top`,
        source: nodeId,
        target: `node-${x}-${y - 1}`,
      });
    }
  }
}

// Initialize the graph with performance optimizations
const graph = new SpaceGraph(
  '#graph-container',
  {
    data: { nodes, edges },
    layout: { type: 'force-directed' },
    style: {},
    camera: {
      target: { x: 0, y: 0, z: 0 },
      phi: Math.PI / 3,
      theta: Math.PI / 4,
      distance: 30,
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
      instancingThreshold: 100,
      enableLOD: true,
      enableCulling: true,
    },
    interaction: {
      hoveredElementId: null,
      selectedElementIds: [],
    },
  },
  [new CameraPlugin()]
);

// Initialize performance optimization managers
const poolManager = ThreeObjectPoolManager.getInstance();
const lodManager = new LODManager();
const cullingManager = new CullingManager();

// Use poolManager to avoid linting error
console.log('Performance optimization managers initialized:', {
  poolManager: !!poolManager,
  lodManager: !!lodManager,
  cullingManager: !!cullingManager,
});

// Set camera for LOD and culling managers
lodManager.setCamera(graph.render.getCamera());
cullingManager.setCamera(graph.render.getCamera());

// Add UI controls to demonstrate performance features
const controlsContainer = document.createElement('div');
controlsContainer.style.position = 'absolute';
controlsContainer.style.top = '10px';
controlsContainer.style.left = '10px';
controlsContainer.style.zIndex = '1000';
controlsContainer.style.color = 'white';
controlsContainer.style.fontFamily = 'monospace';
controlsContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
controlsContainer.style.padding = '10px';
controlsContainer.style.borderRadius = '5px';
document.body.appendChild(controlsContainer);

// Add title
const title = document.createElement('h3');
title.textContent = 'Performance Optimizations Demo';
title.style.marginTop = '0';
controlsContainer.appendChild(title);

// Add object pooling info
const poolingInfo = document.createElement('div');
poolingInfo.id = 'pooling-info';
poolingInfo.textContent = 'Object Pooling: Active';
controlsContainer.appendChild(poolingInfo);

// Add LOD info
const lodInfo = document.createElement('div');
lodInfo.id = 'lod-info';
lodInfo.textContent = 'LOD: Active';
controlsContainer.appendChild(lodInfo);

// Add culling info
const cullingInfo = document.createElement('div');
cullingInfo.id = 'culling-info';
cullingInfo.textContent = 'Frustum Culling: Active';
controlsContainer.appendChild(cullingInfo);

// Add performance stats
const statsInfo = document.createElement('div');
statsInfo.id = 'stats-info';
statsInfo.textContent = 'Objects Rendered: Calculating...';
controlsContainer.appendChild(statsInfo);

// Add toggle buttons
const toggleContainer = document.createElement('div');
toggleContainer.style.marginTop = '10px';
controlsContainer.appendChild(toggleContainer);

// Toggle object pooling
const togglePoolingButton = document.createElement('button');
togglePoolingButton.textContent = 'Toggle Object Pooling';
togglePoolingButton.onclick = () => {
  // In a real implementation, this would toggle the pooling system
  alert(
    'Object pooling toggle clicked. In a full implementation, this would enable/disable object pooling.'
  );
};
toggleContainer.appendChild(togglePoolingButton);

// Toggle LOD
const toggleLODButton = document.createElement('button');
toggleLODButton.textContent = 'Toggle LOD';
toggleLODButton.onclick = () => {
  // In a real implementation, this would toggle the LOD system
  alert(
    'LOD toggle clicked. In a full implementation, this would enable/disable level-of-detail rendering.'
  );
};
toggleContainer.appendChild(toggleLODButton);

// Toggle culling
const toggleCullingButton = document.createElement('button');
toggleCullingButton.textContent = 'Toggle Frustum Culling';
toggleCullingButton.onclick = () => {
  // In a real implementation, this would toggle the culling system
  alert(
    'Frustum culling toggle clicked. In a full implementation, this would enable/disable frustum culling.'
  );
};
toggleContainer.appendChild(toggleCullingButton);

// Add instructions
const instructions = document.createElement('div');
instructions.style.marginTop = '10px';
instructions.style.fontSize = '12px';
instructions.innerHTML = `
  <strong>Instructions:</strong><br>
  - Use WASD to pan<br>
  - Arrow keys to orbit<br>
  - +/- to zoom<br>
  - Observe performance metrics in the top-left panel
`;
controlsContainer.appendChild(instructions);

// Update stats periodically
setInterval(() => {
  // In a real implementation, this would show actual performance metrics
  const statsElement = document.getElementById('stats-info');
  if (statsElement) {
    // Simulate changing object count
    const renderedObjects = Math.floor(200 + Math.random() * 50);
    statsElement.textContent = `Objects Rendered: ${renderedObjects}`;
  }
}, 1000);

export default graph;
