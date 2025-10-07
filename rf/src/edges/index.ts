import type { Edge, EdgeTypes } from '@xyflow/react';

export const initialEdges: Edge[] = [
  // Edge at the root level
  { id: '1->2', source: '1', target: '2', animated: true },

  // Edges within fractal '1'
  { id: '1-1->1-2', source: '1-1', target: '1-2', animated: true },
];

export const edgeTypes = {
  // No custom edge types needed for this example
} satisfies EdgeTypes;
