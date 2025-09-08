import { createStore, produce, SetStoreFunction } from 'solid-js/store';
import { Spec, Element } from './types';

// Helper to recursively merge properties from source to target, preserving reactivity
function deepMerge(target: object, source: object) {
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      if (!targetValue || typeof targetValue !== 'object' || Array.isArray(targetValue)) {
        // If target property doesn't exist or is not an object, create it
        target[key] = {};
      }
      deepMerge(target[key], sourceValue);
    } else {
      // Otherwise, assign the value
      target[key] = sourceValue;
    }
  }
}


export function createState(initialSpec: Spec) {
  const [state, setState] = createStore<Spec>({
    ...initialSpec,
    data: {
      nodes: initialSpec.data?.nodes || [],
      edges: initialSpec.data?.edges || [],
    },
    interaction: {
      hoveredElementId: null as string | null,
      selectedElementIds: [] as string[],
      ...initialSpec.interaction,
    },
  });

  const updateState = (spec: Partial<Spec>) => {
    setState(
      produce((s) => {
        // Merge top-level scalar and object properties (camera, style, etc.)
        for (const key in spec) {
          if (key === 'data') continue;
          const k = key as keyof Spec;
          if (spec[k] && typeof spec[k] === 'object' && !Array.isArray(spec[k])) {
            if (!s[k]) (s as any)[k] = {};
            Object.assign(s[k], spec[k]);
          } else {
            (s as any)[k] = spec[k];
          }
        }

        // Handle merging of data arrays (nodes and edges)
        if (spec.data) {
          ['nodes', 'edges'].forEach((key: 'nodes' | 'edges') => {
            if (spec.data![key]) {
              const stateMap = new Map(s.data![key]!.map((item: Element) => [item.id, item]));

              for (const updatedItem of spec.data![key]!) {
                const existingItem = stateMap.get(updatedItem.id);

                if (existingItem) {
                  if ((updatedItem as any).delete) {
                    // Filter out the item to be deleted
                    s.data![key] = s.data![key]!.filter(item => item.id !== updatedItem.id) as any;
                  } else {
                    // Deep merge properties into the existing item
                    deepMerge(existingItem, updatedItem);
                  }
                } else if (!(updatedItem as any).delete) {
                  // Add new item if it doesn't exist
                  s.data![key]!.push(updatedItem as any);
                }
              }
            }
          });
        }
      })
    );
  };

  return { state, updateState, setState: setState as SetStoreFunction<Spec> };
}
