import { createStore, produce, SetStoreFunction } from 'solid-js/store';
import { Spec, SpecUpdate } from './types';

// A more controlled deep merge that handles array updates by ID
function deepMerge(target: any, source: any) {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (key === 'selectedElementIds' && Array.isArray(sourceValue)) {
        // Always create a new array for selectedElementIds to ensure reactivity.
        target[key] = [...sourceValue];
      } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        // Handle node/edge array updates by ID.
        // This is a simplified merge; a real implementation might need more
        // robust logic for additions, removals, and updates.
        const targetMap = new Map(
          targetValue.map((item: any) => [item.id, item])
        );
        for (const item of sourceValue) {
          const existingItem = targetMap.get(item.id);
          if (existingItem) {
            // Merge into existing item
            deepMerge(existingItem, item);
          } else {
            // Add new item
            targetValue.push(item);
          }
        }
      } else if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        // Recurse for nested objects
        if (
          !targetValue ||
          typeof targetValue !== 'object' ||
          Array.isArray(targetValue)
        ) {
          target[key] = {};
        }
        deepMerge(target[key], sourceValue);
      } else if (sourceValue !== undefined) {
        // Overwrite primitive values
        target[key] = sourceValue;
      }
    }
  }
}

export function createState(initialSpec: Spec) {
  // Establish a default spec structure and merge the initial spec into it
  const defaults: Spec = {
    data: {
      nodes: [],
      edges: [],
    },
    interaction: {
      hoveredElementId: null,
      selectedElementIds: [],
    },
    style: {},
    layout: { type: 'force-directed' },
    camera: {
      target: { x: 0, y: 0, z: 0 },
      phi: 0,
      theta: 0,
      distance: 10,
    },
  };

  deepMerge(defaults, initialSpec);

  const [state, setState] = createStore<Spec>(defaults);

  const updateState = (spec: SpecUpdate) => {
    setState(
      produce((s) => {
        deepMerge(s, spec);

        // Handle deletions, which are not covered by the merge
        if (spec.data?.nodes) {
          const deleteIds = new Set(
            spec.data.nodes.filter((n) => (n as any).delete).map((n) => n.id)
          );
          if (deleteIds.size > 0) {
            s.data.nodes = s.data.nodes.filter((n) => !deleteIds.has(n.id));
          }
        }
        if (spec.data?.edges) {
          const deleteIds = new Set(
            spec.data.edges.filter((e) => (e as any).delete).map((e) => e.id)
          );
          if (deleteIds.size > 0) {
            s.data.edges = s.data.edges.filter((e) => !deleteIds.has(e.id));
          }
        }
      })
    );
  };

  return { state, updateState, setState: setState as SetStoreFunction<Spec> };
}
