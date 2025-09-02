import * as THREE from 'three';
import { Element } from './types';
export declare class ElementActor {
    mesh: THREE.Mesh;
    state: Element;
    private globalState;
    constructor(state: Element, globalState: any);
    private initMesh;
    dispose(): void;
}
