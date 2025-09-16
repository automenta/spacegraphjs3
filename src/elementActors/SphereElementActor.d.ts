import { THREE } from '../utils/three';
import { Store } from 'solid-js/store';
import { GraphElement, Spec } from '../types';
import { BaseElementActor } from './BaseElementActor';
/**
 * An ElementActor for rendering sphere nodes.
 */
export declare class SphereElementActor extends BaseElementActor {
    private elementId;
    constructor(scene: THREE.Scene, elementState: Store<GraphElement>, graphState: Store<Spec>);
    init(): void;
    private updateVisuals;
    dispose(): void;
}
