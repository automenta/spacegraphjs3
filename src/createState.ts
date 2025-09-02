// src/createState.ts
import { createStore, produce } from 'solid-js/store';
import { Spec } from './types';

export function createState(initialSpec: Spec) {
  const [state, setState] = createStore<Spec>({
    ...initialSpec,
    interaction: {
      hoveredElementId: null as string | null,
      selectedElementIds: [] as string[],
    },
  });

  const updateState = (spec: Partial<Spec>) => {
    setState(
      produce((s) => {
        // Deep merge for nested objects like 'layout' or 'style'
        for (const key in spec) {
          if (key === 'data') continue;

          // Handle interaction specifically to ensure type safety
          if (key === 'interaction') {
            if (spec.interaction) {
              s.interaction = { ...s.interaction, ...spec.interaction };
            }
            continue;
          }

          const specValue = spec[key as keyof Partial<Spec>];
          const sValue = s[key as keyof Spec];

          if (typeof sValue === 'object' && sValue !== null && typeof specValue === 'object' && specValue !== null) {
            // If both are objects, deep merge
            Object.assign(sValue, specValue);
          } else if (specValue !== undefined) {
            // Otherwise, directly assign if specValue is not undefined
            s[key as keyof Spec] = specValue as any; // Use any for direct assignment to handle various types
          }
        }

        if (s.data && s.data.nodes && spec.data?.nodes) { // Added s.data.nodes check
          const nodeMap = new Map(s.data.nodes.map((n: import("./types").Element) => [n.id, n]));
          
          for (const updatedNode of spec.data.nodes) {
            if (updatedNode.delete) {
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
          s.data.nodes = Array.from(nodeMap.values());
        }
        
        // (Edge update logic would go here)
      })
    );
  };

  return { state, updateState };
}