import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

// The props are passed by the React Flow component
export function HtmlNode({ data }: NodeProps<{ label: string; content: string }>) {
  return (
    // We add this class to ensure the node can be handled by React Flow
    <div className="react-flow__node-default" style={{
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #888',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: '300px',
        fontFamily: 'sans-serif',
        fontSize: '14px',
    }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px', color: '#333' }}>{data.label}</div>
      <p style={{ margin: '0 0 15px 0', color: '#555' }}>{data.content}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          placeholder="Enter some text..."
          onClick={(e) => e.stopPropagation()} // Prevent node drag when interacting
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); alert('Button clicked!'); }}
          style={{ padding: '8px 12px', border: 'none', background: '#3498db', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
        >
          Submit
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}