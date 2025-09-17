import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { SpaceGraph } from '../core/SpaceGraph';
import { IRenderer } from '../renderers/IRenderer';
import { NodeRenderer } from '../renderers/NodeRenderer';
import { EdgeRenderer } from '../renderers/EdgeRenderer';
import { HTMLRenderer } from '../renderers/HTMLRenderer';
import { InstancedRenderer } from '../renderers/InstancedRenderer';

/**
 * Manages the THREE.js rendering environment, including the scene, camera, and renderer.
 * It also manages the different types of renderers for nodes, edges, etc.
 */
export class RenderingManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private cssRenderer: CSS2DRenderer;
  private scene: THREE.Scene;
  private cssScene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private graph: SpaceGraph;

  private nodeRenderer!: IRenderer;
  private edgeRenderer!: EdgeRenderer;
  private htmlRenderer!: HTMLRenderer;

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
    this.setupRenderers();
    this.initRenderers();
    this.initDynamicNodeRenderer();
    this.animate();
  }

  private setupRenderers() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.cssRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.top = '0px';
    this.container.appendChild(this.cssRenderer.domElement);
  }

  private initRenderers() {
    this.edgeRenderer = new EdgeRenderer(this.scene, this.graph.state);
    this.htmlRenderer = new HTMLRenderer(this.cssScene, this.graph.state);
  }

  private initDynamicNodeRenderer() {
    createEffect(() => {
      const nodeCount = this.graph.state.data?.nodes?.length ?? 0;
      const threshold = this.graph.state.performance?.instancingThreshold ?? 100;
      const shouldUseInstanced = nodeCount > threshold;

      const currentRendererType =
        this.nodeRenderer instanceof InstancedRenderer
          ? 'instanced'
          : 'default';

      if (shouldUseInstanced && currentRendererType !== 'instanced') {
        if (this.nodeRenderer) this.nodeRenderer.dispose();
        this.nodeRenderer = new InstancedRenderer(this.scene, this.graph.state);
      } else if (!shouldUseInstanced && currentRendererType !== 'default') {
        if (this.nodeRenderer) this.nodeRenderer.dispose();
        this.nodeRenderer = new NodeRenderer(this.scene, this.graph.state);
      }
    });
  }

  public getNodeRenderer(): IRenderer {
    return this.nodeRenderer;
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

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.cssRenderer.render(this.cssScene, this.camera);
  }

  public dispose() {
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.cssRenderer.domElement.parentNode) {
      this.cssRenderer.domElement.parentNode.removeChild(this.cssRenderer.domElement);
    }
    this.nodeRenderer.dispose();
    this.edgeRenderer.dispose();
    this.htmlRenderer.dispose();
  }
}
