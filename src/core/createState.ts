import { createStore, produce, SetStoreFunction } from 'solid-js/store';
import { Spec, SpecUpdate } from './types';
import { deepMerge } from '../utils/deepMerge';

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
    layout: { type: 'force-directed' },
    camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
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
        // Use the same deep merge utility to apply the updates.
        deepMerge(s, specUpdate);

        // Handle explicit deletions for nodes and edges, which `deepMerge` doesn't cover.
        // An item marked with `delete: true` will be removed from the array.
        if (specUpdate.data?.nodes) {
          const deleteIds = new Set(
            specUpdate.data.nodes.filter((n) => (n as any).delete).map((n) => n.id)
          );
          if (deleteIds.size > 0) {
            s.data.nodes = s.data.nodes.filter((n) => !deleteIds.has(n.id));
          }
        }
        if (specUpdate.data?.edges) {
          const deleteIds = new Set(
            specUpdate.data.edges.filter((e) => (e as any).delete).map((e) => e.id)
          );
          if (deleteIds.size > 0) {
            s.data.edges = s.data.edges.filter((e) => !deleteIds.has(e.id));
          }
        }
      })
    );
  };

  // 4. Return the state and its update functions.
  return { state, updateState, setState: setState as SetStoreFunction<Spec> };
}
