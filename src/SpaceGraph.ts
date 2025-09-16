import { THREE, CSS3DRenderer } from './utils/three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import { createRoot, createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

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
  private scene!: THREE.Scene;
  private cssScene!: THREE.Scene;
  private threeCamera!: THREE.PerspectiveCamera; // Renamed from 'camera'
  private renderer: THREE.WebGLRenderer | null = null;
  private cssRenderer: CSS3DRenderer | null = null;
  public layoutController!: LayoutController;
  private cameraController!: CameraController; // New controller
  private interactionController!: InteractionController;
  private nodeRenderer!: IRenderer;
  private edgeRenderer!: EdgeRenderer;
  private htmlRenderer!: HTMLRenderer;
  private hudController!: HUDController;
  private dispose: () => void;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  public isInitialized: boolean = false;

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

    this.dispose = createRoot((dispose) => {
      const { state, updateState, setState } = createState(initialSpec);
      this.state = state;
      this.updateState = updateState;
      this.setState = setState;

      this.initRenderers();
      this.initScenes();

      this.edgeRenderer = new EdgeRenderer(this.scene, this.state);
      this.htmlRenderer = new HTMLRenderer(this.cssScene, this.state);
      this.hudController = new HUDController(this.container, this.state);

      this.cameraController = new CameraController(
        this.state,
        this.updateState,
        this.emit.bind(this),
        this.threeCamera
      );

      this.layoutController = new LayoutController(
        this.state,
        this.setState,
        this.emit.bind(this)
      );
      this.layoutController.init();

      // Dynamic Renderer Switching
      createEffect(() => {
        const nodeCount = this.state.data?.nodes?.length ?? 0;
        const threshold = this.state.performance?.instancingThreshold ?? 100;
        const shouldUseInstanced = nodeCount > threshold;

        let currentRendererType = 'none';
        if (this.nodeRenderer) {
          currentRendererType =
            this.nodeRenderer instanceof InstancedRenderer
              ? 'instanced'
              : 'default';
        }

        if (
          (shouldUseInstanced && currentRendererType !== 'instanced') ||
          (!shouldUseInstanced && currentRendererType !== 'default')
        ) {
          if (this.nodeRenderer) {
            this.nodeRenderer.dispose();
          }

          this.nodeRenderer = shouldUseInstanced
            ? new InstancedRenderer(this.scene, this.state)
            : new NodeRenderer(this.scene, this.state);

          this.interactionController.setNodeRenderer(this.nodeRenderer);
        }
      });

      this.initEventListeners();

      window.addEventListener('resize', this.handleResize);
      this.animate();

      this.isInitialized = true; // Set to true after successful initialization

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
   * @param emit - The event emitter function.
   */
  private initEventListeners() {
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
  public update(spec: SpecUpdate) {
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
