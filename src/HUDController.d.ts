import { Store } from 'solid-js/store';
import { Spec } from './types';
export declare class HUDController {
    private state;
    private hudContainer;
    statsContainer: HTMLDivElement;
    private _dispose;
    constructor(container: HTMLElement, state: Store<Spec>);
    private initStatsDisplay;
    updateStats(): void;
    dispose(): void;
}
