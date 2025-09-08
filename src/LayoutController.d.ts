import { Store } from 'solid-js/store';
import { Spec } from './types';
export declare class LayoutController {
    private setState;
    private simulation;
    ready: Promise<void>;
    private resolveReady;
    private emit;
    private paused;
    private disposeEffect?;
    private state;
    constructor(state: Store<Spec>, setState: (fn: (prevState: Spec) => Spec) => void, emit: (eventName: string, ...args: any[]) => void);
    init(): void;
    /**
     * Initialize the d3-force simulation.
     */
    private initForceSimulation;
    private stopSimulation;
    resume(): void;
    pause(): void;
    reheat(): void;
    pinNodes(nodeIds: string[]): void;
    unpinNodes(nodeIds: string[]): void;
    dispose(): void;
    tick(iterations?: number): void;
}
