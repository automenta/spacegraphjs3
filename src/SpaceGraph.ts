import * as THREE from 'three';
import { createRoot, createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';
import { Spec, SpecUpdate } from './types';
import { LayoutController } from './LayoutController';
import { CameraController } from './CameraController';
import { InteractionController } from './InteractionController';
import { IRenderer } from './IRenderer';
import { NodeRenderer } from './renderers/NodeRenderer';
import { InstancedRenderer } from './InstancedRenderer';
import { EdgeRenderer } from './EdgeRenderer';
import { HTMLRenderer } from './HTMLRenderer';
import { HUDController } from './HUDController';
import { RenderingManager } from './RenderingManager';
import { EventManager } from './EventManager';

/**
 * The main class for creating and managing a SpaceGraph visualization.
 * It orchestrates the renderer, interaction, layout, and other controllers.
 */
export class SpaceGraph {
  private container: HTMLElement;
  /**
   * The reactive state of the graph, powered by a SolidJS store.
   * Direct modifications to this object will trigger updates in the visualization.
   * @public
   */
  public state!: Store<Spec>;
  private updateState!: (spec: SpecUpdate) => void;
  private setState!: (fn: (prevState: Spec) => Spec) => void;
  public layoutController!: LayoutController;
  private cameraController!: CameraController; // New controller
  private interactionController!: InteractionController;
  private nodeRenderer!: IRenderer;
  private edgeRenderer!: EdgeRenderer;
  private htmlRenderer!: HTMLRenderer;
  private hudController!: HUDController;
  private renderingManager!: RenderingManager;
  private eventManager!: EventManager;
  private dispose: () => void;

  public static registerType(typeName:string, ActorClass: any) {
    NodeRenderer.registerType(typeName, ActorClass);
  }

  public static registerInstancedType(typeName: string, geometry: THREE.BufferGeometry) {
    InstancedRenderer.registerInstancedType(typeName, geometry);
  }

  constructor(containerSelector: string, initialSpec: Spec) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container element '${containerSelector}' not found.`);
    }
    this.container = container as HTMLElement;
    this.eventManager = new EventManager();

    // The `createRoot` ensures that all SolidJS reactivity is properly disposed of
    // when the `destroy` method is called.
    this.dispose = createRoot((dispose) => {
      this.initReactiveState(initialSpec);
      this.renderingManager = new RenderingManager(this.container);
      this.initControllers();
      this.initDynamicRenderer();
      this.initEventListeners();

      // Return the dispose function so it can be called later in `destroy()`
      return dispose;
    });
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
   * Sets up the main controllers for layout, camera, interaction, etc.
   */
  private initControllers() {
    const scene = this.renderingManager.getScene();
    const cssScene = this.renderingManager.getCssScene();
    const camera = this.renderingManager.getCamera();

    // These renderers are simple and don't have complex state,
    // so they can be initialized directly.
    this.edgeRenderer = new EdgeRenderer(scene, this.state);
    this.htmlRenderer = new HTMLRenderer(cssScene, this.state);
    this.hudController = new HUDController(this.container, this.state);

    // The main controllers have more complex logic and dependencies.
    this.cameraController = new CameraController(
      this.state,
      this.updateState,
      this.eventManager.emit.bind(this.eventManager),
      camera
    );

    this.layoutController = new LayoutController(
      this.state,
      this.setState,
      this.eventManager.emit.bind(this.eventManager)
    );
    this.layoutController.init();

    // The NodeRenderer is initialized here, and will be dynamically replaced
    // by the InstancedRenderer if the node count exceeds the threshold.
    this.nodeRenderer = new NodeRenderer(scene, this.state);

    this.interactionController = new InteractionController({
      rendererEl: this.renderingManager.getRendererDomElement(),
      state: this.state,
      updateState: this.updateState,
      threeCamera: camera,
      nodeRenderer: this.nodeRenderer,
      emit: this.eventManager.emit.bind(this.eventManager),
      getElement: this.getElement.bind(this),
    });
  }

  /**
   * Sets up the reactive effect that automatically switches between the default
   * and instanced node renderers based on the number of nodes.
   */
  private initDynamicRenderer() {
    const scene = this.renderingManager.getScene();
    createEffect(() => {
      const nodeCount = this.state.data?.nodes?.length ?? 0;
      const threshold = this.state.performance?.instancingThreshold ?? 100;
      const shouldUseInstanced = nodeCount > threshold;

      const currentRendererType =
        this.nodeRenderer instanceof InstancedRenderer
          ? 'instanced'
          : 'default';

      if (shouldUseInstanced && currentRendererType !== 'instanced') {
        if (this.nodeRenderer) this.nodeRenderer.dispose();
        this.nodeRenderer = new InstancedRenderer(scene, this.state);
        this.interactionController.setNodeRenderer(this.nodeRenderer);
      } else if (!shouldUseInstanced && currentRendererType !== 'default') {
        if (this.nodeRenderer) this.nodeRenderer.dispose();
        this.nodeRenderer = new NodeRenderer(scene, this.state);
        this.interactionController.setNodeRenderer(this.nodeRenderer);
      }
    });
  }

  /**
   * Registers an event listener.
   * @param eventName - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is fired.
   * @returns A function that removes the event listener when called.
   */
  public on(eventName: string, listener: (...args: any[]) => void) {
    return this.eventManager.on(eventName, listener);
  }

  /**
   * Retrieves a node or edge by its ID.
   * @param id - The unique identifier of the element.
   * @returns The element's reactive state proxy, or undefined if not found.
   */
  public getElement(id: string) {
    return this.state.data?.nodes?.find((n) => n.id === id);
  }

  /**
   * Provides access to the layout controller for manual operations.
   */
  public get layout() {
    return this.layoutController;
  }

  /**
   * Provides access to the camera controller for manual operations like `flyTo`.
   */
  public get camera() {
    return this.cameraController;
  }

  /**
   * Initialize all the controllers that manage different parts of the application.
   */
  private initEventListeners() {
    this.eventManager.on('layout:pin', (nodeIds: string[]) => {
      this.layoutController.pinNodes(nodeIds);
    });
    this.eventManager.on('layout:unpin', (nodeIds: string[]) => {
      this.layoutController.unpinNodes(nodeIds);
    });
  }

  /**
   * Updates the graph with a new (partial) specification.
   * Changes are merged into the existing state, and the visualization updates reactively.
   * @param spec - A partial `Spec` object with the properties to update.
   */
  public update(spec: SpecUpdate) {
    this.updateState(spec);
  }

  /**
   * Cleans up all resources, including SolidJS effects, Three.js objects,
   * and event listeners, to prevent memory leaks.
   */
  public destroy() {
    this.dispose(); // Dispose SolidJS root and all effects
    this.interactionController.dispose();
    this.layoutController.dispose();
    this.nodeRenderer.dispose();
    this.edgeRenderer.dispose();
    this.htmlRenderer.dispose();
    this.hudController.dispose();
    this.renderingManager.dispose();
    this.eventManager.dispose();
  }
}
