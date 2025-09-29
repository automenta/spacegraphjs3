import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { EdgeSpec, NodeSpec, Spec } from '../types';
export declare class EdgeRenderer {
    lineSegments: THREE.LineSegments;
    private scene;
    private state;
    private readonly material;
    private readonly geometry;
    private disposeEffect?;
    constructor(scene: THREE.Scene, state: Store<Spec>);
    updateEdges(nodes?: NodeSpec[], edges?: EdgeSpec[]): void;
    dispose(): void;
}
