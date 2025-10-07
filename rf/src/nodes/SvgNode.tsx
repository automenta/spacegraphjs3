import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';
import '../styles/SvgNode.css';

export function SvgNode({ data }: NodeProps<NodeData>) {
  const { width = 200, height = 100, label } = data;

  return (
    <svg width={width} height={height} className="svg-node">
      <Handle type="target" position={Position.Top} />
      <rect width={width} height={height} rx="10" ry="10" className="body" />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        className="label"
      >
        {label}
      </text>
      <Handle type="source" position={Position.Bottom} />
    </svg>
  );
}