import { useState, useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

export const useFractal = (initialNodes: Node[]) => {
  const [path, setPath] = useState<string[]>([]);
  const { fitView } = useReactFlow();

  const open = useCallback(
    (node: Node) => {
      const children = initialNodes.filter((n) => n.data.parentId === node.id);
      if (children.length > 0) {
        fitView({
          nodes: children.map((n) => ({ id: n.id })),
          duration: 700,
          padding: 0.1,
        });

        setTimeout(() => {
          setPath((currentPath) => [...currentPath, node.id]);
        }, 750);
      }
    },
    [initialNodes, fitView, setPath]
  );

  const back = useCallback(() => {
    const newPath = path.slice(0, -1);
    const parentId = newPath.length > 0 ? newPath[newPath.length - 1] : undefined;
    const visibleNodes = initialNodes.filter((node) => node.data.parentId === parentId);

    if (visibleNodes.length > 0) {
      fitView({
        nodes: visibleNodes.map((n) => ({ id: n.id })),
        duration: 700,
        padding: 0.1,
      });

      setTimeout(() => {
        setPath(newPath);
      }, 750);
    } else {
      // Handle case where we are returning to the root
      fitView({ duration: 700, padding: 0.1 });
      setTimeout(() => {
        setPath(newPath);
      }, 750);
    }
  }, [path, initialNodes, fitView, setPath]);

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