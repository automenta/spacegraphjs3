import { Store } from 'solid-js/store';
import { Spec } from './types';
export declare class SpaceGraph {
    private container;
    state: Store<Spec>;
    private updateState;
    private scene;
    private camera;
    private renderer;
    private actors;
    private dispose;
    constructor(containerSelector: string, initialSpec: Spec);
    private raycaster;
    private pointer;
    private interactionCleanup;
    private initInteraction;
    private initRenderer;
    private initScene;
    private initReactiveScene;
    update(spec: Partial<Spec>): void;
    private animate;
    destroy(): void;
}
