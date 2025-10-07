import type { NodeTypes } from '@xyflow/react';
import { FractalNode } from './FractalNode';
import { HtmlNode } from './HtmlNode';
import { AppNode } from './types';

export const initialNodes: AppNode[] = [
  // Root level nodes
  { id: '1', type: 'fractal-node', position: { x: 0, y: 0 }, data: { label: 'Explore This Fractal' } },
  { id: '2', type: 'html-node', position: { x: 250, y: 0 }, data: { label: 'Regular HTML Node', content: 'This is a standard node.' } },

  // Nodes inside fractal '1'
  { id: '1-1', type: 'fractal-node', position: { x: 50, y: 50 }, data: { label: 'Inner Fractal 1', parentId: '1' } },
  { id: '1-2', type: 'html-node', position: { x: 150, y: 150 }, data: { label: 'Inner HTML Node', content: 'This is inside the first fractal.', parentId: '1' } },

  // Nodes inside fractal '1-1'
  { id: '1-1-1', type: 'html-node', position: { x: 20, y: 20 }, data: { label: 'Deepest Node', content: 'You have reached the core.', parentId: '1-1' } },
];

export const nodeTypes = {
  'fractal-node': FractalNode,
  'html-node': HtmlNode,
} satisfies NodeTypes;
