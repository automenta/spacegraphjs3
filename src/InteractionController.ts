import * as THREE from 'three';
import { createGesture, Gesture } from '@use-gesture/vanilla';
import { Store } from 'solid-js/store';
import { Spec, Element } from './types';
import { InstancedRenderer } from './InstancedRenderer';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

// Add the bvh properties to the THREE.Raycaster
// @ts-expect-error - Linter doesn't like this, but it's the way the library is meant to be used.
THREE.Mesh.prototype.raycast = acceleratedRaycast;
// @ts-expect-error - Linter doesn't like this, but it's the way the library is meant to be used.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// @ts-expect-error - Linter doesn't like this, but it's the way the library is meant to be used.
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

export class InteractionController {
  private rendererEl: HTMLElement;
  private state: Store<Spec>;
  private updateState: (spec: Partial<Spec>) => void;
  private threeCamera: THREE.PerspectiveCamera;
  private instancedRenderer: InstancedRenderer;
  private emit: (eventName: string, ...args: any[]) => void;
  private getElement: (id: string) => Element | undefined;
  private gesture: Gesture;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private lastHoveredId: string | null = null;

  constructor({
    rendererEl,
    state,
    updateState,
    threeCamera,
    instancedRenderer,
    emit,
    getElement,
  }: {
    rendererEl: HTMLElement;
    state: Store<Spec>;
    updateState: (spec: Partial<Spec>) => void;
    threeCamera: THREE.PerspectiveCamera;
    instancedRenderer: InstancedRenderer;
    emit: (eventName: string, ...args: any[]) => void;
    getElement: (id: string) => Element | undefined;
  }) {
    this.rendererEl = rendererEl;
    this.state = state;
    this.updateState = updateState;
    this.threeCamera = threeCamera;
    this.instancedRenderer = instancedRenderer;
    this.emit = emit;
    this.getElement = getElement;

    this.initInteraction();
  }

  /**
   * Initialize the gesture and raycaster for interaction.
   */
  private initInteraction() {
    this.raycaster = new THREE.Raycaster();
    // @ts-expect-error - firstHitOnly is not in the type definition
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
            const newTheta = this.state.camera.theta - mx * rotateSpeed;
            let newPhi = this.state.camera.phi - my * rotateSpeed;
            // Clamp phi to avoid flipping over at the poles
            newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, newPhi));
            this.updateState({
              camera: { ...this.state.camera, theta: newTheta, phi: newPhi },
            });
          }
          // Left-click drag for panning
          else {
            const panSpeed = 0.01;
            const newTarget = {
              x: this.state.camera.target.x - mx * panSpeed,
              y: this.state.camera.target.y + my * panSpeed,
              z: this.state.camera.target.z,
            };
            this.updateState({
              camera: { ...this.state.camera, target: newTarget },
            });
          }
        },
        onWheel: ({ movement: [, my] }) => {
          if (this.state.camera) {
            const zoomSpeed = 0.1;
            const newDistance = this.state.camera.distance + my * zoomSpeed;
            this.updateState({
              camera: {
                ...this.state.camera,
                distance: Math.max(0.1, newDistance),
              },
            });
          }
        },
        onPointerMove: ({ event }) => {
          const { clientX, clientY } = event as PointerEvent;
          const hoveredId = this._getHoveredElementId(clientX, clientY);

          if (hoveredId !== this.lastHoveredId) {
            if (this.lastHoveredId) {
              const target = this.getElement(this.lastHoveredId);
              if (target) this.emit('element:hover:leave', { target });
            }
            if (hoveredId) {
              const target = this.getElement(hoveredId);
              if (target) this.emit('element:hover:enter', { target });
            }
            this.lastHoveredId = hoveredId;
          }

          this.updateState({
            interaction: {
              ...this.state.interaction,
              hoveredElementId: hoveredId ?? null,
            },
          });
        },
        onClick: ({ event }) => {
          const { clientX, clientY } = event as PointerEvent;
          const clickedId = this._getHoveredElementId(clientX, clientY);

          if (clickedId) {
            const target = this.getElement(clickedId);
            if (target) this.emit('element:click', { target, domEvent: event });

            const selectedIds = this.state.interaction.selectedElementIds;
            const newSelectedIds = selectedIds.includes(clickedId)
              ? selectedIds.filter((id) => id !== clickedId)
              : [...selectedIds, clickedId];

            this.updateState({
              interaction: {
                ...this.state.interaction,
                selectedElementIds: newSelectedIds,
              },
            });
          } else {
            this.emit('background:click', { domEvent: event });
            this.updateState({
              interaction: {
                ...this.state.interaction,
                selectedElementIds: [],
              },
            });
          }
        },
      },
      { domTarget: this.rendererEl, eventOptions: { passive: false } }
    );
  }

  private _getHoveredElementId(x: number, y: number): string | null {
    if (!this.instancedRenderer.instancedMesh) return null;

    const { width, height } = this.rendererEl.getBoundingClientRect();
    this.pointer.x = (x / width) * 2 - 1;
    this.pointer.y = -(y / height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.threeCamera);
    const intersects = this.raycaster.intersectObjects([
      this.instancedRenderer.instancedMesh,
    ]);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      if (intersection.instanceId !== undefined) {
        return (
          this.instancedRenderer.getNodeId(intersection.instanceId) ?? null
        );
      }
    }
    return null;
  }

  public dispose() {
    if (this.gesture) {
      this.gesture.destroy();
    }
  }
}
