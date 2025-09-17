import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec, SpecUpdate } from './types';

export class InteractionLogic {
  public static handlePan(
    mx: number,
    my: number,
    state: Store<Spec>,
    updateState: (spec: SpecUpdate) => void,
    threeCamera: THREE.PerspectiveCamera,
  ) {
    if (!state.camera) return;
    const panSpeed = 0.001 * state.camera.distance;

    const right = new THREE.Vector3().setFromMatrixColumn(
      threeCamera.matrix,
      0,
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
    updateState: (spec: SpecUpdate) => void,
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

  public static handleKeyZoom(
    state: Store<Spec>,
    updateState: (spec: SpecUpdate) => void,
    direction: 'in' | 'out',
    zoomSpeed: number,
  ) {
    if (!state.camera) return;
    const newDistance =
      direction === 'in'
        ? state.camera.distance - zoomSpeed
        : state.camera.distance + zoomSpeed;
    updateState({
      camera: {
        distance: Math.max(0.1, newDistance),
      },
    });
  }

  public static handleKeyOrbit(
    state: Store<Spec>,
    updateState: (spec: SpecUpdate) => void,
    direction: 'left' | 'right' | 'up' | 'down',
    orbitSpeed: number,
  ) {
    if (!state.camera) return;
    let newTheta = state.camera.theta;
    let newPhi = state.camera.phi;

    switch (direction) {
      case 'left':
        newTheta += orbitSpeed;
        break;
      case 'right':
        newTheta -= orbitSpeed;
        break;
      case 'up':
        newPhi -= orbitSpeed;
        break;
      case 'down':
        newPhi += orbitSpeed;
        break;
    }

    newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, newPhi));
    updateState({
      camera: { ...state.camera, theta: newTheta, phi: newPhi },
    });
  }

  public static handleKeyPan(
    state: Store<Spec>,
    updateState: (spec: SpecUpdate) => void,
    direction: 'forward' | 'backward' | 'left' | 'right',
    panSpeed: number,
    threeCamera: THREE.PerspectiveCamera,
  ) {
    if (!state.camera) return;

    const right = new THREE.Vector3().setFromMatrixColumn(
      threeCamera.matrix,
      0,
    );
    const forward = new THREE.Vector3();
    threeCamera.getWorldDirection(forward);
    const panOffset = new THREE.Vector3();

    switch (direction) {
      case 'left':
        panOffset.copy(right).multiplyScalar(-panSpeed);
        break;
      case 'right':
        panOffset.copy(right).multiplyScalar(panSpeed);
        break;
      case 'forward':
        panOffset.copy(forward).multiplyScalar(panSpeed);
        break;
      case 'backward':
        panOffset.copy(forward).multiplyScalar(-panSpeed);
        break;
    }

    const newTarget = {
      x: state.camera.target.x + panOffset.x,
      y: state.camera.target.y + panOffset.y,
      z: state.camera.target.z + panOffset.z,
    };

    updateState({
      camera: { ...state.camera, target: newTarget },
    });
  }

  public static handleNodeDrag(
    vx: number,
    vy: number,
    draggedElementId: string,
    dragPlane: THREE.Plane,
    rendererEl: HTMLElement,
    threeCamera: THREE.PerspectiveCamera,
    updateState: (spec: SpecUpdate) => void,
  ) {
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    // Convert screen coordinates to normalized device coordinates
    const { width, height } = rendererEl.getBoundingClientRect();
    pointer.x = (vx / width) * 2 - 1;
    pointer.y = -(vy / height) * 2 + 1;

    // Find intersection with the drag plane
    raycaster.setFromCamera(pointer, threeCamera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, intersection);

    // Create the update payload for the reactive state
    const newPosition = {
      x: intersection.x,
      y: intersection.y,
      z: intersection.z,
    };

    // Update the state using the provided function
    updateState({
      data: {
        nodes: {
          update: [{ id: draggedElementId, position: newPosition }],
        },
      },
    });
  }
}
