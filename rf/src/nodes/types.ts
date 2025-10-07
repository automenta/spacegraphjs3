import type { Node as ReactFlowNode, BuiltInNode } from '@xyflow/react';

// A base type for the data that can be associated with our nodes
export type NodeData = {
  label: string;
  content?: string;
  parentId?: string | null;
};

// Redefine the base node type to use our custom data type
export type AppNode = ReactFlowNode<NodeData>;

// We are not using custom node types in a way that requires separate type definitions,
// but we keep the file for future extensions.
export type HtmlNode = AppNode;
export type PositionLoggerNode = AppNode;
export type FractalNode = AppNode;
