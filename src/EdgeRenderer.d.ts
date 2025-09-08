import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec } from './types';
export declare class EdgeRenderer {
    private scene;
    private state;
    lineSegments: THREE.LineSegments;
    private material;
    private geometry;
    private disposeEffect?;
    constructor(scene: THREE.Scene, state: Store<Spec>);
    updateEdges(nodes?: any, edges?: any): void;
    dispose(): void;
}
