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

// Create nodes for the demo
const nodes: NodeSpec[] = [];
for (let i = 0; i < 20; i++) {
  nodes.push({
    id: `n${i}`,
    type: 'sphere',
    label: `Node ${i}`,
    color: `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`,
  });
}

// Create edges for the demo
const edges: EdgeSpec[] = [];
for (let i = 0; i < 15; i++) {
  edges.push({
    id: `e${i}`,
    source: `n${Math.floor(Math.random() * 20)}`,
    target: `n${Math.floor(Math.random() * 20)}`,
    type: 'straight',
    label: `Edge ${i}`,
  });
}

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
    distance: 50,
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

// Add UI controls to switch between layout engines
const createLayoutControls = () => {
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
  title.textContent = 'Layout Engines Demo';
  title.style.marginTop = '0';
  container.appendChild(title);

  const description = document.createElement('p');
  description.textContent = 'Switch between different layout algorithms:';
  description.style.fontSize = '14px';
  container.appendChild(description);

  const layouts = [
    { name: 'Force Directed', value: 'force-directed' as const },
    { name: 'Grid', value: 'grid' as const },
    { name: 'Circle', value: 'circle' as const },
    { name: 'Column', value: 'column' as const },
    { name: 'Row', value: 'row' as const },
    { name: 'Random', value: 'random' as const },
  ];

  layouts.forEach((layout) => {
    const button = document.createElement('button');
    button.textContent = layout.name;
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
      graph.update({
        layout: {
          type: layout.value,
          // Add specific parameters for each layout type
          ...(layout.value === 'grid' && { rows: 5, cols: 4 }),
          ...(layout.value === 'circle' && { radius: 15 }),
          ...(layout.value === 'column' && { axis: 'y' }),
          ...(layout.value === 'row' && { axis: 'x' }),
        } as any,
      });

      // Resume layout if it's a force-directed layout
      if (layout.value === 'force-directed') {
        const layoutPlugin = plugins.find(
          (p) => p instanceof LayoutPlugin
        ) as LayoutPlugin;
        layoutPlugin?.resume();
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
    <h3>Controls</h3>
    <p><strong>Mouse:</strong></p>
    <ul style="margin: 5px 0; padding-left: 20px;">
      <li>Left-click + drag: Rotate view</li>
      <li>Right-click + drag: Pan view</li>
      <li>Scroll: Zoom in/out</li>
      <li>Click node: Select</li>
      <li>Ctrl/Cmd + click: Multi-select</li>
    </ul>
    <p><strong>Keyboard:</strong></p>
    <ul style="margin: 5px 0; padding-left: 20px;">
      <li>WASD: Pan</li>
      <li>Arrow keys: Rotate</li>
      <li>+/-: Zoom</li>
    </ul>
  `;

  document.body.appendChild(container);
};

// Initialize UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
  createLayoutControls();
  createHelpInfo();
});
