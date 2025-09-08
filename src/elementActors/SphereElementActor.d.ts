import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Element, Spec } from '../types';
import { BaseElementActor } from './BaseElementActor';
/**
 * An ElementActor for rendering sphere nodes.
 */
export declare class SphereElementActor extends BaseElementActor {
    private elementId;
    constructor(scene: THREE.Scene, elementState: Element, graphState: Store<Spec>);
    init(): void;
    private updateVisuals;
    dispose(): void;
}
