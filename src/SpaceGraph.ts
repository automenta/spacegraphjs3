import * as THREE from 'three';
import { createRoot, createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';
import { ElementActor } from './ElementActor';
import { Spec } from './types';
import { createGesture } from '@use-gesture/vanilla';
import { LayoutController } from './LayoutController';
import { CameraController } from './CameraController';

export class SpaceGraph {
  private container: HTMLElement;
  public state: Store<Spec>;
  private updateState: (spec: Partial<Spec>) => void;
  private scene: THREE.Scene;
  private threeCamera: THREE.PerspectiveCamera; // Renamed from 'camera'
  private renderer: THREE.WebGLRenderer | null = null;
  private actors: Map<string, ElementActor> = new Map();
  private layoutController: LayoutController;
  private cameraController: CameraController; // New controller
  private dispose: () => void;

  constructor(containerSelector: string, initialSpec: Spec) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container element '${containerSelector}' not found.`);
    }
    this.container = container as HTMLElement;

    // The createRoot ensures all SolidJS reactivity is disposed of properly
    this.dispose = createRoot((dispose) => {
      const { state, updateState } = createState(initialSpec);
      this.state = state;
      this.updateState = updateState;

      this.initRenderer();
      this.initScene();
      this.initReactiveEffects(); // Combined reactive initializers
      this.initInteraction();

      // Initialize controllers
      this.layoutController = new LayoutController(this.state);
      this.cameraController = new CameraController(this.state);

      window.addEventListener('resize', this.handleResize);
      this.animate();

      return dispose;
    });
  }

  // Public getters for controllers
  public get layout() {
    return this.layoutController;
  }

  public get camera() {
    return this.cameraController;
  }

  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private interactionCleanup: () => void;

  private initInteraction() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.interactionCleanup = createGesture(
      {
        onDrag: ({ movement: [mx, my], active }) => {
          if (active && this.state.camera) {
            // Directly mutate state for interaction feedback
            this.state.camera.position.x -= mx * 0.01;
            this.state.camera.position.y += my * 0.01;
          }
        },
        onWheel: ({ movement: [, my] }) => {
          if (this.state.camera) {
            const zoomSpeed = 0.01;
            const newZoom = Math.max(0.1, this.state.camera.zoom - my * zoomSpeed);
            // Mutate state directly
            this.state.camera.zoom = newZoom;
          }
        },
        onPointerMove: ({ event }) => {
          const { clientX, clientY } = event as PointerEvent;
          const { width, height } = this.renderer!.domElement;
          this.pointer.x = (clientX / width) * 2 - 1;
          this.pointer.y = -(clientY / height) * 2 + 1;

          this.raycaster.setFromCamera(this.pointer, this.threeCamera); // Use threeCamera
          const intersects = this.raycaster.intersectObjects(this.scene.children);

          const hoveredActor = intersects.length > 0
            ? Array.from(this.actors.values()).find(actor => actor.mesh === intersects[0].object)
            : undefined;

          this.updateState({
            interaction: { hoveredElementId: hoveredActor?.state.id ?? null }
          });
        },
        onClick: () => {
          this.raycaster.setFromCamera(this.pointer, this.threeCamera); // Use threeCamera
          const intersects = this.raycaster.intersectObjects(this.scene.children);

          if (intersects.length > 0) {
            const clickedActor = Array.from(this.actors.values()).find(actor => actor.mesh === intersects[0].object);
            if (clickedActor) {
              const clickedId = clickedActor.state.id;
              const selectedIds = this.state.interaction.selectedElementIds;
              const newSelectedIds = selectedIds.includes(clickedId)
                ? selectedIds.filter(id => id !== clickedId)
                : [...selectedIds, clickedId];

              this.updateState({ interaction: { selectedElementIds: newSelectedIds }});
            }
          } else {
            this.updateState({ interaction: { selectedElementIds: [] }});
          }
        },
      },
      { domTarget: this.renderer!.domElement, eventOptions: { passive: false } }
    );
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
        this.threeCamera.position.set(
          cameraState.position.x,
          cameraState.position.y,
          cameraState.position.z
        );
        this.threeCamera.zoom = cameraState.zoom;
        this.threeCamera.updateProjectionMatrix();
      }
    });

    // Effect to sync scene elements with reactive state
    createEffect(() => {
      const nodes = this.state.data?.nodes || [];
      const currentIds = new Set(nodes.map(n => n.id));

      // Add/update nodes
      for (const nodeState of nodes) {
        if (!this.actors.has(nodeState.id)) {
          const actor = new ElementActor(nodeState, this.state);
          this.actors.set(nodeState.id, actor);
          this.scene.add(actor.mesh);
        }
      }

      // Remove old nodes
      for (const [id, actor] of this.actors.entries()) {
        if (!currentIds.has(id)) {
          this.scene.remove(actor.mesh);
          actor.dispose();
          this.actors.delete(id);
        }
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

  public destroy() {
    for (const actor of this.actors.values()) {
      this.scene.remove(actor.mesh);
      actor.dispose();
    }
    this.actors.clear();

    this.dispose(); // Dispose SolidJS root and all effects
    this.interactionCleanup();
    this.layoutController.dispose();

    window.removeEventListener('resize', this.handleResize);

    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
      this.renderer = null;
    }
  }
}