import * as THREE from 'three';
import { createGesture, Gesture } from '@use-gesture/vanilla';
import { Store } from 'solid-js/store';
import { Spec } from './types';
import { InstancedRenderer } from './InstancedRenderer';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

// Add the bvh properties to the THREE.Raycaster
// @ts-ignore
THREE.Mesh.prototype.raycast = acceleratedRaycast;
// @ts-ignore
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// @ts-ignore
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;


export class InteractionController {
  private state: Store<Spec>;
  private updateState: (spec: Partial<Spec>) => void;
  private threeCamera: THREE.PerspectiveCamera;
  private rendererEl: HTMLElement;
  private scene: THREE.Scene;
  private instancedRenderer: InstancedRenderer;
  private gesture: Gesture;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

  constructor(
    rendererEl: HTMLElement,
    state: Store<Spec>,
    updateState: (spec: Partial<Spec>) => void,
    threeCamera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    instancedRenderer: InstancedRenderer
  ) {
    this.rendererEl = rendererEl;
    this.state = state;
    this.updateState = updateState;
    this.threeCamera = threeCamera;
    this.scene = scene;
    this.instancedRenderer = instancedRenderer;

    this.initInteraction();
  }

  private initInteraction() {
    this.raycaster = new THREE.Raycaster();
    // @ts-ignore
    this.raycaster.firstHitOnly = true;
    this.pointer = new THREE.Vector2();

    this.gesture = createGesture(
      {
        onDrag: ({ movement: [mx, my], event, active }) => {
          if (!active || !this.state.camera) return;
          const e = event as PointerEvent;

          // Right-click drag for rotation (orbit)
          if (e.buttons === 2) {
            const rotateSpeed = 0.005;
            this.state.camera.theta -= mx * rotateSpeed;
            this.state.camera.phi -= my * rotateSpeed;
            // Clamp phi to avoid flipping over at the poles
            this.state.camera.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.state.camera.phi));
          }
          // Left-click drag for panning
          else {
            const panSpeed = 0.01;
            this.state.camera.target.x -= mx * panSpeed;
            this.state.camera.target.y += my * panSpeed;
          }
        },
        onWheel: ({ movement: [, my] }) => {
          if (this.state.camera) {
            const zoomSpeed = 0.1;
            const newDistance = this.state.camera.distance + my * zoomSpeed;
            // Mutate state directly
            this.state.camera.distance = Math.max(0.1, newDistance);
          }
        },
        onPointerMove: ({ event }) => {
          const { clientX, clientY } = event as PointerEvent;
          const { width, height } = this.rendererEl;
          this.pointer.x = (clientX / width) * 2 - 1;
          this.pointer.y = -(clientY / height) * 2 + 1;

          this.raycaster.setFromCamera(this.pointer, this.threeCamera);
          const intersects = this.raycaster.intersectObjects([this.instancedRenderer.instancedMesh]);

          let hoveredId = null;
          if (intersects.length > 0) {
            const intersection = intersects[0];
            if (intersection.instanceId !== undefined) {
              hoveredId = this.instancedRenderer.getNodeId(intersection.instanceId);
            }
          }

          this.updateState({
            interaction: { hoveredElementId: hoveredId ?? null }
          });
        },
        onClick: () => {
          this.raycaster.setFromCamera(this.pointer, this.threeCamera);
          const intersects = this.raycaster.intersectObjects([this.instancedRenderer.instancedMesh]);

          if (intersects.length > 0) {
            const intersection = intersects[0];
            if (intersection.instanceId !== undefined) {
              const clickedId = this.instancedRenderer.getNodeId(intersection.instanceId);
              if (clickedId) {
                const selectedIds = this.state.interaction.selectedElementIds;
                const newSelectedIds = selectedIds.includes(clickedId)
                  ? selectedIds.filter(id => id !== clickedId)
                  : [...selectedIds, clickedId];

                this.updateState({ interaction: { selectedElementIds: newSelectedIds }});
              }
            }
          } else {
            this.updateState({ interaction: { selectedElementIds: [] }});
          }
        },
      },
      { domTarget: this.rendererEl, eventOptions: { passive: false } }
    );
  }

  public dispose() {
    if (this.gesture) {
      this.gesture.destroy();
    }
  }
}
