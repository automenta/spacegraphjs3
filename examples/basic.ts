import { SpaceGraph } from '../src';
import { Spec } from '../src/types';

// 1. Define the initial state of the graph.
const initialSpec: Spec = {
  data: {
    nodes: [
      { id: 'n1', type: 'sphere', label: 'Node 1', color: '#ff5733', position: { x: 0, y: 0, z: 0 } },
      { id: 'n2', type: 'sphere', label: 'Node 2', color: '#33ff57', position: { x: 1, y: 1, z: 0 } },
      { id: 'n3', type: 'sphere', label: 'Node 3', color: '#3357ff', position: { x: -1, y: 1, z: 0 } },
      { id: 'n4', type: 'sphere', label: 'Node 4', color: '#ff33a1', position: { x: -1, y: -1, z: 0 } },
      { id: 'n5', type: 'sphere', label: 'Node 5', color: '#a133ff', position: { x: 1, y: -1, z: 0 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n1', target: 'n3' },
      { id: 'e3', source: 'n1', target: 'n4' },
      { id: 'e4', source: 'n1', target: 'n5' },
    ],
  },
  layout: {
    type: 'force-directed', // Use the force-directed layout
  },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: 0.2, // A bit of an angle from the top
    theta: 0.1, // A bit of an angle from the side
    distance: 15,
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: [],
  },
  style: {
    'node:hover': { color: '#ffff00' },
    'node:selected': { color: '#ffffff' },
  },
};

// 2. Create the SpaceGraph instance.
const graph = new SpaceGraph('#container', initialSpec);

// 3. Expose the graph instance for debugging and testing.
(window as any).graph = graph;
console.log('SpaceGraph initialized');

// 4. Automated Verification Logic
setTimeout(() => {
  console.log('Running automated verification...');
  const resultsDiv = document.getElementById('test-results')!;
  let resultsHTML = '';

  // Test 1: Layout Engine
  const node1 = graph.state.data.nodes.find(n => n.id === 'n1');
  const initialNodePos = initialSpec.data!.nodes!.find(n => n.id === 'n1')!.position!;
  const layoutPass = node1!.position.x !== initialNodePos.x || node1!.position.y !== initialNodePos.y;
  resultsHTML += `Layout Test: <span style="color: ${layoutPass ? 'lightgreen' : 'red'}">${layoutPass ? 'PASS' : 'FAIL'}</span><br>`;

  // Test 2: Camera Animation
  const cameraTargetDistance = 5;
  const cameraPass = Math.abs(graph.state.camera.distance - cameraTargetDistance) < 0.1;
  resultsHTML += `Camera Test: <span style="color: ${cameraPass ? 'lightgreen' : 'red'}">${cameraPass ? 'PASS' : 'FAIL'}</span><br>`;

  resultsDiv.innerHTML = resultsHTML;
  console.log('Verification complete.');

}, 7000); // Run checks after layout and animation have had time to finish.


// 5. Demonstrate camera animation (for visual inspection)
setTimeout(() => {
  console.log('Kicking off camera animation...');
  graph.camera.flyTo(
    {
      distance: 5,
    },
    { duration: 2000 }
  );
}, 4000);