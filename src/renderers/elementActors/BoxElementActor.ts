import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseGeometryActor } from './BaseGeometryActor';

/**
 * An ElementActor for rendering box/cube nodes.
 */
export class BoxElementActor extends BaseGeometryActor {
  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Create box geometry with default size
    return new THREE.BoxGeometry(1, 1, 1);
  }
}