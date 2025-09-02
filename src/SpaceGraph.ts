import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { createStore, SetStoreFunction, reconcile } from 'solid-js/store';
import { mapArray } from 'solid-js';
import { Spec } from './types';
import { ElementActor } from './ElementActor';

export class SpaceGraph {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private state!: Spec; // Definite assignment in constructor
  private setState!: SetStoreFunction<Spec>;
  private actors: Map<string, ElementActor> = new Map();
  private running: boolean = false;
  private disposeRoot: () => void;

  constructor(private container: HTMLElement, initialSpec: Spec) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);

    // Create a reactive root to manage the lifecycle of our reactive state
    this.disposeRoot = createRoot((dispose) => {
      const [state, setState] = createStore(initialSpec);
      this.state = state;
      this.setState = setState;

      // Use mapArray for reactive rendering of nodes
      mapArray(
        () => this.state.data.nodes,
        (node) => {
          const actor = new ElementActor(node);
          this.actors.set(node.id, actor);
          this.scene.add(actor.object);
          return actor;
        },
        {
          onExit: (actor) => {
            this.scene.remove(actor.object);
            actor.dispose();
            this.actors.delete(actor['element'].id);
          },
        }
      );

      return dispose; // Return the dispose function to be called on cleanup
    });

    this.running = true;
    this.animate();

    window.addEventListener('resize', this.onWindowResize);
  }

  private animate = () => {
    if (!this.running) return;
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = () => {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  };

  public update = (spec: Partial<Spec>) => {
    this.setState(reconcile(spec));
  };

  public stop = () => {
    this.running = false;
  };

  public destroy = () => {
    this.running = false;
    window.removeEventListener('resize', this.onWindowResize);

    // Dispose the reactive root, which will trigger all cleanup
    this.disposeRoot();
    this.actors.clear();

    // Dispose of renderer and remove canvas
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }
  };
}
