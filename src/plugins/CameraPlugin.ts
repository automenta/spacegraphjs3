import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { animate } from 'popmotion';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { SpecUpdate } from '../types';
import { InteractionLogic } from '../InteractionLogic';

/**
 * A plugin that manages the camera and provides camera control methods.
 * It synchronizes the Three.js camera with the reactive state.
 */
export class CameraPlugin implements ISpaceGraphPlugin {
  private graph!: SpaceGraph;
  private threeCamera!: THREE.PerspectiveCamera;
  private activeKeys: Set<string> = new Set();
  private boundOnKeyDown!: (event: KeyboardEvent) => void;
  private boundOnKeyUp!: (event: KeyboardEvent) => void;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.threeCamera = graph.renderingManager.getCamera();
    this.syncCameraToState();
    this.initKeyboardControls();
  }

  public update(): void {
    if (!this.graph.state.controls?.keyboard?.enabled) return;

    const controls = this.graph.state.controls.keyboard;
    if (!controls) return;

    // Panning
    if (this.activeKeys.has('w'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        this.graph.updateState,
        'forward',
        controls.panSpeed,
        this.threeCamera
      );
    if (this.activeKeys.has('s'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        this.graph.updateState,
        'backward',
        controls.panSpeed,
        this.threeCamera
      );
    if (this.activeKeys.has('a'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        this.graph.updateState,
        'left',
        controls.panSpeed,
        this.threeCamera
      );
    if (this.activeKeys.has('d'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        this.graph.updateState,
        'right',
        controls.panSpeed,
        this.threeCamera
      );

    // Orbiting
    if (this.activeKeys.has('arrowup'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        this.graph.updateState,
        'up',
        controls.orbitSpeed
      );
    if (this.activeKeys.has('arrowdown'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        this.graph.updateState,
        'down',
        controls.orbitSpeed
      );
    if (this.activeKeys.has('arrowleft'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        this.graph.updateState,
        'left',
        controls.orbitSpeed
      );
    if (this.activeKeys.has('arrowright'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        this.graph.updateState,
        'right',
        controls.orbitSpeed
      );

    // Zooming
    if (this.activeKeys.has('+') || this.activeKeys.has('='))
      InteractionLogic.handleKeyZoom(
        this.graph.state,
        this.graph.updateState,
        'in',
        controls.zoomSpeed
      );
    if (this.activeKeys.has('-') || this.activeKeys.has('_'))
      InteractionLogic.handleKeyZoom(
        this.graph.state,
        this.graph.updateState,
        'out',
        controls.zoomSpeed
      );
  }

  /**
   * Animates the camera state to a new target.
   * @param targetState - The target camera state.
   * @param options - Animation options.
   */
  public flyTo(
    targetState: Partial<SpecUpdate['camera']>,
    options: { duration: number } = { duration: 1000 }
  ) {
    const fromState = { ...this.graph.state.camera };

    // Emit animation start event
    this.graph.eventManager.emit('camera:animation:start');

    animate({
      from: fromState,
      to: targetState,
      duration: options.duration,
      onUpdate: (latest) => {
        this.graph.updateState({ camera: latest });
      },
      onComplete: () => {
        // Emit animation end event
        this.graph.eventManager.emit('camera:animation:end');
      },
    });
  }

  /**
   * Frames the given elements in the camera view.
   * @param elements - The elements to frame.
   * @param options - Animation options.
   */
  public frame(
    elements: { position: THREE.Vector3 }[],
    options: { duration: number } = { duration: 1000 }
  ) {
    if (elements.length === 0) return;

    const box = new THREE.Box3();
    for (const el of elements) {
      box.expandByPoint(el.position);
    }

    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.threeCamera.fov * (Math.PI / 180);
    let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov * 2));
    cameraZ *= 1.5; // zoom out a little so object is not edge to edge

    const target = {
      target: { x: center.x, y: center.y, z: center.z },
      distance: cameraZ,
    };

    this.flyTo(target, options);
  }

  public dispose(): void {
    if (this.boundOnKeyDown) {
      window.removeEventListener('keydown', this.boundOnKeyDown);
    }
    if (this.boundOnKeyUp) {
      window.removeEventListener('keyup', this.boundOnKeyUp);
    }
  }

  private initKeyboardControls(): void {
    if (!this.graph.state.controls?.keyboard?.enabled) return;

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.activeKeys.add(event.key.toLowerCase());
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.activeKeys.delete(event.key.toLowerCase());
  }

  /**
   * Sets up a reactive effect to keep the Three.js camera in sync with the state.
   */
  private syncCameraToState() {
    createEffect(() => {
      const cameraState = this.graph.state.camera;
      if (!cameraState) return;

      const { target, distance, phi, theta } = cameraState;

      // Calculate camera position based on spherical coordinates
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.cos(phi);
      const z = distance * Math.sin(phi) * Math.sin(theta);

      this.threeCamera.position.set(target.x + x, target.y + y, target.z + z);
      this.threeCamera.lookAt(new THREE.Vector3(target.x, target.y, target.z));
      this.threeCamera.updateProjectionMatrix();
    });
  }
}
