import type { NodeTypes } from '@xyflow/react';
import { FractalNode } from './FractalNode';
import { HtmlNode } from './HtmlNode';
import { MarkdownNode } from './MarkdownNode';
import { ShapeNode } from './ShapeNode';
import { AppNode } from './types';

export const initialNodes: AppNode[] = [
  // Level 0 - Root
  {
    id: 'root',
    type: 'fractal-node',
    position: { x: 0, y: 0 },
    data: { label: 'Root Fractal', depth: 0, width: 400 },
  },
  {
    id: 'info',
    type: 'markdown-node',
    position: { x: 500, y: -100 },
    data: {
      label: 'Info',
      content: `
# SpaceGraphJS Prototype
This demo showcases a multi-scale, zoomable UI.

**Features:**
- **Fractal Nodes:** Double-click to zoom in.
- **HTML Nodes:** Render plain HTML.
- **Markdown Nodes:** Render rich Markdown.
- **Dynamic Scaling:** Font sizes adapt to node width.
      `,
      depth: 0,
    },
  },

  // Level 1 - Inside 'root'
  {
    id: '1-apps',
    type: 'fractal-node',
    position: { x: 50, y: 50 },
    data: { label: 'Applications', parentId: 'root', depth: 1, width: 300 },
  },
  {
    id: '1-docs',
    type: 'fractal-node',
    position: { x: 400, y: 150 },
    data: { label: 'Documentation', parentId: 'root', depth: 1, width: 250 },
  },
  {
    id: '1-small-node',
    type: 'html-node',
    position: { x: 100, y: 280 },
    data: { label: 'Small HTML', content: 'A tiny node.', parentId: 'root', depth: 1 },
  },

  // Level 2 - Inside '1-apps'
  {
    id: '2-widget',
    type: 'html-node',
    position: { x: 50, y: 50 },
    data: { label: 'Interactive Widget', content: 'An interactive HTML element.', parentId: '1-apps', depth: 2 },
  },
  {
    id: '2-another-fractal',
    type: 'fractal-node',
    position: { x: 600, y: 500 },
    data: { label: 'Deeper Fractal', parentId: '1-apps', depth: 2, width: 200 },
  },
  // START --- ADDED NODES FOR DEMONSTRATION
  { id: '2-app-1', type: 'html-node', position: { x: 50, y: 250 }, data: { label: 'App 1', parentId: '1-apps', depth: 2, width: 200 } },
  { id: '2-app-2', type: 'html-node', position: { x: 50, y: 450 }, data: { label: 'App 2', parentId: '1-apps', depth: 2, width: 150 } },
  { id: '2-app-3', type: 'html-node', position: { x: 50, y: 650 }, data: { label: 'App 3', parentId: '1-apps', depth: 2, width: 220 } },
  { id: '2-app-4', type: 'shape-node', position: { x: 300, y: 50 }, data: { label: 'Data Viz', parentId: '1-apps', depth: 2, width: 180 } },
  { id: '2-app-5', type: 'shape-node', position: { x: 300, y: 250 }, data: { label: 'Metrics', parentId: '1-apps', depth: 2, width: 120 } },
  { id: '2-app-6', type: 'html-node', position: { x: 300, y: 450 }, data: { label: 'User Settings', parentId: '1-apps', depth: 2, width: 250 } },
  { id: '2-app-7', type: 'html-node', position: { x: 300, y: 650 }, data: { label: 'Tool 1', parentId: '1-apps', depth: 2, width: 100 } },
  { id: '2-app-8', type: 'html-node', position: { x: 550, y: 50 }, data: { label: 'Tool 2', parentId: '1-apps', depth: 2, width: 160 } },
  { id: '2-app-9', type: 'html-node', position: { x: 550, y: 250 }, data: { label: 'Tool 3', parentId: '1-apps', depth: 2, width: 180 } },
  { id: '2-app-10', type: 'html-node', position: { x: 550, y: 650 }, data: { label: 'Service A', parentId: '1-apps', depth: 2, width: 200 } },
  { id: '2-app-11', type: 'html-node', position: { x: 800, y: 50 }, data: { label: 'Service B', parentId: '1-apps', depth: 2, width: 120 } },
  { id: '2-app-12', type: 'html-node', position: { x: 800, y: 250 }, data: { label: 'Service C', parentId: '1-apps', depth: 2, width: 220 } },
  { id: '2-app-13', type: 'html-node', position: { x: 800, y: 450 }, data: { label: 'Service D', parentId: '1-apps', depth: 2, width: 150 } },
  { id: '2-app-14', type: 'html-node', position: { x: 800, y: 650 }, data: { label: 'API Endpoint 1', parentId: '1-apps', depth: 2, width: 250 } },
  { id: '2-app-15', type: 'html-node', position: { x: 1050, y: 50 }, data: { label: 'API Endpoint 2', parentId: '1-apps', depth: 2, width: 200 } },
  { id: '2-app-16', type: 'html-node', position: { x: 1050, y: 250 }, data: { label: 'Database', parentId: '1-apps', depth: 2, width: 180 } },
  { id: '2-app-17', type: 'html-node', position: { x: 1050, y: 450 }, data: { label: 'Cache', parentId: '1-apps', depth: 2, width: 120 } },
  { id: '2-app-18', type: 'html-node', position: { x: 1050, y: 650 }, data: { label: 'Auth Service', parentId: '1-apps', depth: 2, width: 220 } },
  { id: '2-app-19', type: 'html-node', position: { x: 50, y: 850 }, data: { label: 'Logger', parentId: '1-apps', depth: 2, width: 150 } },
  { id: '2-app-20', type: 'html-node', position: { x: 300, y: 850 }, data: { label: 'File Storage', parentId: '1-apps', depth: 2, width: 250 } },
  { id: '2-app-21', type: 'html-node', position: { x: 550, y: 850 }, data: { label: 'Search Index', parentId: '1-apps', depth: 2, width: 200 } },
  // END --- ADDED NODES FOR DEMONSTRATION

  // Level 2 - Inside '1-docs'
  {
    id: '2-readme',
    type: 'markdown-node',
    position: { x: 30, y: 30 },
    data: {
      label: 'README',
      content: '### Project README\n\nThis is where project documentation would go.',
      parentId: '1-docs',
      depth: 2,
    },
  },
  {
    id: '2-api',
    type: 'markdown-node',
    position: { x: 80, y: 180 },
    data: {
      label: 'API Reference',
      content: '#### API\n\n- `createNode()`\n- `deleteNode()`',
      parentId: '1-docs',
      depth: 2,
    },
  },

  // Level 3 - Inside '2-another-fractal'
  {
    id: '3-deep-1',
    type: 'shape-node',
    position: { x: 10, y: 20 },
    data: { label: 'Deep Shape 1', parentId: '2-another-fractal', depth: 3 },
  },
  {
    id: '3-deep-2',
    type: 'shape-node',
    position: { x: 100, y: 100 },
    data: { label: 'Deep Shape 2', parentId: '2-another-fractal', depth: 3 },
  },
  {
    id: '3-tiniest-fractal',
    type: 'fractal-node',
    position: { x: 50, y: 180 },
    data: { label: 'Tiniest Fractal', parentId: '2-another-fractal', depth: 3, width: 150 },
  },

  // Level 4 - Inside '3-tiniest-fractal'
  {
    id: '4-core',
    type: 'html-node',
    position: { x: 15, y: 25 },
    data: { label: 'Core', content: 'You found the core!', parentId: '3-tiniest-fractal', depth: 4 },
  },
];

export const nodeTypes = {
  'fractal-node': FractalNode,
  'html-node': HtmlNode,
  'markdown-node': MarkdownNode,
  'shape-node': ShapeNode,
} satisfies NodeTypes;