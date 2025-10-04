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

import { SpaceGraphCore } from './SpaceGraphCore';
import { SpaceGraphPluginManager } from './SpaceGraphPluginManager';
import { SpaceGraphInitialization } from './SpaceGraphInitialization';
import { SpaceGraphStateManager } from './SpaceGraphStateManager';

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

  // Core functionality modules
  private core!: SpaceGraphCore;
  private pluginManager!: SpaceGraphPluginManager;
  private initialization!: SpaceGraphInitialization;
  private stateManager!: SpaceGraphStateManager;

  // Public API properties (delegated to core)
  public state!: Store<Spec>;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public render!: RenderingManager;
  public events!: EventManager;
  public dataManager!: DataManager;
  public cameraPlugin?: CameraPlugin;
  private readonly container!: HTMLElement;
  private readonly dispose!: () => void;
  private isDestroyed = false;

  constructor(
    containerSelector: string,
    initialSpec: Spec,
    plugins: ISpaceGraphPlugin[] = []
  ) {
    try {
      // Initialize modules first
      this.initialization = new SpaceGraphInitialization();
      this.pluginManager = new SpaceGraphPluginManager();
      this.stateManager = new SpaceGraphStateManager();

      // Validate the initial spec
      this.initialization.validateInitialSpec(initialSpec);

      const container = this.initialization.initializeContainer(containerSelector);
      this.container = container;

      this.dispose = createRoot((dispose) => {
        this.initReactiveState(initialSpec);
        this.initManagers(container);
        this.initPlugins(plugins);
        return dispose;
      });

      // Set up public API properties
      this.state = this.stateManager.getState();

      // Check for performance issues after initialization
      this.initialization.checkPerformanceIssues(this.state);
    } catch (error) {
      console.error('Failed to initialize SpaceGraph:', error);
      // Display error in container if available
      try {
        this.initialization.displayInitializationError(containerSelector, error as Error);
      } catch {
        // If initialization failed completely, just log the error
        console.error('Failed to display initialization error:', error);
      }
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
    const layout =
      simpleSpec.layout || SpaceGraph.selectLayoutForDataSize(nodeCount);

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
    const containerSelector =
      typeof container === 'string' ? container : container.id || '#spacegraph';
    return new SpaceGraph(containerSelector, fullSpec, plugins);
  }

  /**
   * Automatically selects the best layout based on data size
   */
  private static selectLayoutForDataSize(
    nodeCount: number
  ): 'force-directed' | 'grid' | 'circle' | 'column' | 'row' | 'random' {
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
    try {
      // Validate the update spec if in development mode
      this.initialization.validateSpecUpdate(spec);

      this.stateManager.updateState(spec);
    } catch (error) {
      console.error('Failed to update graph state:', error);
      // Continue with partial update if possible, or skip the update
      return;
    }

    // Notify plugins of state update with graceful degradation
    this.pluginManager.notifyStateUpdate(spec);
  }

  public updateStateWithProducer(fn: (prevState: Spec) => Spec) {
    this.stateManager.updateStateWithProducer(fn);
  }

  public destroy() {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;

    this.dispose(); // Dispose SolidJS root and all effects
    this.pluginManager.disposePlugins();
    this.render.dispose();
    this.events.dispose();
    this.dataManager.dispose();
  }

  /**
   * Initializes the core reactive state using SolidJS.
   */
  private initReactiveState(initialSpec: Spec) {
    const { state, updateState, setState } = createState(initialSpec);
    this.stateManager.initializeState(state, updateState, setState);
  }

  /**
   * Initializes the core managers for rendering and events.
   */
  private initManagers(container: HTMLElement) {
    const managers = this.initialization.initializeManagers(this, container);
    this.render = managers.render;
    this.events = managers.events;
    this.dataManager = managers.dataManager;
  }

  /**
   * Initializes the plugins.
   */
  private initPlugins(plugins: ISpaceGraphPlugin[] = []) {
    this.pluginManager.initializePlugins(plugins, this);
    this.cameraPlugin = this.pluginManager.getCameraPlugin();
  }

  /**
   * Checks if we're running in development mode
   */
  public static isDevelopmentMode(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }
}
