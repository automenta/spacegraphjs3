import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { animate } from 'popmotion';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { SpecUpdate } from '../types';

/**
 * A plugin that manages the camera and provides camera control methods.
 * It synchronizes the Three.js camera with the reactive state.
 */
export class CameraPlugin implements ISpaceGraphPlugin {
  private graph!: SpaceGraph;
  private threeCamera!: THREE.PerspectiveCamera;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.threeCamera = graph.renderingManager.getCamera();
    this.syncCameraToState();
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

      this.threeCamera.position.set(
        target.x + x,
        target.y + y,
        target.z + z,
      );
      this.threeCamera.lookAt(new THREE.Vector3(target.x, target.y, target.z));
      this.threeCamera.updateProjectionMatrix();
    });
  }

  /**
   * Animates the camera state to a new target.
   * @param targetState - The target camera state.
   * @param options - Animation options.
   */
  public flyTo(
    targetState: Partial<SpecUpdate['camera']>,
    options: { duration: number } = { duration: 1000 },
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
    options: { duration: number } = { duration: 1000 },
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
}
