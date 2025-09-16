import { Scene, WebGLRenderer, PerspectiveCamera } from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export class RenderingManager {
  private renderer: WebGLRenderer;
  private cssRenderer: CSS3DRenderer;
  private scene: Scene;
  private cssScene: Scene;
  private camera: PerspectiveCamera;

  constructor(
    private container: HTMLElement,
  ) {
    this.scene = new Scene();
    this.cssScene = new Scene();
    this.camera = new PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000,
    );
    this.scene.add(this.camera);

    this.initRenderers();
    this.animate();

    window.addEventListener('resize', this.handleResize);
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getCssScene(): Scene {
    return this.cssScene;
  }

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public getRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  private initRenderers() {
    // Initialize WebGL Renderer
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Initialize CSS3D Renderer
    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.top = '0';
    this.cssRenderer.domElement.style.pointerEvents = 'none'; // Initially, let webgl handle events
    this.container.appendChild(this.cssRenderer.domElement);

    // Ensure container is positioned relatively to anchor the absolute CSS renderer
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
  }

  private handleResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
  };

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
    this.cssRenderer.render(this.cssScene, this.camera);
  };

  public dispose() {
    window.removeEventListener('resize', this.handleResize);

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }

    if (this.cssRenderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.cssRenderer.domElement);
    }
  }
}
