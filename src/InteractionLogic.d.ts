import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec, SpecUpdate } from './types';
export declare class InteractionLogic {
  static handlePan(
    mx: number,
    my: number,
    state: Store<Spec>,
    updateState: (spec: SpecUpdate) => void,
    threeCamera: THREE.PerspectiveCamera
  ): void;
  static handleOrbit(
    mx: number,
    my: number,
    state: Store<Spec>,
    updateState: (spec: SpecUpdate) => void
  ): void;
  static handleNodeDrag(
    vx: number,
    vy: number,
    draggedElementId: string,
    dragPlane: THREE.Plane,
    rendererEl: HTMLElement,
    threeCamera: THREE.PerspectiveCamera,
    updateState: (spec: SpecUpdate) => void
  ): void;
}
