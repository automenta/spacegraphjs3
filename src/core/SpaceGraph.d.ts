import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { ElementActorClass, LayoutEngineClass, Spec, SpecUpdate, GraphEventMap } from '../types';
import { RenderingManager } from '../managers/RenderingManager';
import { EventManager } from '../managers/EventManager';
import { DataManager } from '../managers/DataManager';
import { ISpaceGraphPlugin } from './plugin';
import { CameraPlugin } from '../plugins/CameraPlugin';
/**
 * The main class for creating and managing a SpaceGraph visualization.
 * It orchestrates the renderer, interaction, layout, and other controllers.
 */
export declare class SpaceGraph {
    private static elementActorRegistry;
    private static layoutEngineRegistry;
    private static instancedGeometryRegistry;
    state: Store<Spec>;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    render: RenderingManager;
    events: EventManager;
    dataManager: DataManager;
    cameraPlugin?: CameraPlugin;
    private readonly container;
    private updateState;
    private setState;
    private plugins;
    private readonly dispose;
    /**
     * Cleans up all resources, including SolidJS effects, Three.js objects,
     * and event listeners, to prevent memory leaks.
     */
    private isDestroyed;
    constructor(containerSelector: string, initialSpec: Spec, plugins?: ISpaceGraphPlugin[]);
    static registerType(name: string, actorClass: ElementActorClass): void;
    static getElementActorRegistry(): Map<string, ElementActorClass>;
    static registerLayout(name: string, engineClass: LayoutEngineClass): void;
    static getLayoutEngineRegistry(): Map<string, LayoutEngineClass>;
    static registerInstancedType(name: string, geometry: THREE.BufferGeometry): void;
    static getInstancedGeometryRegistry(): Map<string, THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>>;
    /**
     * Registers an event listener.
     * @param eventName - The name of the event to listen for.
     * @param listener - The callback function to execute when the event is fired.
     * @returns A function that removes the event listener when called.
     */
    on<Key extends keyof GraphEventMap>(eventName: Key, listener: (payload: GraphEventMap[Key]) => void): () => void;
    /**
     * Retrieves a node or edge by its ID.
     * @param id - The unique identifier of the element.
     * @returns The element's reactive state proxy, or undefined if not found.
     */
    getElement(id: string): import("../types").NodeSpec | import("../types").EdgeSpec | undefined;
    getContainer(): HTMLElement;
    /**
     * Updates the graph with a new (partial) specification.
     * Changes are merged into the existing state, and the visualization updates reactively.
     * @param spec - A partial `Spec` object with the properties to update.
     */
    update(spec: SpecUpdate): void;
    updateStateWithProducer(fn: (prevState: Spec) => Spec): void;
    destroy(): void;
    private initContainer;
    /**
     * Initializes the core reactive state using SolidJS.
     */
    private initReactiveState;
    /**
     * Initializes the core managers for rendering and events.
     */
    private initManagers;
    /**
     * Initializes the plugins.
     */
    private initPlugins;
}
