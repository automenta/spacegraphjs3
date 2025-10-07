import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';
import '../styles/Node.css';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const MIN_NODE_WIDTH = 150;
const MAX_NODE_WIDTH = 400;

export function FractalNode({ data }: NodeProps<NodeData>) {
  const { width = 200, label } = data;

  // Dynamically calculate font size based on node width
  const fontSize =
    MIN_FONT_SIZE +
    ((MAX_FONT_SIZE - MIN_FONT_SIZE) * (width - MIN_NODE_WIDTH)) /
      (MAX_NODE_WIDTH - MIN_NODE_WIDTH);

  const subtextFontSize = fontSize * 0.75;

  const nodeStyle = {
    width: `${width}px`,
    height: 'auto', // Adjust height automatically based on content
  };

  const labelStyle = {
    fontSize: `${Math.max(MIN_FONT_SIZE, fontSize)}px`,
  };

  const subtextStyle = {
    fontSize: `${Math.max(MIN_FONT_SIZE * 0.75, subtextFontSize)}px`,
  };

  return (
    <div className="node-base fractal-node" style={nodeStyle}>
      <Handle type="target" position={Position.Top} className="handle" />
      <div className="label" style={labelStyle}>
        {label}
      </div>
      <div className="subtext" style={subtextStyle}>
        Double-click to enter
      </div>
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}