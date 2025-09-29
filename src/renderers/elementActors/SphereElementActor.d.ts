import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';
/**
 * An ElementActor for rendering sphere nodes.
 */
export declare class SphereElementActor extends BaseElementActor {
    protected readonly elementId: string;
    private glowMesh;
    constructor(scene: THREE.Scene, elementState: Store<NodeSpec>, graphState: Store<Spec>);
    init(): void;
    getRaycastableObject(): THREE.Object3D | null;
    update(): void;
    dispose(): void;
    private updateVisuals;
}
