import { useState, useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

export const useFractal = (initialNodes: Node[]) => {
  const [path, setPath] = useState<string[]>([]);
  const { fitView } = useReactFlow();

  const open = useCallback(
    (node: Node) => {
      const isFractal = initialNodes.some((n) => n.data.parentId === node.id);
      if (isFractal) {
        fitView({ nodes: [{ id: node.id }], duration: 400, padding: 0.2, maxZoom: 2 });
        setTimeout(() => {
          setPath((currentPath) => [...currentPath, node.id]);
        }, 450);
      }
    },
    [initialNodes, fitView]
  );

  const back = useCallback(() => {
    setPath((currentPath) => currentPath.slice(0, -1));
  }, []);

  const set = useCallback((newPath: string[]) => {
    setPath(newPath);
  }, []);

  const fit = useCallback(() => {
    const currentParentId = path.length > 0 ? path[path.length - 1] : undefined;
    const visibleNodes = initialNodes.filter((node) => node.data.parentId === currentParentId);
    if (visibleNodes.length > 0) {
      fitView({ nodes: visibleNodes.map(n => ({ id: n.id })), duration: 600, padding: 0.1 });
    }
  }, [path, initialNodes, fitView]);

  return { path, open, back, set, fit };
};