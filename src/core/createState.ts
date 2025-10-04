import { createStore, produce, SetStoreFunction } from 'solid-js/store';
import { Spec, SpecUpdate } from '../types';
import { deepMerge } from '../utils/DeepMerge';

/**
 * Creates the reactive state management object for the SpaceGraph.
 * This includes the central state store and functions to update it.
 *
 * @param initialSpec - The initial configuration and data for the graph.
 * @returns An object containing the reactive `state`, an `updateState` function
 *          for applying partial updates, and the raw `setState` function from SolidJS.
 */
export function createState(initialSpec: Spec) {
  // 1. Define the default structure for the specification.
  const defaults: Spec = {
    data: { nodes: [], edges: [] },
    interaction: { hoveredElementId: null, selectedElementIds: [] },
    style: {},
    layout: { type: 'random' },
    camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
    performance: { instancingThreshold: 100 },
    controls: {
      keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 },
    },
  };

  // 2. Deep merge the user-provided initial spec into the defaults.
  const initialState = deepMerge(defaults, initialSpec);

  // 3. Create the SolidJS store.
  const [state, setState] = createStore<Spec>(initialState);

  /**
   * Applies a partial update to the state. This function uses `produce`
   * from `solid-js/store` to apply immutable updates efficiently.
   *
   * @param specUpdate - The partial specification of what to change.
   */
  const updateState = (specUpdate: SpecUpdate) => {
    setState(
      produce((s) => {
        // Use deep merge for all top-level properties except 'data'
        for (const key in specUpdate) {
          if (key !== 'data' && key in s) {
            const updateValue = specUpdate[key as keyof SpecUpdate];
            if (
              updateValue !== undefined &&
              updateValue !== null &&
              typeof updateValue === 'object'
            ) {
              deepMerge(s[key as keyof Spec] as any, updateValue as any);
            }
          }
        }

        // Handle data updates separately for fine-grained control
        if (specUpdate.data) {
          // Add new nodes
          if (specUpdate.data.nodes?.add) {
            s.data.nodes.push(...specUpdate.data.nodes.add);
          }
          // Update existing nodes
          if (specUpdate.data.nodes?.update) {
            const updates = new Map(
              specUpdate.data.nodes.update.map((n) => [n.id, n])
            );
            for (let i = 0; i < s.data.nodes.length; i++) {
              if (updates.has(s.data.nodes[i].id)) {
                const update = updates.get(s.data.nodes[i].id);
                if (update) {
                  deepMerge(s.data.nodes[i], update);
                }
              }
            }
          }
          // Remove nodes
          if (specUpdate.data.nodes?.remove) {
            const removeIds = new Set(specUpdate.data.nodes.remove);
            s.data.nodes = s.data.nodes.filter((n) => !removeIds.has(n.id));
          }

          // Add new edges
          if (specUpdate.data.edges?.add) {
            s.data.edges.push(...specUpdate.data.edges.add);
          }
          // Update existing edges
          if (specUpdate.data.edges?.update) {
            const updates = new Map(
              specUpdate.data.edges.update.map((e) => [e.id, e])
            );
            for (let i = 0; i < s.data.edges.length; i++) {
              if (updates.has(s.data.edges[i].id)) {
                const update = updates.get(s.data.edges[i].id);
                if (update) {
                  deepMerge(s.data.edges[i], update);
                }
              }
            }
          }
          // Remove edges
          if (specUpdate.data.edges?.remove) {
            const removeIds = new Set(specUpdate.data.edges.remove);
            s.data.edges = s.data.edges.filter((e) => !removeIds.has(e.id));
          }
        }
      })
    );
  };

  // 4. Return the state and its update functions.
  return { state, updateState, setState: setState as SetStoreFunction<Spec> };
}
