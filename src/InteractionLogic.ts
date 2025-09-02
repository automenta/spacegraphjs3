import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec } from './types';

export class InteractionLogic {
  public static handlePan(
    mx: number,
    my: number,
    state: Store<Spec>,
    updateState: (spec: Partial<Spec>) => void,
    threeCamera: THREE.PerspectiveCamera
  ) {
    if (!state.camera) return;
    const panSpeed = 0.001 * state.camera.distance;

    const right = new THREE.Vector3().setFromMatrixColumn(
      threeCamera.matrix,
      0
    );
    const up = new THREE.Vector3().setFromMatrixColumn(threeCamera.matrix, 1);

    const panOffset = new THREE.Vector3()
      .copy(right)
      .multiplyScalar(-mx * panSpeed)
      .add(up.clone().multiplyScalar(my * panSpeed));

    const newTarget = {
      x: state.camera.target.x + panOffset.x,
      y: state.camera.target.y + panOffset.y,
      z: state.camera.target.z + panOffset.z,
    };

    updateState({
      camera: { ...state.camera, target: newTarget },
    });
  }

  public static handleOrbit(
    mx: number,
    my: number,
    state: Store<Spec>,
    updateState: (spec: Partial<Spec>) => void
  ) {
    if (!state.camera) return;
    const rotateSpeed = 0.005;
    const newTheta = state.camera.theta - mx * rotateSpeed;
    let newPhi = state.camera.phi - my * rotateSpeed;
    newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, newPhi));
    updateState({
      camera: { ...state.camera, theta: newTheta, phi: newPhi },
    });
  }

  public static handleNodeDrag(
    vx: number,
    vy: number,
    draggedElementId: string,
    dragPlane: THREE.Plane,
    rendererEl: HTMLElement,
    threeCamera: THREE.PerspectiveCamera,
    state: Store<Spec>
  ) {
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    const { width, height } = rendererEl.getBoundingClientRect();
    pointer.x = (vx / width) * 2 - 1;
    pointer.y = -(vy / height) * 2 + 1;

    raycaster.setFromCamera(pointer, threeCamera);

    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, intersection);

    const element = state.data.nodes.find((n) => n.id === draggedElementId);

    if (element) {
      element.position = {
        x: intersection.x,
        y: intersection.y,
        z: intersection.z,
      };
    }
  }
}
