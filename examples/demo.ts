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
} from '../src';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const demoSpec: Spec = {
  data: {
    nodes: [
      // Core Concepts
      { id: 'features', type: 'sphere', label: 'Features ✨', color: '#ff6b6b', size: 1.5 },
      { id: 'style', type: 'sphere', label: 'Style 🎨', color: '#feca57' },
      { id: 'technology', type: 'sphere', label: 'Technology 🧑‍💻', color: '#48dbfb' },
      { id: 'interactive', type: 'sphere', label: 'Interactive 🖱️', color: '#1dd1a1' },

      // Feature Details
      { id: 'html-3d', type: 'sphere', label: 'HTML & 3D Nodes', color: '#ff9f43' },
      { id: 'edge-features', type: 'sphere', label: 'Edge Features', color: '#ff9f43' },
      { id: 'layout-systems', type: 'sphere', label: 'Layout Systems', color: '#ff9f43' },
      { id: 'camera-controls', type: 'sphere', label: 'Camera Controls', color: '#ff9f43' },

      // HTML Node Example
      {
        id: 'html-node-example',
        type: 'html',
        label: 'HTML Content Node',
        content: `
          <div style="padding: 20px; background: rgba(0,0,0,0.7); border-radius: 8px; color: white; font-family: sans-serif; border: 1px solid #fff;">
            <h2 style="margin-top: 0;">This is an HTML Node</h2>
            <p>It can contain any HTML content, including interactive elements.</p>
            <button id="html-node-button" style="padding: 8px 12px; background: #48dbfb; border: none; border-radius: 4px; cursor: pointer;">Click Me</button>
          </div>
        `,
        className: 'my-html-node',
      },
    ],
    edges: [
      { id: 'e1', source: 'features', target: 'html-3d' },
      { id: 'e2', source: 'features', target: 'edge-features' },
      { id: 'e3', source: 'features', target: 'layout-systems' },
      { id: 'e4', source: 'features', target: 'camera-controls' },
      { id: 'e5', source: 'style', target: 'features' },
      { id: 'e6', source: 'technology', target: 'features' },
      { id: 'e7', source: 'interactive', target: 'features' },
      { id: 'e8', source: 'html-3d', target: 'html-node-example' },
    ],
  },
  layout: {
    type: 'force-directed',
    options: {
        nodeStrength: -200,
    }
  },
  camera: {
    distance: 40,
  },
  style: {
    'node': {
        size: 1,
    },
    'node[type=html]': {
        size: 0.1,
    },
    'node:hover': {
      glow: {
        color: '#ffffff',
        strength: 1.0,
      }
    },
    'node:selected': {
      glow: {
        color: '#00ff00',
        strength: 2.0,
      }
    },
    'edge': {
        width: 2,
    }
  },
  interaction: {
      hoveredElementId: null,
      selectedElementIds: [],
  }
};

// Define the plugins to use.
const plugins = [
  new LayoutPlugin(),
  new CameraPlugin(),
  new InteractionPlugin(),
  new HUDPlugin(),
];

// Create the SpaceGraph instance.
const graph = new SpaceGraph('#container', demoSpec, plugins);

// Expose the graph instance for debugging.
(window as any).graph = graph;

console.log("Advanced demo loaded! You can interact with the `graph` object in the console.");

// --- UI Interactivity ---
document.addEventListener('DOMContentLoaded', () => {
  const frameAllButton = document.getElementById('btn-frame-all');
  const flyToHtmlButton = document.getElementById('btn-fly-to-html');

  if (frameAllButton && graph.cameraPlugin) {
    frameAllButton.addEventListener('click', () => {
      const nodes = graph.state.data.nodes;
      if (nodes && nodes.length > 0) {
        console.log('Framing all nodes...');
        const nodesWithVec3 = nodes
          .map((n) => n.position && { position: new THREE.Vector3(n.position.x, n.position.y, n.position.z) })
          .filter(Boolean);
        graph.cameraPlugin.frame(nodesWithVec3, { duration: 1000 });
      }
    });
  }

  if (flyToHtmlButton && graph.cameraPlugin) {
    flyToHtmlButton.addEventListener('click', () => {
      const htmlNode = graph.getElement('html-node-example');
      if (htmlNode && htmlNode.position) {
        console.log('Flying to HTML node...');
        const nodeWithVec3 = { position: new THREE.Vector3(htmlNode.position.x, htmlNode.position.y, htmlNode.position.z) };
        graph.cameraPlugin.frame([nodeWithVec3], { duration: 1500 });
      }
    });
  }

  // Handle active state for demo buttons
  const demoButtonsContainer = document.querySelector('.section:first-child');
  if (demoButtonsContainer) {
    const demoButtons = demoButtonsContainer.querySelectorAll('button');
    demoButtons.forEach(button => {
      button.addEventListener('click', () => {
        demoButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (button.id !== 'btn-full-demo') {
          console.warn(`Demo for '${button.textContent}' is not implemented yet.`);
          // Here you would typically load a different graph spec
          // graph.update(newSpec);
        } else {
          // Reload the full demo spec if needed, or just do nothing if it's already loaded.
          console.log("Full demo selected.");
        }
      });
    });
  }
});
