import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeData } from './types';
import '../styles/HtmlNode.css';

export function HtmlNode({ data }: NodeProps<NodeData>) {
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="html-node"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <Handle type="target" position={Position.Top} className="handle" />
      <div className="label">{data.label}</div>
      <p className="content">{data.content}</p>
      <div className="input-group">
        <input placeholder="Enter text..." />
        <button onClick={() => alert('Button clicked!')}>Submit</button>
      </div>
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}