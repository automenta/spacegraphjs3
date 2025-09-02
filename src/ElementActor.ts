import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { Element } from './types';

// Note: The 'Element' type here is a reactive proxy from a SolidJS store.
export class ElementActor {
  public object: THREE.Mesh;
  private material: THREE.MeshStandardMaterial;

  constructor(private element: Element) {
    // 1. Create the material. It's shared across geometries.
    this.material = new THREE.MeshStandardMaterial({
      color: '#ffffff', // Default color
      metalness: 0.8,
      roughness: 0.2,
    });

    // 2. Create a placeholder mesh. The geometry will be set reactively.
    // Using a basic BoxGeometry as a default placeholder.
    this.object = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.material);

    // 3. Create a reactive effect that updates the actor based on state changes.
    createEffect(() => {
      // Update geometry based on type
      // This is a simplified example. A real implementation might need to
      // dispose of old geometries and handle more types.
      const currentGeometry = this.object.geometry;
      let newGeometry: THREE.BufferGeometry;

      switch (this.element.type) {
        case 'sphere':
          if (!(currentGeometry instanceof THREE.SphereGeometry)) {
            newGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            this.object.geometry.dispose();
            this.object.geometry = newGeometry;
          }
          break;
        case 'box':
          if (!(currentGeometry instanceof THREE.BoxGeometry)) {
            newGeometry = new THREE.BoxGeometry(1, 1, 1);
            this.object.geometry.dispose();
            this.object.geometry = newGeometry;
          }
          break;
        default:
          // Default to sphere if type is unknown or not specified
          if (!(currentGeometry instanceof THREE.SphereGeometry)) {
            newGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            this.object.geometry.dispose();
            this.object.geometry = newGeometry;
          }
          break;
      }

      // Update color
      if (this.element.color) {
        this.material.color.set(this.element.color);
      }

      // Update position
      if (this.element.pinning && typeof this.element.pinning === 'object') {
        this.object.position.set(
          this.element.pinning.x,
          this.element.pinning.y,
          this.element.pinning.z
        );
      } else if (!this.object.position.lengthSq()) {
        // Only set random position if it hasn't been set before.
        // This prevents objects from jumping around on every unrelated state change.
        this.object.position.set(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        );
      }
    });
  }

  // Proper cleanup of resources
  public dispose() {
    this.object.geometry.dispose();
    this.material.dispose();
  }
}
