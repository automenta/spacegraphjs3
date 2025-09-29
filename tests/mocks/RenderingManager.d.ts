import * as THREE from 'three';
export declare class RenderingManager {
    scene: THREE.Scene;
    cssScene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    container: HTMLElement;
    renderer: any;
    cssRenderer: any;
    nodeRenderer: any;
    edgeRenderer: any;
    htmlRenderer: any;
    dispose: import("vitest").Mock<(...args: any[]) => any>;
    constructor();
    getScene: () => THREE.Scene;
    getCamera: () => THREE.PerspectiveCamera;
    getContainer: () => HTMLElement;
    getRendererDomElement: () => any;
    getRenderer: () => any;
    getNodeRenderer: () => any;
    getEdgeRenderer: () => any;
}
