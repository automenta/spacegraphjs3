import { THREE } from '../utils/three';
import { Store } from 'solid-js/store';
import { Spec, GraphElement } from '../types';
import { IRenderer } from '../IRenderer';
import { BaseElementActor } from '../elementActors/BaseElementActor';
type ElementActorConstructor = new (scene: THREE.Scene, elementState: Store<GraphElement>, graphState: Store<Spec>) => BaseElementActor;
/**
 * Manages the rendering of all nodes in the graph using ElementActors.
 * It instantiates the correct actor based on the node's type and orchestrates their lifecycle.
 */
export declare class NodeRenderer implements IRenderer {
    private scene;
    private state;
    private elementActors;
    private static registeredElementTypes;
    private disposeEffect?;
    constructor(scene: THREE.Scene, state: Store<Spec>);
    /**
     * Registers a new element type with its corresponding ElementActor class.
     * This allows for extending SpaceGraph with custom node rendering.
     * @param typeName - The name of the element type (e.g., 'sphere', 'html').
     * @param ActorClass - The ElementActor class responsible for rendering this type.
     */
    static registerType(typeName: string, ActorClass: ElementActorConstructor): void;
    private init;
    private addElementActor;
    private removeElementActor;
    getRaycastableObjects(): THREE.Object3D[];
    getNodeIdFromIntersection(intersection: THREE.Intersection): string | null;
    dispose(): void;
}
export {};
