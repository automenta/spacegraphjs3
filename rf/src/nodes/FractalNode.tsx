import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';
import '../styles/Node.css';

export function FractalNode({ data }: NodeProps<NodeData>) {
  return (
    <div className="node-base fractal-node">
      <Handle type="target" position={Position.Top} className="handle" />
      <div className="label">{data.label}</div>
      <div className="subtext">Double-click to enter</div>
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}