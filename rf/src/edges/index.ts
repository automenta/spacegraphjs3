import type { Edge, EdgeTypes } from '@xyflow/react';

export const initialEdges: Edge[] = [
  // Edges at the root level
  { id: '1->2', source: '1', target: '2', animated: true, className: 'edge-purple' },
  { id: '1->3', source: '1', target: '3', animated: true, className: 'edge-red' },
  { id: '2->3', source: '2', target: '3', className: 'edge-gray' },


  // Edges within fractal '1'
  { id: '1-1->1-2', source: '1-1', target: '1-2', animated: true, className: 'edge-purple' },
  { id: '1-1->1-3', source: '1-1', target: '1-3', animated: true, className: 'edge-red' },
  { id: '1-2->1-3', source: '1-2', target: '1-3', className: 'edge-gray' },

  // Edges within fractal '1-1'
  { id: '1-1-1->1-1-2', source: '1-1-1', target: '1-1-2', animated: true, className: 'edge-red' },
];

export const edgeTypes = {
  // No custom edge types needed for this example
} satisfies EdgeTypes;