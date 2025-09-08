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
            const existingNodeMap = new Map(s.data?.nodes?.map((n) => [n.id, n]));
            const updatedNodeMap = new Map(spec.data.nodes.map(n => [n.id, n]));

            // Filter out deleted nodes and update existing ones
            s.data!.nodes = s.data!.nodes!.filter(node => {
              const updatedNode = updatedNodeMap.get(node.id);
              if (updatedNode) {
                if (!(updatedNode as any).delete) {
                  // Mutate existing node properties directly
                  Object.assign(node, updatedNode);
                  if (updatedNode.position) {
                    Object.assign(node.position!, updatedNode.position);
                  }
                  return true; // Keep existing and updated node
                }
                return false; // Delete node
              }
              return true; // Keep existing node if not in updated spec
            });

            // Add new nodes
            for (const updatedNode of spec.data.nodes) {
              if (!(updatedNode as any).delete && !existingNodeMap.has(updatedNode.id)) {
                s.data!.nodes!.push(updatedNode);
              }
            }
          }
          if (spec.data.edges) {
            const existingEdgeMap = new Map(s.data?.edges?.map((e) => [e.id, e]));
            const updatedEdgeMap = new Map(spec.data.edges.map(e => [e.id, e]));

            // Filter out deleted edges and update existing ones
            s.data!.edges = s.data!.edges!.filter(edge => {
              const updatedEdge = updatedEdgeMap.get(edge.id);
              if (updatedEdge) {
                if (!(updatedEdge as any).delete) {
                  Object.assign(edge, updatedEdge);
                  return true; // Keep existing and updated edge
                }
                return false; // Delete edge
              }
              return true; // Keep existing edge if not in updated spec
            });

            // Add new edges
            for (const updatedEdge of spec.data.edges) {
              if (!(updatedEdge as any).delete && !existingEdgeMap.has(updatedEdge.id)) {
                s.data!.edges!.push(updatedEdge);
              }
            }
          }
        }
      })
    );
  };

  return { state, updateState };
}
