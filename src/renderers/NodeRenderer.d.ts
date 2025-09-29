import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { ElementActorClass, Spec } from '../types';
import { IRenderer } from './IRenderer';
import { BaseElementActor } from './elementActors/BaseElementActor';
/**
 * Manages the rendering of all nodes in the graph using ElementActors.
 * It instantiates the correct actor based on the node's type and orchestrates their lifecycle.
 */
export declare class NodeRenderer implements IRenderer {
    elementActors: Map<string, BaseElementActor>;
    private readonly scene;
    private readonly state;
    private elementActorRegistry;
    private disposeEffect?;
    constructor(scene: THREE.Scene, state: Store<Spec>, elementActorRegistry: Map<string, ElementActorClass>);
    updateNodes(): void;
    getRaycastableObjects(): THREE.Object3D[];
    getNodeIdFromIntersection(intersection: THREE.Intersection): string | null;
    dispose(): void;
    private init;
    private addElementActor;
    private removeElementActor;
}
