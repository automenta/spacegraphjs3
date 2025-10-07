import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export function useZoom() {
  const reactFlow = useReactFlow();

  const zoomToNode = useCallback((id: string) => {
    const node = reactFlow.getNode(id);
    if (node) {
      reactFlow.fitView({
        nodes: [{ id }],
        duration: 800,
        padding: 0.2,
      });
    }
  }, [reactFlow]);

  const zoomOut = useCallback(() => {
    reactFlow.fitView({ duration: 800 });
  }, [reactFlow]);

  return { zoomToNode, zoomOut };
}