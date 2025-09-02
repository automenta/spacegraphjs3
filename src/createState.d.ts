import { Spec } from './types';
export declare function createState(initialSpec: Spec): {
    state: Spec;
    updateState: (spec: Partial<Spec>) => void;
};
