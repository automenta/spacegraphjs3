import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { safeDisposeObject } from '../../utils/ThreeUtils';

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
      safeDisposeObject(this.threeObject);
      this.threeObject = null;
    }
    if (this.disposeEffect) {
      this.disposeEffect();
      this.disposeEffect = null;
    }
  }
}
