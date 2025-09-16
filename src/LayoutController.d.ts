import { Store } from 'solid-js/store';
import { Spec } from './types';
export declare class LayoutController {
    private setState;
    ready: Promise<void>;
    private resolveReady;
    private emit;
    private disposeEffect?;
    private state;
    constructor(state: Store<Spec>, setState: (fn: (prevState: Spec) => Spec) => void, emit: (eventName: string, ...args: any[]) => void);
    init(): void;
    pinNodes(nodeIds: string[]): void;
    unpinNodes(nodeIds: string[]): void;
    dispose(): void;
}
