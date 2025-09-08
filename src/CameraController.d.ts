import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec, CameraSpec, Element } from './types';
export declare class CameraController {
    private state;
    private updateState;
    private emit;
    private threeCamera;
    constructor(state: Store<Spec>, updateState: (spec: Partial<Spec>) => void, emit: (eventName: string, ...args: any[]) => void, threeCamera: THREE.PerspectiveCamera);
    /**
     * Animates the camera to a new state.
     * @param targetState - The target camera state.
     * @param options - Animation options like duration and easing.
     */
    flyTo(targetState: Partial<CameraSpec>, options?: {
        duration?: number;
        ease?: (t: number) => number;
    }): void;
    /**
     * Calculates the required camera state to frame the given elements and then flies to it.
     * @param elements - The elements to frame.
     * @param options - Framing options like padding and duration.
     */
    frame(elements: Element[], options?: {
        padding?: number;
        duration?: number;
    }): void;
}
