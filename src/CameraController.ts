import { THREE } from './utils/three';
import { Store } from 'solid-js/store';
import { animate } from 'popmotion';
import { Spec, CameraSpec, GraphElement } from './types';
import { createEffect } from 'solid-js';

export class CameraController {
  private state: Store<Spec>;
  private updateState: (spec: Partial<Spec>) => void;
  private emit: (eventName: string, ...args: any[]) => void;
  private threeCamera: THREE.PerspectiveCamera;

  constructor(
    state: Store<Spec>,
    updateState: (spec: Partial<Spec>) => void,
    emit: (eventName: string, ...args: any[]) => void,
    threeCamera: THREE.PerspectiveCamera
  ) {
    this.state = state;
    this.updateState = updateState;
    this.emit = emit;
    this.threeCamera = threeCamera;

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

        this.threeCamera.position.set(target.x + x, target.y + y, target.z + z);

        this.threeCamera.lookAt(
          new THREE.Vector3(target.x, target.y, target.z)
        );
        this.threeCamera.updateProjectionMatrix();
      }
    });
  }

  /**
   * Animates the camera to a new state.
   * @param targetState - The target camera state.
   * @param options - Animation options like duration and easing.
   */
  public flyTo(
    targetState: Partial<CameraSpec>,
    options: { duration?: number; ease?: (t: number) => number } = {}
  ) {
    const { duration = 1000, ease } = options;
    if (!this.state.camera) return;

    const fromState = {
      target: { ...this.state.camera.target },
      phi: this.state.camera.phi,
      theta: this.state.camera.theta,
      distance: this.state.camera.distance,
    };

    const toState = {
      target: { ...fromState.target, ...targetState.target },
      phi: targetState.phi ?? fromState.phi,
      theta: targetState.theta ?? fromState.theta,
      distance: targetState.distance ?? fromState.distance,
    };

    this.emit('camera:animation:start');
    animate({
      from: 0,
      to: 1,
      duration,
      ease,
      onUpdate: (latest) => {
        if (!this.state.camera) return;

        // Interpolate each property
        const newTarget = {
          x: fromState.target.x + (toState.target.x - fromState.target.x) * latest,
          y: fromState.target.y + (toState.target.y - fromState.target.y) * latest,
          z: fromState.target.z + (toState.target.z - fromState.target.z) * latest,
        };
        const newPhi = fromState.phi + (toState.phi - fromState.phi) * latest;
        const newTheta =
          fromState.theta + (toState.theta - fromState.theta) * latest;
        const newDistance =
          fromState.distance + (toState.distance - fromState.distance) * latest;

        // Update the state using the update function
        this.updateState({
          camera: {
            ...this.state.camera,
            target: newTarget,
            phi: newPhi,
            theta: newTheta,
            distance: newDistance,
          },
        });
      },
      onComplete: () => {
        this.emit('camera:animation:end');
      },
    });
  }

  /**
   * Calculates the required camera state to frame the given elements and then flies to it.
   * @param elements - The elements to frame.
   * @param options - Framing options like padding and duration.
   */
  public frame(
    elements: GraphElement[],
    options: { padding?: number; duration?: number } = {}
  ) {
    if (elements.length === 0) return;

    const { padding = 1.2, duration = 1000 } = options;

    const box = new THREE.Box3();

    for (const el of elements) {
      if (el.position) {
        box.expandByPoint(
          new THREE.Vector3(el.position.x, el.position.y, el.position.z)
        );
      }
    }

    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calculate distance to frame the object based on camera FOV
    const fov = this.threeCamera.fov * (Math.PI / 180);
    let distance = maxDim / 2 / Math.tan(fov / 2);
    distance *= padding; // Apply padding

    this.flyTo(
      {
        target: { x: center.x, y: center.y, z: center.z },
        distance: distance,
      },
      { duration }
    );
  }
}
