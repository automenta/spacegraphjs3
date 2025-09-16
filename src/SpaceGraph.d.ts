import { THREE } from './utils/three';
import { Store } from 'solid-js/store';
import { Spec, SpecUpdate } from './types';
import { LayoutController } from './LayoutController';
import { CameraController } from './CameraController';
/**
 * The main class for creating and managing a SpaceGraph visualization.
 * It orchestrates the renderer, interaction, layout, and other controllers.
 */
export declare class SpaceGraph {
    private container;
    /**
     * The reactive state of the graph, powered by a SolidJS store.
     * Direct modifications to this object will trigger updates in the visualization.
     * @public
     */
    state: Store<Spec>;
    private updateState;
    private setState;
    private scene;
    private cssScene;
    private threeCamera;
    private renderer;
    private cssRenderer;
    layoutController: LayoutController;
    private cameraController;
    private interactionController;
    private nodeRenderer;
    private edgeRenderer;
    private htmlRenderer;
    private hudController;
    private dispose;
    private eventListeners;
    isInitialized: boolean;
    static registerType(typeName: string, ActorClass: any): void;
    static registerInstancedType(typeName: string, geometry: THREE.BufferGeometry): void;
    constructor(containerSelector: string, initialSpec: Spec);
    private emit;
    /**
     * Registers an event listener.
     * @param eventName - The name of the event to listen for.
     * @param listener - The callback function to execute when the event is fired.
     * @returns A function that removes the event listener when called.
     */
    on(eventName: string, listener: (...args: any[]) => void): () => void;
    /**
     * Retrieves a node or edge by its ID.
     * @param id - The unique identifier of the element.
     * @returns The element's reactive state proxy, or undefined if not found.
     */
    getElement(id: string): import("./types").GraphElement | undefined;
    /**
     * Provides access to the layout controller for manual operations.
     */
    get layout(): LayoutController;
    /**
     * Provides access to the camera controller for manual operations like `flyTo`.
     */
    get camera(): CameraController;
    /**
     * Initialize all the controllers that manage different parts of the application.
     * @param emit - The event emitter function.
     */
    private initEventListeners;
    private initRenderers;
    private initScenes;
    /**
     * Updates the graph with a new (partial) specification.
     * Changes are merged into the existing state, and the visualization updates reactively.
     * @param spec - A partial `Spec` object with the properties to update.
     */
    update(spec: SpecUpdate): void;
    private handleResize;
    private animate;
    /**
     * Cleans up all resources, including SolidJS effects, Three.js objects,
     * and event listeners, to prevent memory leaks.
     */
    destroy(): void;
}
