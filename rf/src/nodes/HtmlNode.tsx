import { Handle, Position, type NodeProps } from '@xyflow/react';

export function HtmlNode({ data }: NodeProps<{ label: string; content: string }>) {
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="html-node"
      style={{
        padding: '20px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        width: '320px',
        fontFamily: "'Inter', sans-serif",
        color: '#333',
      }}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '18px' }}>{data.label}</div>
      <p style={{ margin: '0 0 18px 0', lineHeight: 1.6, color: '#666' }}>{data.content}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          placeholder="Enter some text..."
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={() => alert('Button clicked!')}
          style={{
            padding: '10px 15px',
            border: 'none',
            background: '#007bff',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Submit
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}