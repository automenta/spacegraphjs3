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
import { validateSpec, formatValidationResult } from '../utils/specValidation';

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
  private performanceWarningsShown = new Set<string>();
  private lastPerformanceCheck = 0;

  constructor(
    containerSelector: string,
    initialSpec: Spec,
    plugins: ISpaceGraphPlugin[] = []
  ) {
    try {
      // Validate the initial spec
      const validationResult = validateSpec(initialSpec);
      if (!validationResult.isValid) {
        const errorMessage = `Invalid Spec provided:\n${formatValidationResult(validationResult)}`;
        throw new Error(errorMessage);
      }

      // Log warnings in development mode
      if (
        validationResult.warnings.length > 0 &&
        SpaceGraph.isDevelopmentMode()
      ) {
        console.warn(
          'Spec validation warnings:',
          formatValidationResult(validationResult)
        );
      }

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

      // Check for performance issues after initialization
      this.checkPerformanceIssues();
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
   * Checks for potential performance issues after initialization
   */
  private checkPerformanceIssues(): void {
    const nodes = this.state.data.nodes || [];

    if (nodes.length > 0 && nodes.every(node => !node.position)) {
      this.showPerformanceWarning(
        'no-positions',
        '⚠️  Nodes will not be visible until positioned.\n' +
          '💡 Ensure a layout plugin is enabled and running'
      );
    }

    // Check for very high node count with complex node types
    const complexNodes = nodes.filter(
      (node) =>
        node.type === 'custom' ||
        node.type === 'html' ||
        (node.type === 'text' && node.data)
    ).length;

    if (complexNodes > 200) {
      this.showPerformanceWarning(
        'complex-nodes',
        `High number of complex nodes detected: ${complexNodes}.\n` +
          '⚠️  Custom, HTML, and text nodes are more expensive to render.\n' +
          '💡 Consider using simpler node types (sphere, box) for better performance'
      );
    }

    // Check for disabled performance features that should be enabled
    if (
      this.state.performance &&
      this.state.performance.instancingThreshold > 1000 &&
      nodes.length > 500
    ) {
      this.showPerformanceWarning(
        'high-instancing-threshold',
        `Instancing threshold is very high: ${this.state.performance.instancingThreshold}.\n` +
          '⚠️  Consider lowering to 100-200 for better performance with many nodes.\n' +
          '💡 Instanced rendering is more efficient for large numbers of similar objects'
      );
    }
  }

  /**
   * Shows a performance warning, but only once per warning type
   */
  private showPerformanceWarning(warningId: string, message: string): void {
    if (this.performanceWarningsShown.has(warningId)) return;

    this.performanceWarningsShown.add(warningId);
    console.warn(`🚀 Performance Warning [${warningId}]:\n${message}`);
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
      if (SpaceGraph.isDevelopmentMode() && spec.data) {
        const validationResult = validateSpec({
          data: spec.data,
          style: {},
          layout: { type: 'random' },
          camera: {
            target: { x: 0, y: 0, z: 0 },
            phi: 0,
            theta: 0,
            distance: 1,
          },
          controls: {
            keyboard: {
              enabled: false,
              panSpeed: 1,
              zoomSpeed: 1,
              orbitSpeed: 1,
            },
          },
          performance: {
            instancingThreshold: 100,
            enableLOD: false,
            enableCulling: false,
            enableMemoryManagement: false,
            useBasicRenderer: false,
          },
          interaction: { hoveredElementId: null, selectedElementIds: [] },
        });

        if (!validationResult.isValid) {
          console.warn(
            'Spec update validation warnings:',
            formatValidationResult(validationResult)
          );
        }
      }

      this.updateState(spec);
    } catch (error) {
      console.error('Failed to update graph state:', error);
      // Continue with partial update if possible, or skip the update
      return;
    }

    // Notify plugins of state update with graceful degradation
    for (const plugin of this.plugins) {
      if (plugin.onStateUpdate) {
        try {
          plugin.onStateUpdate(spec);
        } catch (error) {
          console.warn(
            `Plugin ${plugin.id} failed to handle state update, continuing without it:`,
            error
          );
          // Continue with other plugins rather than failing completely
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
    // Validate container selector
    if (
      !containerSelector ||
      typeof containerSelector !== 'string' ||
      containerSelector.trim() === ''
    ) {
      throw new Error(
        'Container selector must be a non-empty string.\n' +
          '💡 Valid examples: "#my-container", ".graph-container", "body"'
      );
    }

    // Check if DOM is available
    if (typeof document === 'undefined') {
      throw new Error(
        'DOM is not available. SpaceGraph requires a browser environment.\n' +
          '💡 Make sure this code runs in a browser, not in Node.js'
      );
    }

    // Try to find the container element
    const container = document.querySelector(containerSelector);
    if (!container) {
      const suggestions = [
        `Check if element with selector "${containerSelector}" exists in the DOM`,
        'Verify the selector is correct (case-sensitive)',
        'Ensure the element is not inside a shadow DOM',
        'Try using a different selector like "#app", ".container", or "body"',
      ];

      throw new Error(
        `Container element '${containerSelector}' not found in DOM.\n` +
          '💡 Suggestions:\n' +
          suggestions.map((s) => `   • ${s}`).join('\n')
      );
    }

    // Check if it's actually an HTMLElement
    if (!(container instanceof HTMLElement)) {
      throw new Error(
        `Container element '${containerSelector}' is not an HTMLElement.\n` +
          `💡 Found: ${container.constructor.name}\n` +
          '💡 Container must be a valid HTML element that can hold child elements'
      );
    }

    // Check if container has reasonable dimensions
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn(
        `Container element '${containerSelector}' has zero width or height.\n` +
          '⚠️  This may cause rendering issues. Consider setting explicit dimensions.'
      );
    }

    return container;
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
    // Validate plugins array
    if (!Array.isArray(plugins)) {
      throw new Error(
        'Plugins must be an array of ISpaceGraphPlugin instances.\n' +
          '💡 Pass an empty array [] or an array of plugin instances'
      );
    }

    this.plugins = plugins;
    const initializedPlugins: string[] = [];
    const failedPlugins: Array<{ plugin: ISpaceGraphPlugin; error: Error }> =
      [];

    for (let i = 0; i < this.plugins.length; i++) {
      const plugin = this.plugins[i];

      // Validate plugin structure
      if (!plugin || typeof plugin !== 'object') {
        const error = new Error(
          `Plugin at index ${i} is not a valid object.\n` +
            '💡 Plugins must implement the ISpaceGraphPlugin interface'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (!plugin.id || typeof plugin.id !== 'string') {
        const error = new Error(
          `Plugin at index ${i} is missing a valid id property.\n` +
            '💡 Plugin id must be a non-empty string'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (!plugin.name || typeof plugin.name !== 'string') {
        const error = new Error(
          `Plugin "${plugin.id}" is missing a valid name property.\n` +
            '💡 Plugin name must be a non-empty string'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (!plugin.version || typeof plugin.version !== 'string') {
        const error = new Error(
          `Plugin "${plugin.id}" is missing a valid version property.\n` +
            '💡 Plugin version must be a non-empty string'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (typeof plugin.init !== 'function') {
        const error = new Error(
          `Plugin "${plugin.id}" is missing the required init() method.\n` +
            '💡 Plugins must implement the ISpaceGraphPlugin interface'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      // Check for duplicate plugin IDs
      if (initializedPlugins.includes(plugin.id)) {
        const error = new Error(
          `Duplicate plugin ID "${plugin.id}".\n` +
            '💡 Each plugin must have a unique id'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      try {
        plugin.init(this);
        initializedPlugins.push(plugin.id);

        if (plugin instanceof CameraPlugin) {
          this.cameraPlugin = plugin;
        }

        // Log successful initialization in development mode
        if (SpaceGraph.isDevelopmentMode()) {
          console.log(
            `✅ Plugin "${plugin.id}" (${plugin.name} v${plugin.version}) initialized successfully`
          );
        }
      } catch (error) {
        const initError = new Error(
          `Failed to initialize plugin "${plugin.id}" (${plugin.name} v${plugin.version}).\n` +
            `💡 Error: ${(error as Error).message}\n` +
            '💡 Check plugin dependencies and configuration'
        );
        failedPlugins.push({ plugin, error: initError });
      }
    }

    // If any plugins failed to initialize, throw an error with details
    if (failedPlugins.length > 0) {
      const errorMessages = failedPlugins
        .map(({ error }, index) => {
          return `${index + 1}. ${error.message}`;
        })
        .join('\n\n');

      throw new Error(
        `Failed to initialize ${failedPlugins.length} out of ${plugins.length} plugins:\n\n${errorMessages}\n\n` +
          `✅ ${initializedPlugins.length} plugins initialized successfully: ${initializedPlugins.join(', ')}`
      );
    }
  }

  /**
   * Checks if we're running in development mode
   */
  public static isDevelopmentMode(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }
}
