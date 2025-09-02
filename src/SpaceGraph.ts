// src/SpaceGraph.ts
import * as THREE from 'three';
import { createRoot, createEffect } from 'solid-js';
import { Store } from 'solid-js/store'; // Import Store
import { createState } from './createState';
import { ElementActor } from './ElementActor';
import { Spec } from './types';
import { createGesture } from '@use-gesture/vanilla'; // Corrected import
import { LayoutController } from './LayoutController';

export class SpaceGraph {
  private container: HTMLElement;
  public state!: Store<Spec>; // SolidJS store proxy, definite assignment
  private updateState!: (spec: Partial<Spec>) => void; // Definite assignment
  private scene!: THREE.Scene; // Definite assignment
  private camera!: THREE.PerspectiveCamera; // Definite assignment
  private renderer: THREE.WebGLRenderer | null = null; // Changed to nullable and initialized
  private actors: Map<string, ElementActor> = new Map();
  private layoutController!: LayoutController; // Definite assignment
  private dispose!: () => void; // Function to dispose SolidJS root, definite assignment

  constructor(containerSelector: string, initialSpec: Spec) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container element '${containerSelector}' not found.`);
    }
    this.container = container as HTMLElement;

    this.dispose = createRoot((dispose) => {
      const { state, updateState } = createState(initialSpec);
      this.state = state;
      this.updateState = updateState;

      this.initRenderer();
      this.initScene();
      this.initReactiveScene();
      this.initInteraction();
      this.layoutController = new LayoutController(this.state, this.updateState);
      window.addEventListener('resize', this.handleResize); // Add resize listener

      this.animate();
      return dispose;
    });
  }

  private raycaster!: THREE.Raycaster; // Definite assignment
  private pointer!: THREE.Vector2; // Definite assignment
  private interactionCleanup!: ReturnType<typeof createGesture>; // Corrected type

  private initInteraction() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    const { width, height } = this.renderer!.domElement; // Use non-null assertion

    this.interactionCleanup = createGesture(
      {
        onDrag: ({ movement: [mx, my], active }: { movement: [number, number]; active: boolean }) => {
          if (active && this.state.camera) {
            const sensitivity = 0.01;
            this.updateState({
              camera: {
                position: {
                  x: this.state.camera.position.x - mx * sensitivity,
                  y: this.state.camera.position.y + my * sensitivity,
                },
              },
            });
          }
        },
        onWheel: ({ movement: [, my] }: { movement: [number, number] }) => {
          if (this.state.camera) {
            const zoomSpeed = 0.01;
            const newZoom = Math.max(0.1, this.state.camera.zoom - my * zoomSpeed);
            this.updateState({
              camera: {
                zoom: newZoom,
              },
            });
          }
        },
        onPointerMove: ({ clientX, clientY }: { clientX: number; clientY: number }) => {
          const { width, height } = this.renderer!.domElement;
          this.pointer.x = (clientX / width) * 2 - 1;
          this.pointer.y = -(clientY / height) * 2 + 1;

          this.raycaster.setFromCamera(this.pointer, this.camera);
          const intersects = this.raycaster.intersectObjects(this.scene.children);

          if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            // Find the actor associated with the intersected object
            const hoveredActor = Array.from(this.actors.values()).find(
              (actor) => actor.mesh === intersectedObject
            );
            if (hoveredActor && this.state.interaction && this.state.interaction.hoveredElementId !== hoveredActor.state.id) {
              this.updateState({
                interaction: {
                  hoveredElementId: hoveredActor.state.id,
                },
              });
            } else if (!hoveredActor && this.state.interaction && this.state.interaction.hoveredElementId !== null) {
              this.updateState({
                interaction: {
                  hoveredElementId: null,
                },
              });
            }
        },

        onClick: () => {
          this.raycaster.setFromCamera(this.pointer, this.camera);
          const intersects = this.raycaster.intersectObjects(this.scene.children);

          if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            const clickedActor = Array.from(this.actors.values()).find(
              (actor) => actor.mesh === intersectedObject
            );
            if (clickedActor && this.state.interaction) {
              const clickedId = clickedActor.state.id;
              if (this.state.interaction.selectedElementIds.includes(clickedId)) {
                this.updateState({
                  interaction: {
                    selectedElementIds: this.state.interaction.selectedElementIds.filter(
                      (id) => id !== clickedId
                    ),
                  },
                });
              } else {
                this.updateState({
                  interaction: {
                    selectedElementIds: [...this.state.interaction.selectedElementIds, clickedId],
                  },
                });
              }
            }
          } else if (this.state.interaction) {
            this.updateState({
              interaction: {
                selectedElementIds: [],
              },
            });
          }
        },
      },
      {
        domTarget: this.renderer!.domElement,
        eventOptions: { passive: false },
      }
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
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
  }

  private initReactiveScene() {
    createEffect(() => {
      const nodes = this.state.data?.nodes || [];
      const currentIds = new Set(nodes.map((n) => n.id));

      // Add/update nodes
      for (const nodeState of nodes) {
        if (!this.actors.has(nodeState.id)) {
          const actor = new ElementActor(nodeState, this.state as any); // Pass global state, cast to any
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

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    if (!this.renderer) return; // Stop animation if destroyed
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  public get layout() {
    return this.layoutController;
  }

  public destroy() {
    // Dispose all actors
    for (const actor of this.actors.values()) {
      this.scene.remove(actor.mesh);
      actor.dispose();
    }
    this.actors.clear();

    // Dispose SolidJS subscriptions
    this.dispose();

    // Dispose interaction listeners
    if (this.interactionCleanup) {
      this.interactionCleanup.destroy(); // Call destroy method
    }

    // Dispose layout controller
    this.layoutController.dispose();

    window.removeEventListener('resize', this.handleResize); // Remove resize listener

    // Dispose Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
      this.renderer = null;
    }
  }
}