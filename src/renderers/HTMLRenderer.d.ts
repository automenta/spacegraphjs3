import { Store } from 'solid-js/store';
import * as THREE from 'three';
import { HtmlNodeSpec, Spec } from '../types';
export declare class HTMLRenderer {
    private cssScene;
    private state;
    private htmlObjects;
    private disposeEffect?;
    constructor(cssScene: THREE.Scene, state: Store<Spec>);
    updateHTMLNodes(htmlNodes?: HtmlNodeSpec[]): void;
    dispose(): void;
}
