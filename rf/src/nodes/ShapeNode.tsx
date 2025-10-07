import { Handle, Position, type NodeProps, useStore } from '@xyflow/react';
import { NodeData } from './types';
import '../styles/ShapeNode.css';

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 18;

export function ShapeNode({ data }: NodeProps<NodeData>) {
  const { width = 120, height = 120, label } = data;
  const zoom = useStore(s => s.transform[2]);

  const fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE / zoom, MAX_FONT_SIZE));

  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative'
    }}>
      <svg width={width} height={height} className="shape-node-svg" viewBox={`0 0 ${width} ${height}`}>
        <circle cx={width / 2} cy={height / 2} r={width/2 - 2} className="body" />
        <text
          x="50%"
          y="50%"
          dy=".3em"
          textAnchor="middle"
          className="label"
          style={{ fontSize: `${fontSize}px` }}
        >
          {label}
        </text>
      </svg>
      <Handle type="target" position={Position.Top} className="handle" />
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}