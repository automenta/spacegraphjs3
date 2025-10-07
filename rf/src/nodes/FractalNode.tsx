import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export function FractalNode({ data }: NodeProps<{ label: string }>) {
  return (
    <div style={{
      padding: '15px',
      background: 'rgba(240, 240, 255, 0.95)',
      border: '2px dashed #888',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      width: '200px',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      textAlign: 'center',
    }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px', color: '#333' }}>{data.label}</div>
      <div style={{ color: '#555', fontStyle: 'italic' }}>(Double-click to enter)</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}