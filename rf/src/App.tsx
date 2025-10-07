import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';

const App = () => {
  const [path, setPath] = useState<string[]>([]);
  const { fitView } = useReactFlow();

  const handleNodeDoubleClick = useCallback(
    (_: any, node: Node) => {
      const isFractal = initialNodes.some((n) => n.data.parentId === node.id);
      if (isFractal) {
        setPath((currentPath) => [...currentPath, node.id]);
      }
    },
    []
  );

  const handleBack = useCallback(() => {
    setPath((currentPath) => currentPath.slice(0, -1));
  }, []);

  const currentParentId = path.length > 0 ? path[path.length - 1] : undefined;

  const visibleNodes = useMemo(
    () => initialNodes.filter((node) => node.data.parentId === currentParentId),
    [currentParentId]
  );

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(
    () => initialEdges.filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)),
    [visibleNodeIds]
  );

  useEffect(() => {
    fitView({ duration: 600, padding: 0.1 });
  }, [visibleNodes, fitView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && path.length > 0) {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [path.length, handleBack]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDoubleClick={handleNodeDoubleClick}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
      {path.length > 0 && (
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            padding: '10px 15px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
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