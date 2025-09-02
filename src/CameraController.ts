import { Store } from 'solid-js/store';
import { animate } from 'popmotion';
import { Spec, CameraSpec } from './types';

export class CameraController {
  private state: Store<Spec>;

  constructor(state: Store<Spec>) {
    this.state = state;
  }

  public flyTo(
    target: Partial<CameraSpec>,
    options: { duration?: number; ease?: (t: number) => number } = {}
  ) {
    const { duration = 1000, ease } = options;

    // Ensure there's a camera state to animate
    if (!this.state.camera) return;

    const fromState: CameraSpec = {
      position: { ...this.state.camera.position },
      zoom: this.state.camera.zoom,
    };

    const toState: CameraSpec = {
      position: { ...fromState.position, ...target.position },
      zoom: target.zoom ?? fromState.zoom,
    };

    animate({
      from: 0,
      to: 1,
      duration,
      ease,
      onUpdate: (latest) => {
        // Directly mutate the reactive state. SolidJS will track these changes.
        if (this.state.camera) {
          if (toState.position.x !== fromState.position.x) {
            this.state.camera.position.x = fromState.position.x + (toState.position.x - fromState.position.x) * latest;
          }
          if (toState.position.y !== fromState.position.y) {
            this.state.camera.position.y = fromState.position.y + (toState.position.y - fromState.position.y) * latest;
          }
          if (toState.position.z !== fromState.position.z) {
            this.state.camera.position.z = fromState.position.z + (toState.position.z - fromState.position.z) * latest;
          }
          if (toState.zoom !== fromState.zoom) {
            this.state.camera.zoom = fromState.zoom + (toState.zoom - fromState.zoom) * latest;
          }
        }
      },
    });
  }

  public frame(elements: Element[], options?: any) {
    // TODO: This would calculate the bounding box of the elements
    // and then call flyTo to frame them.
    console.warn('frame() is not yet implemented.');
  }
}
