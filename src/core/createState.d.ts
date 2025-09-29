import { SetStoreFunction } from 'solid-js/store';
import { Spec, SpecUpdate } from '../types';
/**
 * Creates the reactive state management object for the SpaceGraph.
 * This includes the central state store and functions to update it.
 *
 * @param initialSpec - The initial configuration and data for the graph.
 * @returns An object containing the reactive `state`, an `updateState` function
 *          for applying partial updates, and the raw `setState` function from SolidJS.
 */
export declare function createState(initialSpec: Spec): {
    state: Spec;
    updateState: (specUpdate: SpecUpdate) => void;
    setState: SetStoreFunction<Spec>;
};
