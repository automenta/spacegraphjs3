import { SetStoreFunction } from 'solid-js/store';
import { Spec, SpecUpdate } from './types';
export declare function createState(initialSpec: Spec): {
    state: Spec;
    updateState: (spec: SpecUpdate) => void;
    setState: SetStoreFunction<Spec>;
};
