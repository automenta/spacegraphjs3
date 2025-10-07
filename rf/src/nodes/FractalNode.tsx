import { Handle, Position, type NodeProps, useStore } from '@xyflow/react';
import { NodeData } from './types';
import '../styles/FractalNode.css';

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 28;

export function FractalNode({ data, id }: NodeProps<NodeData>) {
  const { width = 200, height = 120, label } = data;

  const zoom = useStore(s => s.transform[2]);

  // Dynamically calculate font size based on zoom level
  const fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE / zoom, MAX_FONT_SIZE));
  const subtextFontSize = Math.max(MIN_FONT_SIZE, Math.min(16 / zoom, 16));

  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative'
    }}>
      <svg width={width} height={height} className="fractal-node-svg">
        <rect width="100%" height="100%" rx="15" ry="15" className="body" />
        <text
          x="50%"
          y="45%"
          dy=".3em"
          textAnchor="middle"
          className="label"
          style={{ fontSize: `${fontSize}px` }}
        >
          {label}
        </text>
        <text
          x="50%"
          y="70%"
          dy=".3em"
          textAnchor="middle"
          className="subtext"
          style={{ fontSize: `${subtextFontSize}px` }}
        >
          Double-click to enter
        </text>
      </svg>
      <Handle type="target" position={Position.Top} className="handle" />
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}