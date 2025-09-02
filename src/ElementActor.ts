import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { Element } from './types';
import { Writable } from 'stream';
import { SetStoreFunction } from 'solid-js/store';


// The state for a single element, wrapped in a SolidJS store proxy
export type ElementState = {
    get: () => Element;
    set: SetStoreFunction<Element>;
}

export class ElementActor {
  public object: THREE.Object3D;
  private material: THREE.MeshStandardMaterial;

  constructor(private elementState: Element) {

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);

    this.material = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        metalness: 0.8,
        roughness: 0.2
    });

    this.object = new THREE.Mesh(geometry, this.material);

    createEffect(() => {
      const state = this.elementState;

      if (state.color) {
        this.material.color.set(state.color);
      }

      if (state.pinning && typeof state.pinning === 'object') {
        this.object.position.set(state.pinning.x, state.pinning.y, state.pinning.z);
      } else {
        // give a random position if not pinned
        this.object.position.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
      }
    });
  }
}
