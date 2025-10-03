import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { SpaceGraph } from '../core/SpaceGraph';
import { IRenderer } from '../renderers/IRenderer';
import { NodeRenderer } from '../renderers/NodeRenderer';
import { EdgeRenderer } from '../renderers/EdgeRenderer';
import { HTMLRenderer } from '../renderers/HTMLRenderer';
import { InstancedRenderer } from '../renderers/InstancedRenderer';
import { BasicRenderer } from '../renderers/BasicRenderer';
import { ThreeObjectPoolManager } from '../utils/ThreeObjectPoolManager';
import { LODManager } from '../utils/LODManager';
import { CullingManager } from '../utils/CullingManager';
import { MemoryManager } from '../utils/MemoryManager';
import { AdvancedRenderingOptimizer } from '../utils/UnifiedPerformanceSystem';

/**
 * Manages the THREE.js rendering environment, including the scene, camera, and renderer.
 * It also manages the different types of renderers for nodes, edges, etc.
 */
export class RenderingManager {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cssRenderer: CSS2DRenderer;
  private readonly css3DRenderer: CSS3DRenderer;
  private readonly scene: THREE.Scene;
  private readonly cssScene: THREE.Scene;
  private readonly css3DScene: THREE.Scene;
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
  private renderingOptimizer!: AdvancedRenderingOptimizer;
  private lastFrameTime: number = performance.now();

  constructor(graph: SpaceGraph, container: HTMLElement) {
    this.graph = graph;
    this.container = container;
    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.css3DScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer();
    this.cssRenderer = new CSS2DRenderer();
    this.css3DRenderer = new CSS3DRenderer();
    this.objectPoolManager = ThreeObjectPoolManager.getInstance();
    this.setupPerformanceSystems();
    this.setupRenderers();
    this.initRenderers();
    this.initDynamicNodeRenderer();
    this.animate();
  }

  /**
   * Initialize the rendering optimizer after the graph is fully initialized
   */
  public initRenderingOptimizer(): void {
    if (!this.renderingOptimizer) {
      this.renderingOptimizer = new AdvancedRenderingOptimizer(this.graph);
    }
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
    if (this.css3DRenderer.domElement.parentNode) {
      this.css3DRenderer.domElement.parentNode.removeChild(
        this.css3DRenderer.domElement
      );
    }
    if (this.nodeRenderer) {
      this.nodeRenderer.dispose();
    }
    this.edgeRenderer.dispose();
    this.htmlRenderer.dispose();

    // Dispose rendering optimizer if it exists
    if (this.renderingOptimizer) {
      this.renderingOptimizer.dispose();
    }
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
      // For LOD, we need to define levels - using a more realistic approach
      const settings = {
        distances: [50, 100, 200],
        detailLevels: [
          () => mesh, // Full detail - original mesh
          () => {
            // Medium detail - simplified version (in a real implementation, this would be a lower-poly version)
            return mesh;
          },
          () => {
            // Low detail - billboard or point sprite (in a real implementation, this would be much simpler)
            return mesh;
          },
        ],
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
    this._setupRenderer(this.css3DRenderer, {
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
    // Add touch-action style to prevent browser interference with gestures
    renderer.domElement.style.touchAction = 'none';
    this.container.appendChild(renderer.domElement);
  }

  private handleResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
    this.css3DRenderer.setSize(width, height);
  };

  private initRenderers() {
    this.edgeRenderer = new EdgeRenderer(this.scene, this.graph.state);
    this.htmlRenderer = new HTMLRenderer(
      this.cssScene,
      this.css3DScene,
      this.graph.state
    );
  }

  private initDynamicNodeRenderer() {
    createEffect(() => {
      const nodeCount = this.graph.state.data?.nodes?.length ?? 0;
      const threshold =
        this.graph.state.performance?.instancingThreshold ?? 100;
      const shouldUseInstanced = nodeCount > threshold;
      const useBasicRenderer =
        this.graph.state.performance?.useBasicRenderer ?? false;

      // Determine which renderer we should be using
      let targetRendererType:
        | 'NodeRenderer'
        | 'InstancedRenderer'
        | 'BasicRenderer';
      if (!shouldUseInstanced) {
        targetRendererType = 'NodeRenderer';
      } else if (useBasicRenderer) {
        targetRendererType = 'BasicRenderer';
      } else {
        targetRendererType = 'InstancedRenderer';
      }

      // Check if we need to switch renderers
      const currentRendererType = this.nodeRenderer?.constructor.name;
      const needsUpdate =
        !this.nodeRenderer || currentRendererType !== targetRendererType;

      if (needsUpdate) {
        if (this.nodeRenderer) {
          this.nodeRenderer.dispose();
        }

        if (targetRendererType === 'InstancedRenderer') {
          this.nodeRenderer = new InstancedRenderer(
            this.scene,
            this.graph.state,
            SpaceGraph.getInstancedGeometryRegistry()
          );
        } else if (targetRendererType === 'BasicRenderer') {
          this.nodeRenderer = new BasicRenderer(
            this.scene,
            this.graph.state,
            this.css3DScene
          );
        } else {
          this.nodeRenderer = new NodeRenderer(
            this.scene,
            this.css3DScene,
            this.graph.state,
            SpaceGraph.getElementActorRegistry()
          );
        }
      }
    });
  }

  private animate() {
    if (!this.isLooping) return;

    const currentTime = performance.now();
    const delta = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    try {
      // Update rendering optimizer if it exists
      if (this.renderingOptimizer) {
        this.renderingOptimizer.update(delta);
      }

      // Call pre-render plugin methods
      const plugins = (this.graph as any).plugins || [];
      for (const plugin of plugins) {
        if (plugin.onPreRender) {
          try {
            plugin.onPreRender(delta);
          } catch (error) {
            console.error(`Error in plugin ${plugin.id} onPreRender:`, error);
          }
        }
      }

      // Update camera controls
      this.graph.cameraPlugin?.update();

      // Update LOD system if enabled
      if (this.lodManager) {
        this.lodManager.setCamera(this.camera);
        this.lodManager.update();
      }

      // Update culling system if enabled
      if (this.cullingManager) {
        this.cullingManager.setCamera(this.camera);
        this.cullingManager.updateFrustum();
        // In a more sophisticated implementation, we would use the culling results
        // to optimize rendering, but for now we'll just update the system
      }

      this.renderer.render(this.scene, this.camera);
      this.cssRenderer.render(this.cssScene, this.camera);
      this.css3DRenderer.render(this.css3DScene, this.camera);

      // Call post-render plugin methods
      for (const plugin of plugins) {
        if (plugin.onPostRender) {
          try {
            plugin.onPostRender(delta);
          } catch (error) {
            console.error(`Error in plugin ${plugin.id} onPostRender:`, error);
          }
        }
      }
    } catch (error) {
      this.isLooping = false; // Stop the animation loop
      this.displayError(
        new Error(`Rendering failed: ${(error as Error).message}`)
      );
      return; // Exit the animate loop
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
