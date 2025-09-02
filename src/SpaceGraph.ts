import * as THREE from 'three';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { Spec } from './types';
import { ElementActor } from './ElementActor';

export class SpaceGraph {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private state: Spec;
  private setState: SetStoreFunction<Spec>;
  private actors: Map<string, ElementActor> = new Map();

  constructor(private container: HTMLElement, initialSpec: Spec) {

    [this.state, this.setState] = createStore(initialSpec);

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

    this.state.data.nodes.forEach(node => {
      const actor = new ElementActor(node);
      this.actors.set(node.id, actor);
      this.scene.add(actor.object);
    });

    this.animate();

    window.addEventListener('resize', this.onWindowResize);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = () => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public destroy = () => {
    window.removeEventListener('resize', this.onWindowResize);
    this.container.removeChild(this.renderer.domElement);
    // Note: Add proper disposal of Three.js resources later
  };
}
