import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseGeometryActor } from './BaseGeometryActor';

/**
 * An ElementActor for rendering nodes with custom geometries.
 */
export class CustomGeometryActor extends BaseGeometryActor {
  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Create a default geometry (icosahedron) if none is provided
    if (this.elementState.data?.geometry) {
      return this.elementState.data.geometry;
    }
    
    return new THREE.IcosahedronGeometry(0.5, 0);
  }

  protected createGlowGeometry(): THREE.BufferGeometry {
    // For glow, we clone the main geometry
    return this.createGeometry().clone();
  }
}