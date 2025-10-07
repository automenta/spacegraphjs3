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
import './styles/App.css';
import './styles/Edge.css';

import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';
import { useFractal } from './hooks/useFractal';
import Breadcrumbs from './components/Breadcrumbs';
import { getChildren } from './utils/node-tree';

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
    () => getChildren(currentParentId, initialNodes),
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
        onPaneClick={back}
      >
        <Background variant="dots" />
        <MiniMap />
        <Controls />
      </ReactFlow>
      <Breadcrumbs path={path} nodes={initialNodes} onNavigate={set} />
      {path.length > 0 && (
        <button onClick={back} className="back-button">
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