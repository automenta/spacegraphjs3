import { THREE } from './utils/three';
import { Gesture } from '@use-gesture/vanilla';
import { Store } from 'solid-js/store';
import { Spec, GraphElement, SpecUpdate } from './types';
import { IRenderer } from './IRenderer';
import { InteractionLogic } from './InteractionLogic';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

// Add the bvh properties to the THREE.Raycaster
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

export class InteractionController {
  private rendererEl: HTMLElement;
  private state: Store<Spec>;
  private updateState: (spec: SpecUpdate) => void;
  private threeCamera: THREE.PerspectiveCamera;
  private nodeRenderer: IRenderer;
  private emit: (eventName: string, ...args: any[]) => void;
  private getElement: (id: string) => GraphElement | undefined;
  private gesture!: Gesture;
  private raycaster!: THREE.Raycaster;
  private pointer!: THREE.Vector2;
  private lastHoveredId: string | null = null;
  private draggedElementId: string | null = null;
  private dragPlane = new THREE.Plane();

  constructor({
    rendererEl,
    state,
    updateState,
    threeCamera,
    nodeRenderer,
    emit,
    getElement,
  }: {
    rendererEl: HTMLElement;
    state: Store<Spec>;
    updateState: (spec: SpecUpdate) => void;
    threeCamera: THREE.PerspectiveCamera;
    nodeRenderer: IRenderer;
    emit: (eventName: string, ...args: any[]) => void;
    getElement: (id: string) => GraphElement | undefined;
  }) {
    this.rendererEl = rendererEl;
    this.state = state;
    this.updateState = updateState;
    this.threeCamera = threeCamera;
    this.nodeRenderer = nodeRenderer;
    this.emit = emit;
    this.getElement = getElement;

    this.initInteraction();
  }

  private initInteraction() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.firstHitOnly = true;
    this.pointer = new THREE.Vector2();

    window.addEventListener('keydown', this.handleKeyDown);

    this.gesture = new Gesture(
      this.rendererEl,
      {
        onDragStart: (state: any) => {
          const { event } = state;
          const { clientX, clientY } = event as PointerEvent;
          this.draggedElementId = this._getHoveredElementId(clientX, clientY);

          if (this.draggedElementId) {
            const element = this.getElement(this.draggedElementId);
            if (element?.position) {
              this.threeCamera.getWorldDirection(this.dragPlane.normal);
              this.dragPlane.setFromNormalAndCoplanarPoint(
                this.dragPlane.normal,
                new THREE.Vector3(
                  element.position.x,
                  element.position.y,
                  element.position.z
                )
              );
              this.emit('layout:pin', [this.draggedElementId]);
            }
          }
        },
        onDrag: (state: any) => {
          const {
            movement: [mx, my],
            event,
            xy: [vx, vy],
            active,
          } = state;
          if (!active || !this.state.camera) return;

          if (this.draggedElementId) {
            InteractionLogic.handleNodeDrag(
              vx,
              vy,
              this.draggedElementId,
              this.dragPlane,
              this.rendererEl,
              this.threeCamera,
              this.updateState
            );
          } else {
            const e = event as PointerEvent;
            if (e.buttons === 2) {
              InteractionLogic.handleOrbit(
                mx,
                my,
                this.state,
                this.updateState
              );
            } else {
              InteractionLogic.handlePan(
                mx,
                my,
                this.state,
                this.updateState,
                this.threeCamera
              );
            }
          }
        },
        onDragEnd: () => {
          if (this.draggedElementId) {
            this.emit('layout:unpin', [this.draggedElementId]);
            this.draggedElementId = null;
          }
        },
        onWheel: (state: any) => {
          const {
            movement: [, my],
          } = state;
          if (this.state.camera) {
            const zoomSpeed = 0.1;
            const newDistance = this.state.camera.distance + my * zoomSpeed;
            this.updateState({
              camera: {
                distance: Math.max(0.1, newDistance),
              },
            });
          }
        },
        onPointerMove: (state: any) => {
          const { event } = state;
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
              hoveredElementId: hoveredId ?? null,
            },
          });
        },
        onClick: (state: any) => {
          const { event } = state;
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
                selectedElementIds: newSelectedIds,
              },
            });
          } else {
            this.emit('background:click', { domEvent: event });
            this.updateState({
              interaction: {
                selectedElementIds: [],
              },
            });
          }
        },
      },
      { eventOptions: { passive: false } }
    );
  }

  private _getHoveredElementId(x: number, y: number): string | null {
    const { width, height } = this.rendererEl.getBoundingClientRect();
    this.pointer.x = (x / width) * 2 - 1;
    this.pointer.y = -(y / height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.threeCamera);
    const intersects = this.raycaster.intersectObjects(
      this.nodeRenderer.getRaycastableObjects()
    );

    if (intersects.length > 0) {
      const intersection = intersects[0];
      return this.nodeRenderer.getNodeIdFromIntersection(intersection);
    }
    return null;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.state.controls.keyboard.enabled) return;
    const { panSpeed, zoomSpeed, orbitSpeed } = this.state.controls.keyboard;

    switch (event.key) {
      // Zoom
      case '=':
      case '+':
        InteractionLogic.handleKeyZoom(
          this.state,
          this.updateState,
          'in',
          zoomSpeed
        );
        break;
      case '-':
      case '_':
        InteractionLogic.handleKeyZoom(
          this.state,
          this.updateState,
          'out',
          zoomSpeed
        );
        break;

      // Pan
      case 'w':
        InteractionLogic.handleKeyPan(
          this.state,
          this.updateState,
          'forward',
          panSpeed,
          this.threeCamera
        );
        break;
      case 's':
        InteractionLogic.handleKeyPan(
          this.state,
          this.updateState,
          'backward',
          panSpeed,
          this.threeCamera
        );
        break;
      case 'a':
        InteractionLogic.handleKeyPan(
          this.state,
          this.updateState,
          'left',
          panSpeed,
          this.threeCamera
        );
        break;
      case 'd':
        InteractionLogic.handleKeyPan(
          this.state,
          this.updateState,
          'right',
          panSpeed,
          this.threeCamera
        );
        break;

      // Orbit
      case 'ArrowUp':
        InteractionLogic.handleKeyOrbit(
          this.state,
          this.updateState,
          'up',
          orbitSpeed
        );
        break;
      case 'ArrowDown':
        InteractionLogic.handleKeyOrbit(
          this.state,
          this.updateState,
          'down',
          orbitSpeed
        );
        break;
      case 'ArrowLeft':
        InteractionLogic.handleKeyOrbit(
          this.state,
          this.updateState,
          'left',
          orbitSpeed
        );
        break;
      case 'ArrowRight':
        InteractionLogic.handleKeyOrbit(
          this.state,
          this.updateState,
          'right',
          orbitSpeed
        );
        break;
    }
  };

  public dispose() {
    if (this.gesture) {
      this.gesture.destroy();
    }
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
