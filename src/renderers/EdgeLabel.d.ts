import * as THREE from 'three';
import { EdgeSpec, NodeSpec } from '../types';
/**
 * A class for rendering 3D text labels on edges.
 * This implementation creates actual 3D text geometry for edge labels.
 */
export declare class EdgeLabel {
    private static fontLoader;
    private static defaultFont;
    private static fontLoadingPromise;
    private static fontUrl;
    private scene;
    private edge;
    private sourceNode;
    private targetNode;
    private textMesh;
    private backgroundMesh;
    private group;
    private label;
    constructor(scene: THREE.Scene, edge: EdgeSpec, sourceNode: NodeSpec, targetNode: NodeSpec);
    init(): Promise<void>;
    private loadFont;
    private loadFontAndCreateText;
    positionLabel(): void;
    updateStyle(isHovered?: boolean, isSelected?: boolean): void;
    dispose(): void;
    getObject(): THREE.Group;
}
