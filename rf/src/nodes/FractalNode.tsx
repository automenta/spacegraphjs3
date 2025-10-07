import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';

export function FractalNode({ data }: NodeProps<NodeData>) {
  return (
    <div style={{
      padding: '20px',
      background: 'radial-gradient(circle, rgba(118,10,229,0.2) 0%, rgba(0,0,0,0) 70%)',
      border: '1px solid rgba(118, 10, 229, 0.5)',
      borderRadius: '50%',
      width: '220px',
      height: '220px',
      fontFamily: "'Inter', sans-serif",
      fontSize: '16px',
      textAlign: 'center',
      transition: 'transform 300ms ease',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 0 20px rgba(118, 10, 229, 0.3)',
      color: '#eee',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#760AE5' }} />
      <div style={{ fontWeight: 600, fontSize: '18px', color: '#9d6cff' }}>{data.label}</div>
      <div style={{ marginTop: '10px', color: '#888', fontStyle: 'italic', fontSize: '12px' }}>
        (Double-click to enter)
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#760AE5' }} />
    </div>
  );
}