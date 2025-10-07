import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';

export function FractalNode({ data }: NodeProps<NodeData>) {
  return (
    <div style={{
      padding: '20px',
      background: 'radial-gradient(circle, rgba(118,10,229,0.1) 0%, rgba(230,230,255,0.1) 100%)',
      border: '2px solid #760AE5',
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
      boxShadow: '0 10px 30px rgba(118, 10, 229, 0.2)',
      color: '#333',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#760AE5' }} />
      <div style={{ fontWeight: 600, fontSize: '18px', color: '#760AE5' }}>{data.label}</div>
      <div style={{ marginTop: '10px', color: '#555', fontStyle: 'italic', fontSize: '12px' }}>
        (Double-click to enter)
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#760AE5' }} />
    </div>
  );
}