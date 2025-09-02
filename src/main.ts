import { SpaceGraph } from './SpaceGraph';

console.log('SpaceGraphJS initializing...');

const container = document.getElementById('container');

if (container) {
  // The spec will be defined here or loaded from an external source
  const initialSpec = {
    data: {
      nodes: [
        { id: 'n1', type: 'sphere', color: '#ff0000' },
        { id: 'n2', type: 'sphere', color: '#00ff00' },
        { id: 'n3', type: 'sphere', color: '#0000ff' },
      ],
      edges: [],
    },
    layout: {
      type: 'manual',
    },
  };

  const graph = new SpaceGraph(container, initialSpec);

  console.log('SpaceGraph instance created:', graph);
} else {
  console.error('Container element not found.');
}
