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
  SimpleSpec,
} from '../types';
import { RenderingManager } from '../managers/RenderingManager';
import { EventManager } from '../managers/EventManager';
import { DataManager } from '../managers/DataManager';
import { ISpaceGraphPlugin } from './plugin';
import { CameraPlugin } from '../plugins/CameraPlugin';
import { LayoutPlugin } from '../plugins/LayoutPlugin';
import { InteractionPlugin } from '../plugins/InteractionPlugin';
import { SphereElementActor } from '../renderers/elementActors/SphereElementActor';
import { BoxElementActor } from '../renderers/elementActors/BoxElementActor';
import { CustomGeometryActor } from '../renderers/elementActors/CustomGeometryActor';
import { TextElementActor } from '../renderers/elementActors/TextElementActor';
import { HtmlNodeElementActor } from '../renderers/elementActors/HtmlNodeElementActor';
import { D3ForceLayout as _D3ForceLayout } from '../layouts/D3ForceLayout';
import { RandomLayout as _RandomLayout } from '../layouts/RandomLayout';
import { GridLayout as _GridLayout } from '../layouts/GridLayout';
import { CircleLayout as _CircleLayout } from '../layouts/CircleLayout';
import { ColumnLayout as _ColumnLayout } from '../layouts/ColumnLayout';
import { RowLayout as _RowLayout } from '../layouts/RowLayout';
import { registerLayouts } from '../layouts/registerLayouts';

/**
 * The main class for creating and managing a SpaceGraph visualization.
 * It orchestrates the renderer, interaction, layout, and other controllers.
 */
export class SpaceGraph {
  private static elementActorRegistry: Map<string, ElementActorClass> =
    new Map();

  // Initialize the registry with default element actors
  static {
    SpaceGraph.elementActorRegistry.set('sphere', SphereElementActor);
    SpaceGraph.elementActorRegistry.set('box', BoxElementActor);
    SpaceGraph.elementActorRegistry.set('custom', CustomGeometryActor);
    SpaceGraph.elementActorRegistry.set('text', TextElementActor);
    SpaceGraph.elementActorRegistry.set('html', HtmlNodeElementActor);
  }
  private static layoutEngineRegistry: Map<string, LayoutEngineClass> =
    new Map();

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
      const container = document.querySelector(
        containerSelector
      ) as HTMLElement;
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
  /**
   * Factory method for creating a SpaceGraph instance with simplified configuration.
   * Automatically sets up default plugins, layout, camera positioning, and styling.
   * @param simpleSpec - Simplified specification with minimal required configuration
   * @returns A fully configured SpaceGraph instance
   */
  public static create(simpleSpec: SimpleSpec): SpaceGraph {
    // Extract container
    const container = simpleSpec.container || '#spacegraph';

    // Auto-select layout based on data size
    const nodeCount = simpleSpec.nodes?.length || 0;
    const layout = simpleSpec.layout || SpaceGraph.selectLayoutForDataSize(nodeCount);

    // Create full spec with defaults
    const fullSpec: Spec = {
      data: {
        nodes: simpleSpec.nodes || [],
        edges: simpleSpec.edges || [],
        groups: simpleSpec.groups,
      },
      style: SpaceGraph.getDefaultStyling(),
      layout: SpaceGraph.createLayoutSpec(layout),
      camera: SpaceGraph.createDefaultCameraSpec(),
      controls: {
        keyboard: {
          enabled: true,
          panSpeed: 1.0,
          zoomSpeed: 0.1,
          orbitSpeed: 0.01,
        },
      },
      performance: {
        instancingThreshold: 100,
        enableLOD: true,
        enableCulling: true,
        enableMemoryManagement: true,
        useBasicRenderer: simpleSpec.useBasicRenderer || false,
      },
      interaction: {
        hoveredElementId: null,
        selectedElementIds: [],
      },
    };

    // Apply custom overrides
    if (simpleSpec.style) {
      Object.assign(fullSpec.style, simpleSpec.style);
    }
    if (simpleSpec.camera) {
      Object.assign(fullSpec.camera, simpleSpec.camera);
    }

    // Create default plugins
    const plugins = [
      new LayoutPlugin(),
      new CameraPlugin(),
      new InteractionPlugin(),
    ];

    // Create and return the SpaceGraph instance
    const containerSelector = typeof container === 'string' ? container : container.id || '#spacegraph';
    return new SpaceGraph(containerSelector, fullSpec, plugins);
  }

  /**
   * Automatically selects the best layout based on data size
   */
  private static selectLayoutForDataSize(nodeCount: number): 'force-directed' | 'grid' | 'circle' | 'column' | 'row' | 'random' {
    if (nodeCount === 0) return 'random';
    if (nodeCount <= 10) return 'force-directed';
    if (nodeCount <= 50) return 'circle';
    if (nodeCount <= 200) return 'grid';
    return 'column'; // For very large datasets
  }

  /**
   * Creates a layout specification from a layout type
   */
  private static createLayoutSpec(layoutType: string): any {
    switch (layoutType) {
      case 'force-directed':
        return { type: 'force-directed', charge: -300, linkDistance: 50 };
      case 'grid':
        return { type: 'grid', dimensions: 3, spacing: 2 };
      case 'circle':
        return { type: 'circle', radius: 10 };
      case 'column':
        return { type: 'column', spacing: 2, columns: 5 };
      case 'row':
        return { type: 'row', spacing: 2, rows: 5 };
      case 'random':
      default:
        return { type: 'random' };
    }
  }

  /**
   * Creates default camera specification with zero-config positioning
   */
  private static createDefaultCameraSpec(): any {
    return {
      target: { x: 0, y: 0, z: 0 },
      phi: Math.PI / 4, // 45 degrees
      theta: Math.PI / 4, // 45 degrees
      distance: 50,
    };
  }

  /**
   * Returns default styling presets
   */
  private static getDefaultStyling(): any {
    return {
      'node:hover': {
        color: '#ff6b6b',
        glow: { color: '#ff6b6b', strength: 0.5 },
      },
      'node:selected': {
        color: '#4ecdc4',
        glow: { color: '#4ecdc4', strength: 0.7 },
      },
      'edge:hover': {
        color: '#ffa726',
        width: 3,
        glow: { color: '#ffa726', strength: 0.3 },
      },
      'edge:selected': {
        color: '#ab47bc',
        width: 3,
        glow: { color: '#ab47bc', strength: 0.5 },
      },
    };
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
        throw new Error(
          `Error initializing plugin: ${(error as Error).message}`
        );
      }
    }
  }
}
