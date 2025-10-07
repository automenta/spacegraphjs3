import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';

export function HtmlNode({ data }: NodeProps<NodeData>) {
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="html-node"
      style={{
        padding: '25px',
        background: '#ffffff',
        border: '1px solid #eaeaea',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        width: '340px',
        fontFamily: "'Inter', sans-serif",
        color: '#333',
        transition: 'transform 300ms ease',
      }}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#ccc' }} />
      <div style={{ fontWeight: 600, marginBottom: '15px', fontSize: '20px' }}>{data.label}</div>
      <p style={{ margin: '0 0 20px 0', lineHeight: 1.7, color: '#555' }}>{data.content}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          placeholder="Enter some text..."
          style={{
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={() => alert('Button clicked!')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: '#760AE5',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'background 200ms ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#5a08b3')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#760AE5')}
        >
          Submit
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#ccc' }} />
    </div>
  );
}