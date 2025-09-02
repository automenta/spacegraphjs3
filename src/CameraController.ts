import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { animate } from 'popmotion';
import { Spec, CameraSpec, Element } from './types';

export class CameraController {
  private state: Store<Spec>;
  private emit: (eventName: string, ...args: any[]) => void;

  constructor(state: Store<Spec>, emit: (eventName: string, ...args: any[]) => void) {
    this.state = state;
    this.emit = emit;
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
        this.state.camera.target.x = fromState.target.x + (toState.target.x - fromState.target.x) * latest;
        this.state.camera.target.y = fromState.target.y + (toState.target.y - fromState.target.y) * latest;
        this.state.camera.target.z = fromState.target.z + (toState.target.z - fromState.target.z) * latest;
        this.state.camera.phi = fromState.phi + (toState.phi - fromState.phi) * latest;
        this.state.camera.theta = fromState.theta + (toState.theta - fromState.theta) * latest;
        this.state.camera.distance = fromState.distance + (toState.distance - fromState.distance) * latest;
      },
      onComplete: () => {
        this.emit('camera:animation:end');
      }
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
        box.expandByPoint(new THREE.Vector3(el.position.x, el.position.y, el.position.z));
      }
    }

    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    // This is a rough approximation. A proper implementation would
    // need the camera's FOV. Assuming a default FOV around 50-75 degrees,
    // a distance of maxDim * 1.5 is a reasonable starting point.
    const distance = maxDim * 1.5 * padding;

    this.flyTo(
      {
        target: { x: center.x, y: center.y, z: center.z },
        distance: distance,
      },
      { duration }
    );
  }
}
