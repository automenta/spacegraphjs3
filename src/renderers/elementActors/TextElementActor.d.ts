import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';
/**
 * An ElementActor for rendering 3D text nodes.
 * This implementation loads fonts and creates TextGeometry for actual 3D text rendering.
 */
export declare class TextElementActor extends BaseElementActor {
    private readonly elementId;
    private glowMesh;
    private textMesh;
    private static fontLoader;
    private static defaultFont;
    private static fontLoadingPromise;
    private static fontUrl;
    constructor(scene: THREE.Scene, elementState: Store<NodeSpec>, graphState: Store<Spec>);
    init(): void;
    private loadFont;
    private loadFontAndCreateText;
    getRaycastableObject(): THREE.Object3D | null;
    update(): void;
    dispose(): void;
    private updateVisuals;
}
