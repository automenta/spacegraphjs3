import { useMemo, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';
import { useFractal } from './hooks/useFractal';
import Breadcrumbs from './components/Breadcrumbs';

const App = () => {
  const { path, open, back, set, fit } = useFractal(initialNodes);

  const handleNodeDoubleClick = useCallback(
    (_: any, node: Node) => {
      open(node);
    },
    [open]
  );

  const currentParentId = path.length > 0 ? path[path.length - 1] : undefined;

  const visibleNodes = useMemo(
    () => initialNodes.filter((node) => (node.data.parentId || undefined) === currentParentId),
    [currentParentId]
  );

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(
    () => initialEdges.filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)),
    [visibleNodeIds]
  );

  useEffect(() => {
    fit();
  }, [path, fit]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && path.length > 0) {
        back();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [path.length, back]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDoubleClick={handleNodeDoubleClick}
      >
        <Background color="#444" variant="dots" />
        <MiniMap />
        <Controls />
      </ReactFlow>
      <Breadcrumbs path={path} nodes={initialNodes} onNavigate={set} />
      {path.length > 0 && (
        <button
          onClick={back}
          style={{
            position: 'absolute',
            top: '25px',
            left: '25px',
            zIndex: 10,
            padding: '10px 20px',
            background: '#ffffff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
            transition: 'background 200ms ease, box-shadow 200ms ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f9f9f9';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
          }}
        >
          Back
        </button>
      )}
    </div>
  );
};

export default function AppWrapper() {
  return (
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  );
}