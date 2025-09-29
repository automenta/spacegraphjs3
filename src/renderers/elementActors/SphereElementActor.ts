import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseGeometryActor } from './BaseGeometryActor';

/**
 * An ElementActor for rendering sphere nodes.
 */
export class SphereElementActor extends BaseGeometryActor {
  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
  }

  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.SphereGeometry(0.5, 16, 16);
  }
}
