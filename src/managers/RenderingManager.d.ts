import * as THREE from 'three';
import { SpaceGraph } from '../core/SpaceGraph';
import { IRenderer } from '../renderers/IRenderer';
import { EdgeRenderer } from '../renderers/EdgeRenderer';
/**
 * Manages the THREE.js rendering environment, including the scene, camera, and renderer.
 * It also manages the different types of renderers for nodes, edges, etc.
 */
export declare class RenderingManager {
    private readonly container;
    private readonly renderer;
    private readonly cssRenderer;
    private readonly scene;
    private readonly cssScene;
    private readonly camera;
    private graph;
    private nodeRenderer;
    private edgeRenderer;
    private htmlRenderer;
    private isLooping;
    private objectPoolManager;
    private lodManager?;
    private cullingManager?;
    private memoryManager?;
    constructor(graph: SpaceGraph, container: HTMLElement);
    getNodeRenderer(): IRenderer;
    getEdgeRenderer(): EdgeRenderer;
    getScene(): THREE.Scene;
    getCamera(): THREE.PerspectiveCamera;
    getContainer(): HTMLElement;
    getRendererDomElement(): HTMLElement;
    getRenderer(): THREE.WebGLRenderer;
    dispose(): void;
    /**
     * Creates a performance-aware node with automatic optimization handling.
     * Integrates with object pooling, LOD, and culling systems when enabled.
     */
    createOptimizedNode(geometry: THREE.BufferGeometry, material: THREE.Material, position?: THREE.Vector3): THREE.Object3D;
    private setupPerformanceSystems;
    private setupRenderers;
    private _setupRenderer;
    private handleResize;
    private initRenderers;
    private initDynamicNodeRenderer;
    private animate;
    private displayError;
}
