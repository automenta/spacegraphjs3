import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';
import { Spec } from './types';
import { LayoutController } from './LayoutController';
import { CameraController } from './CameraController';
import { InteractionController } from './InteractionController';
import { IRenderer } from './IRenderer';
import { NodeRenderer } from './renderers/NodeRenderer';
import { EdgeRenderer } from './EdgeRenderer';
import { HTMLRenderer } from './HTMLRenderer';
import { HUDController } from './HUDController';

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
  public state: Store<Spec>;
  private updateState: (spec: Partial<Spec>) => void;
  private scene: THREE.Scene;
  private cssScene: THREE.Scene;
  private threeCamera: THREE.PerspectiveCamera; // Renamed from 'camera'
  private renderer: THREE.WebGLRenderer | null = null;
  private cssRenderer: CSS3DRenderer | null = null;
  public layoutController: LayoutController;
  private cameraController: CameraController; // New controller
  private interactionController: InteractionController;
  private nodeRenderer: NodeRenderer;
  private edgeRenderer: EdgeRenderer;
  private htmlRenderer: HTMLRenderer;
  private hudController: HUDController;
  private dispose: () => void;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  public static registerType(typeName: string, ActorClass: any) {
    NodeRenderer.registerType(typeName, ActorClass);
  }

  /**
   * Creates a new SpaceGraph instance.
   * @param containerSelector - The CSS selector for the container element.
   * @param initialSpec - The initial specification for the graph.
   */
  constructor(containerSelector: string, initialSpec: Spec) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container element '${containerSelector}' not found.`);
    }
    this.container = container as HTMLElement;

    // The createRoot ensures all SolidJS reactivity is disposed of properly
    this.dispose = createRoot((dispose) => {
      // Create the reactive state using a SolidJS store
      const { state, updateState } = createState(initialSpec);
      this.state = state;
      this.updateState = updateState;

      // Initialize the three.js renderer and scene
      this.initRenderers();
      this.initScenes();

      // Create the node renderer
      this.nodeRenderer = new NodeRenderer(this.scene, this.state);
      this.edgeRenderer = new EdgeRenderer(this.scene, this.state);
      this.htmlRenderer = new HTMLRenderer(this.cssScene, this.state);

      // Initialize all the controllers that manage different parts of the application
      this._initControllers((eventName: string, ...args: any[]) =>
        this.emit(eventName, ...args)
      );

      // Set up the animation loop and resize handler
      window.addEventListener('resize', this.handleResize);
      this.animate();

      return dispose;
    });
  }

  private emit(eventName: string, ...args: any[]) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  /**
   * Registers an event listener.
   * @param eventName - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is fired.
   * @returns A function that removes the event listener when called.
   */
  public on(eventName: string, listener: (...args: any[]) => void) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(listener);

    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Retrieves a node or edge by its ID.
   * @param id - The unique identifier of the element.
   * @returns The element's reactive state proxy, or undefined if not found.
   */
  public getElement(id: string) {
    return (
      this.state.data?.nodes?.find((n) => n.id === id) ||
      this.state.data?.edges?.find((e) => e.id === id)
    );
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
   * @param emit - The event emitter function.
   */
  private _initControllers(emit: (eventName: string, ...args: any[]) => void) {
    this.layoutController = new LayoutController(this.state, emit);
    createEffect(() => this.layoutController.init());
    this.cameraController = new CameraController(
      this.state,
      this.updateState,
      emit,
      this.threeCamera
    );
    this.interactionController = new InteractionController({
      rendererEl: this.renderer!.domElement,
      state: this.state,
      updateState: this.updateState,
      threeCamera: this.threeCamera,
      nodeRenderer: this.nodeRenderer,
      emit,
      getElement: this.getElement.bind(this),
    });
    this.hudController = new HUDController(this.container, this.state);

    // Wire up events between controllers
    this.on('layout:pin', (nodeIds: string[]) => {
      this.layoutController.pinNodes(nodeIds);
    });
    this.on('layout:unpin', (nodeIds: string[]) => {
      this.layoutController.unpinNodes(nodeIds);
    });
  }

  private initRenderers() {
    // Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Initialize CSS3D Renderer
    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.top = '0';
    this.cssRenderer.domElement.style.pointerEvents = 'none'; // Initially, let webgl handle events
    this.container.appendChild(this.cssRenderer.domElement);

    // Ensure container is positioned relatively to anchor the absolute CSS renderer
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
  }

  private initScenes() {
    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.threeCamera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.scene.add(this.threeCamera); // Add camera to scene
  }

  /**
   * Updates the graph with a new (partial) specification.
   * Changes are merged into the existing state, and the visualization updates reactively.
   * @param spec - A partial `Spec` object with the properties to update.
   */
  public update(spec: Partial<Spec>) {
    this.updateState(spec);
  }

  private handleResize = () => {
    if (!this.renderer || !this.cssRenderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.threeCamera.aspect = width / height;
    this.threeCamera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
  };

  private animate = () => {
    if (!this.renderer || !this.cssRenderer) return;
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.threeCamera);
    this.cssRenderer.render(this.cssScene, this.threeCamera);
  };

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

    window.removeEventListener('resize', this.handleResize);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
    if (this.cssRenderer) {
      if (this.cssRenderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.cssRenderer.domElement);
      }
      this.cssRenderer = null;
    }
  }
}
