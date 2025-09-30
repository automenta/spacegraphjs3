import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';
import {
  ElementActorClass,
  LayoutEngineClass,
  Spec,
  SpecUpdate,
  GraphEventMap,
} from '../types';
import { RenderingManager } from '../managers/RenderingManager';
import { EventManager } from '../managers/EventManager';
import { DataManager } from '../managers/DataManager';
import { ISpaceGraphPlugin } from './plugin';
import { CameraPlugin } from '../plugins/CameraPlugin';
import { SphereElementActor } from '../renderers/elementActors/SphereElementActor';
import { BoxElementActor } from '../renderers/elementActors/BoxElementActor';
import { CustomGeometryActor } from '../renderers/elementActors/CustomGeometryActor';
import { TextElementActor } from '../renderers/elementActors/TextElementActor';
import { HtmlNodeElementActor } from '../renderers/elementActors/HtmlNodeElementActor';
import { D3ForceLayout } from '../layouts/D3ForceLayout';
import { RandomLayout } from '../layouts/RandomLayout';
import { GridLayout } from '../layouts/GridLayout';
import { CircleLayout } from '../layouts/CircleLayout';
import { ColumnLayout } from '../layouts/ColumnLayout';
import { RowLayout } from '../layouts/RowLayout';
import { registerLayouts } from '../layouts/registerLayouts';

/**
 * The main class for creating and managing a SpaceGraph visualization.
 * It orchestrates the renderer, interaction, layout, and other controllers.
 */
export class SpaceGraph {
  private static elementActorRegistry: Map<string, ElementActorClass> = new Map();
  
  // Initialize the registry with default element actors
  static {
    SpaceGraph.elementActorRegistry.set('sphere', SphereElementActor);
    SpaceGraph.elementActorRegistry.set('box', BoxElementActor);
    SpaceGraph.elementActorRegistry.set('custom', CustomGeometryActor);
    SpaceGraph.elementActorRegistry.set('text', TextElementActor);
    SpaceGraph.elementActorRegistry.set('html', HtmlNodeElementActor);
  }
  private static layoutEngineRegistry: Map<string, LayoutEngineClass> = new Map();
  
  // Initialize the registry with default layout engines
  static {
    // Delay layout registration until after class is fully defined to avoid circular dependency
    if (typeof window !== 'undefined') {
      // In browser environment, register layouts after class definition
      setTimeout(() => {
        try {
          registerLayouts();
        } catch (error) {
          console.warn('Failed to register layouts:', error);
        }
      }, 0);
    } else {
      // In Node.js environment, register immediately
      try {
        registerLayouts();
      } catch (error) {
        console.warn('Failed to register layouts:', error);
      }
    }
  }
  private static instancedGeometryRegistry: Map<string, THREE.BufferGeometry> =
    new Map([['sphere', new THREE.SphereGeometry(0.5, 32, 32)]]);
  public state!: Store<Spec>;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public render!: RenderingManager;
  public events!: EventManager;
  public dataManager!: DataManager;
  public cameraPlugin?: CameraPlugin;
  private readonly container: HTMLElement;
  private updateState!: (spec: SpecUpdate) => void;
  private setState!: (fn: (prevState: Spec) => Spec) => void;
  private plugins: ISpaceGraphPlugin[] = [];
  private readonly dispose: () => void;
  /**
   * Cleans up all resources, including SolidJS effects, Three.js objects,
   * and event listeners, to prevent memory leaks.
   */
  private isDestroyed = false;

  constructor(
    containerSelector: string,
    initialSpec: Spec,
    plugins: ISpaceGraphPlugin[] = []
  ) {
    try {
      const container = this.initContainer(containerSelector);
      this.container = container;

      this.dispose = createRoot((dispose) => {
        this.initReactiveState(initialSpec);
        this.initManagers();
        this.initPlugins(plugins);
        return dispose;
      });

      this.scene = this.render.getScene();
      this.camera = this.render.getCamera();
    } catch (error) {
      console.error('Failed to initialize SpaceGraph:', error);
      // If we have a container reference, display the error in it
      const container = document.querySelector(containerSelector) as HTMLElement;
      if (container) {
        container.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">
          <h2>Failed to initialize</h2>
          <p>${(error as Error).message}</p>
          <pre>${(error as Error).stack}</pre>
        </div>`;
      }
      // Re-throw the error to allow the caller to handle it.
      throw error;
    }
  }

  public static registerType(name: string, actorClass: ElementActorClass) {
    SpaceGraph.elementActorRegistry.set(name, actorClass);
  }

  public static getElementActorRegistry() {
    return SpaceGraph.elementActorRegistry;
  }

  public static registerLayout(name: string, engineClass: LayoutEngineClass) {
    SpaceGraph.layoutEngineRegistry.set(name, engineClass);
  }

  public static getLayoutEngineRegistry() {
    return SpaceGraph.layoutEngineRegistry;
  }

  public static registerInstancedType(
    name: string,
    geometry: THREE.BufferGeometry
  ) {
    SpaceGraph.instancedGeometryRegistry.set(name, geometry);
  }

  public static getInstancedGeometryRegistry() {
    return SpaceGraph.instancedGeometryRegistry;
  }

  /**
   * Registers an event listener.
   * @param eventName - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is fired.
   * @returns A function that removes the event listener when called.
   */
  public on<Key extends keyof GraphEventMap>(
    eventName: Key,
    listener: (payload: GraphEventMap[Key]) => void
  ) {
    return this.events.on(eventName, listener);
  }

  /**
   * Retrieves a node or edge by its ID.
   * @param id - The unique identifier of the element.
   * @returns The element's reactive state proxy, or undefined if not found.
   */
  public getElement(id: string) {
    return this.dataManager.getElement(id);
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Updates the graph with a new (partial) specification.
   * Changes are merged into the existing state, and the visualization updates reactively.
   * @param spec - A partial `Spec` object with the properties to update.
   */
  public update(spec: SpecUpdate) {
    this.updateState(spec);
    
    // Notify plugins of state update
    for (const plugin of this.plugins) {
      if (plugin.onStateUpdate) {
        try {
          plugin.onStateUpdate(spec);
        } catch (error) {
          console.error(`Error in plugin ${plugin.id} onStateUpdate:`, error);
        }
      }
    }
  }

  public updateStateWithProducer(fn: (prevState: Spec) => Spec) {
    this.setState(fn);
  }

  public destroy() {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;

    this.dispose(); // Dispose SolidJS root and all effects
    // Dispose all registered plugins.
    // This includes the cameraPlugin, which is stored separately for convenience
    // but is part of the main plugins array.
    for (const plugin of this.plugins) {
      if (plugin.dispose) {
        plugin.dispose();
      }
    }
    this.render.dispose();
    this.events.dispose();
    this.dataManager.dispose();
  }

  private initContainer(containerSelector: string): HTMLElement {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container element '${containerSelector}' not found.`);
    }
    return container as HTMLElement;
  }

  /**
   * Initializes the core reactive state using SolidJS.
   */
  private initReactiveState(initialSpec: Spec) {
    const { state, updateState, setState } = createState(initialSpec);
    this.state = state;
    this.updateState = updateState;
    this.setState = setState;
  }

  /**
   * Initializes the core managers for rendering and events.
   */
  private initManagers() {
    this.render = new RenderingManager(this, this.container);
    this.events = new EventManager();
    this.dataManager = new DataManager(this);
    
    // Initialize rendering optimizer after event manager is available
    this.render.initRenderingOptimizer();
  }

  /**
   * Initializes the plugins.
   */
  private initPlugins(plugins: ISpaceGraphPlugin[] = []) {
    this.plugins = plugins;
    for (const plugin of this.plugins) {
      try {
        plugin.init(this);
        if (plugin instanceof CameraPlugin) {
          this.cameraPlugin = plugin;
        }
      } catch (error) {
        throw new Error(`Error initializing plugin: ${(error as Error).message}`);
      }
    }
  }
}
