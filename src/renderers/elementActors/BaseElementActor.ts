import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../types';

/**
 * Base class for all Element Actors.
 * An ElementActor is responsible for creating and managing the Three.js object
 * for a single graph element (node or edge) and reacting to its state changes.
 */
export abstract class BaseElementActor {
  protected scene: THREE.Scene;
  protected elementState: Store<NodeSpec>;
  protected graphState: Store<Spec>;
  protected threeObject: THREE.Object3D | null = null;
  protected disposeEffect: (() => void) | null = null;

  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    this.scene = scene;
    this.elementState = elementState;
    this.graphState = graphState;
  }

  /**
   * Initializes the actor, creates its Three.js object, and sets up reactive effects.
   */
  public abstract init(): void;

  /**
   * Returns the Three.js object managed by this actor for raycasting.
   */
  public getRaycastableObject(): THREE.Object3D | null {
    return this.threeObject;
  }

  /**
   * Cleans up all resources, including Three.js objects and SolidJS effects.
   */
  public dispose(): void {
    if (this.threeObject) {
      // Only remove from scene if it's actually a child
      if (this.threeObject.parent === this.scene) {
        this.scene.remove(this.threeObject);
      }
      // Dispose of geometry and material if they are unique to this object
      if ((this.threeObject as THREE.Mesh).geometry) {
        (this.threeObject as THREE.Mesh).geometry.dispose();
      }
      if ((this.threeObject as THREE.Mesh).material) {
        if (Array.isArray((this.threeObject as THREE.Mesh).material)) {
          (
            (this.threeObject as THREE.Mesh).material as THREE.Material[]
          ).forEach((m) => m.dispose());
        } else {
          (
            (this.threeObject as THREE.Mesh).material as THREE.Material
          ).dispose();
        }
      }
      this.threeObject = null;
    }
    if (this.disposeEffect) {
      this.disposeEffect();
      this.disposeEffect = null;
    }
  }
}
