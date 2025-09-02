// src/createState.ts
import { createStore, produce } from 'solid-js/store';
import { Spec } from './types';

export function createState(initialSpec: Spec) {
  const [state, setState] = createStore<Spec>({
    ...initialSpec,
    interaction: {
      hoveredElementId: null as string | null,
      selectedElementIds: [] as string[],
      ...initialSpec.interaction,
    },
  });

  const updateState = (spec: Partial<Spec>) => {
    setState(
      produce((s) => {
        // Shallow merge for top-level properties
        for (const key in spec) {
          if (key === 'data') continue;
          const k = key as keyof Spec;
          if (
            k === 'interaction' ||
            k === 'camera' ||
            k === 'layout' ||
            k === 'style'
          ) {
            if (spec[k]) {
              s[k] = { ...s[k], ...spec[k] } as any;
            }
          } else {
            (s as any)[k] = spec[k];
          }
        }

        // Handle data updates
        if (spec.data) {
          if (spec.data.nodes) {
            const nodeMap = new Map(s.data?.nodes?.map((n) => [n.id, n]));
            for (const updatedNode of spec.data.nodes) {
              if ((updatedNode as any).delete) {
                nodeMap.delete(updatedNode.id);
              } else {
                const existingNode = nodeMap.get(updatedNode.id);
                if (existingNode) {
                  Object.assign(existingNode, updatedNode);
                } else {
                  nodeMap.set(updatedNode.id, updatedNode);
                }
              }
            }
            s.data!.nodes = Array.from(nodeMap.values());
          }
          if (spec.data.edges) {
            const edgeMap = new Map(s.data?.edges?.map((e) => [e.id, e]));
            for (const updatedEdge of spec.data.edges) {
              if ((updatedEdge as any).delete) {
                edgeMap.delete(updatedEdge.id);
              } else {
                const existingEdge = edgeMap.get(updatedEdge.id);
                if (existingEdge) {
                  Object.assign(existingEdge, updatedEdge);
                } else {
                  edgeMap.set(updatedEdge.id, updatedEdge);
                }
              }
            }
            s.data!.edges = Array.from(edgeMap.values());
          }
        }
      })
    );
  };

  return { state, updateState };
}
