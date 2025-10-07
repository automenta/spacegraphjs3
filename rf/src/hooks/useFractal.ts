import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { AppNode } from '../nodes/types';
import { getChildren } from '../utils/node-tree';

export const useFractal = (
  initialNodes: AppNode[],
  initialPath: string[] = []
) => {
  const [path, setPath] = useState<string[]>(initialPath);
  const { fitView } = useReactFlow();

  const open = useCallback(
    (node: AppNode) => {
      const children = getChildren(node.id, initialNodes);
      if (children.length > 0) {
        fitView({
          nodes: children.map((n) => ({ id: n.id })),
          duration: 700,
          padding: 0.1,
        });

        // Delay setting the path until the fitView animation is mostly complete.
        // This provides a smoother visual transition for the user.
        setTimeout(() => {
          setPath((currentPath) => [...currentPath, node.id]);
        }, 750);
      }
    },
    [initialNodes, fitView, setPath]
  );

  const back = useCallback(() => {
    if (path.length === 0) {
      return;
    }

    const newPath = path.slice(0, -1);
    const parentId = newPath.length > 0 ? newPath[newPath.length - 1] : undefined;
    const visibleNodes = getChildren(parentId, initialNodes);

    if (visibleNodes.length > 0) {
      fitView({
        nodes: visibleNodes.map((n) => ({ id: n.id })),
        duration: 700,
        padding: 0.1,
      });
    } else {
      // When returning to the root, fit all root nodes
      const rootNodes = getChildren(undefined, initialNodes);
      fitView({
        nodes: rootNodes.map((n) => ({ id: n.id })),
        duration: 700,
        padding: 0.1,
      });
    }

    // Delay setting the path to sync with the fitView animation, ensuring a
    // smooth transition when navigating back to the parent view.
    setTimeout(() => {
      setPath(newPath);
    }, 750);
  }, [path, initialNodes, fitView, setPath]);

  const set = useCallback((newPath: string[]) => {
    setPath(newPath);
  }, []);

  const fit = useCallback(() => {
    const currentParentId = path.length > 0 ? path[path.length - 1] : undefined;
    const visibleNodes = getChildren(currentParentId, initialNodes);
    if (visibleNodes.length > 0) {
      fitView({ nodes: visibleNodes.map((n) => ({ id: n.id })), duration: 600, padding: 0.1 });
    }
  }, [path, initialNodes, fitView]);

  return { path, open, back, set, fit };
};