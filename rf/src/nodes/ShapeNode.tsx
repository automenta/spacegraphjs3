import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';
import '../styles/Node.css';

export function ShapeNode({ data }: NodeProps<NodeData>) {
  return (
    <div className="node-base shape-node">
      <Handle type="target" position={Position.Top} className="handle" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}