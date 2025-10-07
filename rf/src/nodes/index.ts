import type { NodeTypes } from '@xyflow/react';
import { FractalNode } from './FractalNode';
import { SvgNode } from './SvgNode';
import { HtmlNode } from './HtmlNode';
import { ShapeNode } from './ShapeNode';
import { AppNode } from './types';

export const initialNodes: AppNode[] = [
  // Root level nodes
  { id: '1', type: 'fractal-node', position: { x: 0, y: 0 }, data: { label: 'Explore This Fractal', depth: 0, width: 350, height: 180 } },
  { id: '2', type: 'html-node', position: { x: 450, y: 100 }, data: { label: 'Regular HTML Node', content: 'This is a standard node.', depth: 0 } },
  { id: '3', type: 'shape-node', position: { x: 150, y: 300 }, data: { label: 'Shape Node', depth: 0, width: 150, height: 150 } },
  { id: '4', type: 'vector-node', position: { x: 450, y: 300 }, data: { label: 'Vector Node', depth: 0, width: 200, height: 100 } },

  // Nodes inside fractal '1'
  { id: '1-1', type: 'fractal-node', position: { x: 50, y: 50 }, data: { label: 'Inner Fractal', parentId: '1', depth: 1, width: 250, height: 150 } },
  { id: '1-2', type: 'html-node', position: { x: 300, y: 120 }, data: { label: 'Inner HTML Node', content: 'This is inside the first fractal.', parentId: '1', depth: 1 } },
  { id: '1-3', type: 'shape-node', position: { x: 100, y: 250 }, data: { label: 'Inner Shape', parentId: '1', depth: 1, width: 120, height: 120 } },

  // Nodes inside fractal '1-1'
  { id: '1-1-1', type: 'html-node', position: { x: 20, y: 20 }, data: { label: 'Deepest Node', content: 'You have reached the core.', parentId: '1-1', depth: 2 } },
  { id: '1-1-2', type: 'shape-node', position: { x: 150, y: 150 }, data: { label: 'Deepest Shape', parentId: '1-1', depth: 2, width: 100, height: 100 } },
];

export const nodeTypes = {
  'fractal-node': FractalNode,
  'html-node': HtmlNode,
  'shape-node': ShapeNode,
  'vector-node': SvgNode,
} satisfies NodeTypes;
