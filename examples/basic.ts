// examples/basic.ts

import { SpaceGraph } from '../src';
import { Spec } from '../src/types';
import { createEffect } from 'solid-js';

const initialSpec: Spec = {
  data: {
    nodes: [
      { id: 'n1', type: 'sphere', color: '#ff0000' },
      { id: 'n2', type: 'sphere', color: '#00ff00' },
      { id: 'n3', type: 'sphere', color: '#0000ff' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ]
  },
  layout: {
    type: 'force-directed',
  },
  camera: {
    position: { x: 0, y: 0, z: 5 },
    zoom: 1,
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: [],
  },
  style: {
    'node:hover': { color: '#ffff00' }, // Yellow on hover
    'node:selected': { color: '#00ff00' }, // Green on selected
  },
};

const graph = new SpaceGraph('#container', initialSpec);

// Expose graph for testing
(window as any).graph = graph;

console.log('SpaceGraph initialized', graph);

// Log camera state changes
createEffect(() => {
  console.log('Camera Position:', graph.state.camera.position);
  console.log('Camera Zoom:', graph.state.camera.zoom);
});

// Log interaction state changes
createEffect(() => {
  console.log('Hovered Element ID:', graph.state.interaction.hoveredElementId);
  console.log('Selected Element IDs:', graph.state.interaction.selectedElementIds);
});