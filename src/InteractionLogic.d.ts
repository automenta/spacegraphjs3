import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec } from './types';
export declare class InteractionLogic {
    static handlePan(mx: number, my: number, state: Store<Spec>, updateState: (spec: Partial<Spec>) => void, threeCamera: THREE.PerspectiveCamera): void;
    static handleOrbit(mx: number, my: number, state: Store<Spec>, updateState: (spec: Partial<Spec>) => void): void;
    static handleNodeDrag(vx: number, vy: number, draggedElementId: string, dragPlane: THREE.Plane, rendererEl: HTMLElement, threeCamera: THREE.PerspectiveCamera, updateState: (spec: Partial<Spec>) => void): void;
}
