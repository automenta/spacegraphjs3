import { SpaceGraph, Spec } from '../../src';
export declare const createTestGraph: (initialSpec: Spec) => {
    graph: SpaceGraph;
    container: HTMLDivElement;
    cleanup: () => void;
};
export declare const nextTick: () => Promise<unknown>;
