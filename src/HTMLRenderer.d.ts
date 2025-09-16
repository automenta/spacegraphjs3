import { Store } from 'solid-js/store';
import { THREE } from './utils/three';
import { Spec, HtmlElement } from './types';
export declare class HTMLRenderer {
    private cssScene;
    private state;
    private htmlObjects;
    private disposeEffect?;
    constructor(cssScene: THREE.Scene, state: Store<Spec>);
    updateHTMLNodes(htmlNodes?: HtmlElement[]): void;
    dispose(): void;
}
