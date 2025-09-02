import * as THREE from 'three';
import { createRoot, createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';
import { Spec } from './types';
import { LayoutController } from './LayoutController';
import { CameraController } from './CameraController';
import { InteractionController } from './InteractionController';
import { InstancedRenderer } from './InstancedRenderer';
import { EventEmitter } from './EventEmitter';
import { HUDController } from './HUDController';

export class SpaceGraph {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static registerType(name: string, component: any) {
    console.warn(`SpaceGraph.registerType('${name}', ...) is not yet implemented.`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static registerLayout(name: string, component: any) {
    console.warn(`SpaceGraph.registerLayout('${name}', ...) is not yet implemented.`);
  }

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
  private events: EventEmitter;

  constructor(containerSelector: string, initialSpec: Spec) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container element '${containerSelector}' not found.`);
    }
    this.container = container as HTMLElement;

    // The createRoot ensures all SolidJS reactivity is disposed of properly
    this.dispose = createRoot((dispose) => {
      this.events = new EventEmitter();

      const { state, updateState } = createState(initialSpec);
      this.state = state;
      this.updateState = updateState;

      this.initRenderer();
      this.initScene();

      this.instancedRenderer = new InstancedRenderer(this.scene, this.state);

      this.initReactiveEffects(); // Combined reactive initializers

      const emit = this.events.emit.bind(this.events);

      // Initialize controllers
      this.layoutController = new LayoutController(this.state, emit);
      this.cameraController = new CameraController(this.state, emit);
      this.interactionController = new InteractionController(
        this.renderer!.domElement,
        this.state,
        this.updateState,
        this.threeCamera,
        this.scene,
        this.instancedRenderer,
        emit,
      );

      this.hudController = new HUDController(this.container, this.state, (command) => this.execute(command));


      window.addEventListener('resize', this.handleResize);
      this.animate();

      return dispose;
    });
  }

  public on(eventName: string, listener: (...args: any[]) => void) {
    return this.events.on(eventName, listener);
  }

  public getElement(id: string) {
    return this.state.data?.nodes?.find(n => n.id === id) || this.state.data?.edges?.find(e => e.id === id);
  }

  // Public getters for controllers
  public get layout() {
    return this.layoutController;
  }

  public get camera() {
    return this.cameraController;
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
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

  private initReactiveEffects() {
    // Effect to sync Three.js camera with reactive state
    createEffect(() => {
      const cameraState = this.state.camera;
      if (cameraState) {
        // Calculate position from spherical coordinates (phi, theta, distance)
        const phi = cameraState.phi;
        const theta = cameraState.theta;
        const distance = cameraState.distance;
        const target = cameraState.target;

        const x = distance * Math.sin(phi) * Math.sin(theta);
        const y = distance * Math.cos(phi);
        const z = distance * Math.sin(phi) * Math.cos(theta);

        this.threeCamera.position.set(
          target.x + x,
          target.y + y,
          target.z + z
        );

        this.threeCamera.lookAt(new THREE.Vector3(target.x, target.y, target.z));
        this.threeCamera.updateProjectionMatrix();
      }
    });
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

  public execute(command: string) {
    try {
      // A "safe" eval context.
      const func = new Function('graph', `with(graph) { ${command} }`);
      func(this);
    } catch (e) {
      console.error(`REPL Error: ${e}`);
    }
  }

  public destroy() {
    this.dispose(); // Dispose SolidJS root and all effects
    this.events.dispose();
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