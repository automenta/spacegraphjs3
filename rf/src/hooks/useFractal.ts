import { useState, useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

export const useFractal = (initialNodes: Node[]) => {
  const [path, setPath] = useState<string[]>([]);
  const { fitView } = useReactFlow();

  const open = useCallback(
    (node: Node) => {
      const isFractal = initialNodes.some((n) => n.data.parentId === node.id);
      if (isFractal) {
        setPath((currentPath) => [...currentPath, node.id]);
      }
    },
    [initialNodes]
  );

  const back = useCallback(() => {
    setPath((currentPath) => currentPath.slice(0, -1));
  }, []);

  const fit = useCallback(() => {
    fitView({ duration: 600, padding: 0.1 });
  }, [fitView]);

  return { path, open, back, fit };
};