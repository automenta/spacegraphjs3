import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';
import { Spec } from './types';
import { LayoutController } from './LayoutController';
import { CameraController } from './CameraController';
import { InteractionController } from './InteractionController';
import { InstancedRenderer } from './InstancedRenderer';
import { HUDController } from './HUDController';

export class SpaceGraph {
  private container: HTMLElement;
  public state: Store<Spec>;
  private updateState: (spec: Partial<Spec>) => void;
  private scene: THREE.Scene;
  private threeCamera: THREE.PerspectiveCamera; // Renamed from 'camera'
  private renderer: THREE.WebGLRenderer | null = null;
  private layoutController: LayoutController;
  private cameraController: CameraController; // New controller
  private interactionController: InteractionController;
  private instancedRenderer: InstancedRenderer;
  private hudController: HUDController;
  private dispose: () => void;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();

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
      this.initRenderer();
      this.initScene();

      // Create the instanced renderer for nodes
      this.instancedRenderer = new InstancedRenderer(this.scene, this.state);

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

  public getElement(id: string) {
    return (
      this.state.data?.nodes?.find((n) => n.id === id) ||
      this.state.data?.edges?.find((e) => e.id === id)
    );
  }

  // Public getters for controllers
  public get layout() {
    return this.layoutController;
  }

  public get camera() {
    return this.cameraController;
  }

  /**
   * Initialize all the controllers that manage different parts of the application.
   * @param emit - The event emitter function.
   */
  private _initControllers(emit: (eventName: string, ...args: any[]) => void) {
    this.layoutController = new LayoutController(this.state, emit);
    this.layoutController.init();
    this.cameraController = new CameraController(
      this.state,
      emit,
      this.threeCamera
    );
    this.interactionController = new InteractionController({
      rendererEl: this.renderer!.domElement,
      state: this.state,
      updateState: this.updateState,
      threeCamera: this.threeCamera,
      instancedRenderer: this.instancedRenderer,
      emit,
      getElement: this.getElement.bind(this),
    });
    this.hudController = new HUDController(this.container, this.state);
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.threeCamera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.scene.add(this.threeCamera); // Add camera to scene
  }

  public update(spec: Partial<Spec>) {
    this.updateState(spec);
  }

  private handleResize = () => {
    if (!this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.threeCamera.aspect = width / height;
    this.threeCamera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    if (!this.renderer) return;
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.threeCamera); // Use threeCamera
  };

  public destroy() {
    this.dispose(); // Dispose SolidJS root and all effects
    this.interactionController.dispose();
    this.layoutController.dispose();
    this.instancedRenderer.dispose();
    this.hudController.dispose();

    window.removeEventListener('resize', this.handleResize);

    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
      this.renderer = null;
    }
  }
}
