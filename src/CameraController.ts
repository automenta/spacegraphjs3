import { Store } from 'solid-js/store';
import { animate } from 'popmotion';
import { Spec, CameraSpec } from './types';

export class CameraController {
  private state: Store<Spec>;

  constructor(state: Store<Spec>) {
    this.state = state;
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
    });
  }

  public frame(elements: Element[], options?: any) {
    // TODO: This would calculate the bounding box of the elements
    // and then call flyTo to frame them.
    console.warn('frame() is not yet implemented.');
  }
}
