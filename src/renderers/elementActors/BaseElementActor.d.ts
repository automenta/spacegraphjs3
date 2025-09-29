import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
/**
 * Base class for all Element Actors.
 * An ElementActor is responsible for creating and managing the Three.js object
 * for a single graph element (node or edge) and reacting to its state changes.
 */
export declare abstract class BaseElementActor {
    protected scene: THREE.Scene;
    protected elementState: Store<NodeSpec>;
    protected graphState: Store<Spec>;
    protected threeObject: THREE.Object3D | null;
    protected disposeEffect: (() => void) | null;
    constructor(scene: THREE.Scene, elementState: Store<NodeSpec>, graphState: Store<Spec>);
    /**
     * Initializes the actor, creates its Three.js object, and sets up reactive effects.
     */
    abstract init(): void;
    /**
     * Returns the Three.js object managed by this actor for raycasting.
     */
    getRaycastableObject(): THREE.Object3D | null;
    /**
     * Cleans up all resources, including Three.js objects and SolidJS effects.
     */
    dispose(): void;
}
