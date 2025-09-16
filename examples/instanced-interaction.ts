import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import { SpaceGraph } from '../src/index';
import { GraphElement } from '../src/types';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

console.log('instanced-interaction.ts script started');

const NUM_NODES_X = 15;
const NUM_NODES_Y = 15;
const SPACING = 10;
const nodes: GraphElement[] = [];

for (let i = 0; i < NUM_NODES_X; i++) {
  for (let j = 0; j < NUM_NODES_Y; j++) {
    const id = `n-${i}-${j}`;
    nodes.push({
      id,
      type: 'sphere',
      position: {
        x: (i - NUM_NODES_X / 2) * SPACING + (Math.random() - 0.5) * 0.1,
        y: (j - NUM_NODES_Y / 2) * SPACING + (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.1,
      },
      color: '#ffffff', // Start with white
    });
  }
}

try {
  const graph = new SpaceGraph('#container', {
    data: {
      nodes,
      edges: [],
    },
    style: {
      'node:hover': {
        color: '#ff0000', // Red
      },
      'node:selected': {
        color: '#00ff00', // Green
      },
    },
    layout: {
      type: 'force-directed',
      charge: -30,
      linkDistance: 1,
    },
    camera: {
      target: { x: 0, y: 0, z: 0 },
      phi: 0,
      theta: 0,
      distance: 250,
    },
    controls: {
      keyboard: {
        enabled: false,
        panSpeed: 10,
        zoomSpeed: 1,
        orbitSpeed: 1,
      },
    },
    performance: {
      instancingThreshold: 100, // Ensure instancing is on
    },
    interaction: {
      hoveredElementId: null,
      selectedElementIds: [],
    },
  });

  // Expose graph to window for easy debugging and testing
  (window as any).graph = graph;
} catch (e) {
  console.error('Error creating SpaceGraph instance:', e);
}

console.log('SpaceGraph instance created for instanced interaction test');
