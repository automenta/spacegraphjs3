import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';

export function ShapeNode({ data }: NodeProps<NodeData>) {
  return (
    <div style={{
      width: '150px',
      height: '150px',
      background: 'rgba(255, 107, 107, 0.2)',
      border: '1px solid rgba(255, 107, 107, 0.5)',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      color: '#ff6b6b',
      fontFamily: "'Inter', sans-serif",
      fontWeight: 500,
      boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#ff6b6b' }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ background: '#ff6b6b' }} />
    </div>
  );
}