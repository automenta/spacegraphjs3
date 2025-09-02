import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { animate } from 'popmotion';
import { Spec, CameraSpec, Element } from './types';
import { createEffect } from 'solid-js';

export class CameraController {
  private state: Store<Spec>;
  private emit: (eventName: string, ...args: any[]) => void;
  private threeCamera: THREE.PerspectiveCamera;

  constructor(
    state: Store<Spec>,
    emit: (eventName: string, ...args: any[]) => void,
    threeCamera: THREE.PerspectiveCamera
  ) {
    this.state = state;
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

        // Interpolate each property and update the reactive state
        this.state.camera.target.x =
          fromState.target.x + (toState.target.x - fromState.target.x) * latest;
        this.state.camera.target.y =
          fromState.target.y + (toState.target.y - fromState.target.y) * latest;
        this.state.camera.target.z =
          fromState.target.z + (toState.target.z - fromState.target.z) * latest;
        this.state.camera.phi =
          fromState.phi + (toState.phi - fromState.phi) * latest;
        this.state.camera.theta =
          fromState.theta + (toState.theta - fromState.theta) * latest;
        this.state.camera.distance =
          fromState.distance + (toState.distance - fromState.distance) * latest;
      },
      onComplete: () => {
        this.emit('camera:animation:end');
      },
    });
  }

  public frame(
    elements: Element[],
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
