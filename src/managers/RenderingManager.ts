import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { SpaceGraph } from '../core/SpaceGraph';
import { IRenderer } from '../renderers/IRenderer';
import { NodeRenderer } from '../renderers/NodeRenderer';
import { EdgeRenderer } from '../renderers/EdgeRenderer';
import { HTMLRenderer } from '../renderers/HTMLRenderer';
import { InstancedRenderer } from '../renderers/InstancedRenderer';
import { ThreeObjectPoolManager } from '../utils/ThreeObjectPoolManager';
import { LODManager } from '../utils/LODManager';
import { CullingManager } from '../utils/CullingManager';
import { MemoryManager } from '../utils/MemoryManager';
import { safeDisposeObject } from '../utils/threeUtils';

/**
 * Manages the THREE.js rendering environment, including the scene, camera, and renderer.
 * It also manages the different types of renderers for nodes, edges, etc.
 */
export class RenderingManager {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cssRenderer: CSS2DRenderer;
  private readonly scene: THREE.Scene;
  private readonly cssScene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private graph: SpaceGraph;

  private nodeRenderer!: IRenderer;
  private edgeRenderer!: EdgeRenderer;
  private htmlRenderer!: HTMLRenderer;
  private isLooping = true;

  // Performance optimization systems
  private objectPoolManager: ThreeObjectPoolManager;
  private lodManager?: LODManager;
  private cullingManager?: CullingManager;
  private memoryManager?: MemoryManager;

  constructor(graph: SpaceGraph, container: HTMLElement) {
    this.graph = graph;
    this.container = container;
    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer();
    this.cssRenderer = new CSS2DRenderer();
    this.objectPoolManager = ThreeObjectPoolManager.getInstance();
    this.setupPerformanceSystems();
    this.setupRenderers();
    this.initRenderers();
    this.initDynamicNodeRenderer();
    this.animate();
  }

  public getNodeRenderer(): IRenderer {
    return this.nodeRenderer;
  }

  public getEdgeRenderer(): EdgeRenderer {
    return this.edgeRenderer;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  public getRendererDomElement(): HTMLElement {
    return this.renderer.domElement;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public dispose() {
    this.isLooping = false;
    window.removeEventListener('resize', this.handleResize);

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.cssRenderer.domElement.parentNode) {
      this.cssRenderer.domElement.parentNode.removeChild(
        this.cssRenderer.domElement
      );
    }
    if (this.nodeRenderer) {
      this.nodeRenderer.dispose();
    }
    this.edgeRenderer.dispose();
    this.htmlRenderer.dispose();
  }

  /**
   * Creates a performance-aware node with automatic optimization handling.
   * Integrates with object pooling, LOD, and culling systems when enabled.
   */
  public createOptimizedNode(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position?: THREE.Vector3
  ): THREE.Object3D {
    // Create mesh (in a real implementation, we would use object pooling here)
    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply initial position
    if (position) {
      mesh.position.copy(position);
    }
    
    // Register with LOD system if enabled
    if (this.lodManager) {
      // For LOD, we need to define levels - using a simplified approach for now
      const settings = {
        distances: [50, 100, 200],
        detailLevels: [
          () => mesh, // Full detail
          () => mesh, // Medium detail (simplified in this example)
          () => mesh  // Low detail (simplified in this example)
        ]
      };
      this.lodManager.registerObject(mesh, settings);
    }
    
    // Register with culling system if enabled
    if (this.cullingManager) {
      this.cullingManager.registerObject(mesh);
    }
    
    return mesh;
  }

  private setupPerformanceSystems(): void {
    // Setup LOD system
    if (this.graph.state.performance?.enableLOD) {
      this.lodManager = new LODManager();
    }

    // Setup culling system
    if (this.graph.state.performance?.enableCulling) {
      this.cullingManager = new CullingManager();
    }

    // Setup memory management
    if (this.graph.state.performance?.enableMemoryManagement) {
      this.memoryManager = MemoryManager.getInstance();
    }
  }

  private setupRenderers() {
    this._setupRenderer(this.renderer);
    this._setupRenderer(this.cssRenderer, {
      position: 'absolute',
      top: '0px',
      pointerEvents: 'none',
    });

    window.addEventListener('resize', this.handleResize);
  }

  private _setupRenderer(
    renderer: THREE.WebGLRenderer | CSS2DRenderer,
    styles?: Partial<CSSStyleDeclaration>
  ) {
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    if (styles) {
      Object.assign(renderer.domElement.style, styles);
    }
    this.container.appendChild(renderer.domElement);
  }

  private handleResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
  };

  private initRenderers() {
    this.edgeRenderer = new EdgeRenderer(this.scene, this.graph.state);
    this.htmlRenderer = new HTMLRenderer(this.cssScene, this.graph.state);
  }

  private initDynamicNodeRenderer() {
    createEffect(() => {
      const nodeCount = this.graph.state.data?.nodes?.length ?? 0;
      const threshold =
        this.graph.state.performance?.instancingThreshold ?? 100;
      const shouldUseInstanced = nodeCount > threshold;

      const needsUpdate =
        !this.nodeRenderer ||
        (shouldUseInstanced &&
          !(this.nodeRenderer instanceof InstancedRenderer)) ||
        (!shouldUseInstanced && this.nodeRenderer instanceof InstancedRenderer);

      if (needsUpdate) {
        if (this.nodeRenderer) {
          this.nodeRenderer.dispose();
        }

        if (shouldUseInstanced) {
          this.nodeRenderer = new InstancedRenderer(
            this.scene,
            this.graph.state,
            SpaceGraph.getInstancedGeometryRegistry()
          );
        } else {
          this.nodeRenderer = new NodeRenderer(
            this.scene,
            this.graph.state,
            SpaceGraph.getElementActorRegistry()
          );
        }
      }
    });
  }

  private animate() {
    if (!this.isLooping) return;

    try {
      // Update camera controls
      this.graph.cameraPlugin?.update();

      this.renderer.render(this.scene, this.camera);
      this.cssRenderer.render(this.cssScene, this.camera);
    } catch (error) {
      this.isLooping = false; // Stop the animation loop
      console.error('Rendering failed:', error);
      this.displayError(error as Error); // Display a user-friendly error
    }

    requestAnimationFrame(this.animate.bind(this));
  }

  private displayError(error: Error) {
    // Clear the container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Create and style the error message
    const errorElement = document.createElement('div');
    errorElement.style.color = 'red';
    errorElement.style.padding = '20px';
    errorElement.style.fontFamily = 'monospace';
    errorElement.innerHTML = `
      <h2>Something went wrong</h2>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    `;
    this.container.appendChild(errorElement);
  }
}
