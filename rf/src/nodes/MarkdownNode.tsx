import { Handle, Position, type NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { NodeData } from './types';
import '../styles/MarkdownNode.css';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const MIN_NODE_WIDTH = 150;
const MAX_NODE_WIDTH = 400;

export function MarkdownNode({ data }: NodeProps<NodeData>) {
  const { width = 200, content } = data;
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // Dynamically calculate font size based on node width
  const fontSize =
    MIN_FONT_SIZE +
    ((MAX_FONT_SIZE - MIN_FONT_SIZE) * (width - MIN_NODE_WIDTH)) /
      (MAX_NODE_WIDTH - MIN_NODE_WIDTH);

  const nodeStyle = {
    width: `${width}px`,
    '--font-size': `${Math.max(MIN_FONT_SIZE, fontSize)}px`,
  };

  return (
    <div
      className="markdown-node"
      style={nodeStyle}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <Handle type="target" position={Position.Top} className="handle" />
      <div className="markdown-node-content">
        <ReactMarkdown>{content || ''}</ReactMarkdown>
      </div>
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}