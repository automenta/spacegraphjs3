import * as THREE from 'three';
import { createEffect, untrack } from 'solid-js';
import { Store } from 'solid-js/store';
import { Element, Spec } from '../types';
import { BaseElementActor } from './BaseElementActor';

/**
 * An ElementActor for rendering sphere nodes.
 */
export class SphereElementActor extends BaseElementActor {
  constructor(
    scene: THREE.Scene,
    elementState: Store<Element>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
  }

  public init(): void {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    geometry.computeBoundsTree();
    const material = new THREE.MeshBasicMaterial();
    this.threeObject = new THREE.Mesh(geometry, material);
    console.log(`SphereElementActor init: threeObject`, this.threeObject);
    this.threeObject.userData.nodeId = this.elementState.id; // Store ID for raycasting
    this.scene.add(this.threeObject);

    this.disposeEffect = createEffect(() => {
      // Depend on the elementState and graphState objects directly
      this.elementState; // Depend on the entire element state object
      this.graphState.interaction.hoveredElementId;
      this.graphState.interaction.selectedElementIds;

      this.updateVisuals();
    });

    // Initial update
    this.updateVisuals();
  }

  private updateVisuals(): void {
    if (!this.threeObject) {
      console.warn(`updateVisuals: threeObject is null for ${this.elementState.id}`);
      return;
    }
    console.log(`updateVisuals: threeObject material for ${this.elementState.id}`, (this.threeObject as THREE.Mesh).material);

    // Access properties directly to establish reactive dependencies
    const position = this.elementState.position;
    const color = this.elementState.color;
    const hoveredId = this.graphState.interaction.hoveredElementId;
    const selectedIds = this.graphState.interaction.selectedElementIds;
    const id = this.elementState.id;

    // Update position
    this.threeObject.position.set(
      position?.x ?? 0,
      position?.y ?? 0,
      position?.z ?? 0
    );

    // Update color based on state (default, hover, select)
    let finalColor = color || '#ffffff'; // Default color

    const isSelected = selectedIds.includes(id);
    const isHovered = hoveredId === id;

    // Apply styles with precedence: selected > hover > default
    if (isSelected) {
      finalColor = this.graphState.style?.['node:selected']?.color || finalColor;
    } else if (isHovered) {
      finalColor = this.graphState.style?.['node:hover']?.color || finalColor;
    }

    (this.threeObject.material as THREE.MeshBasicMaterial).color.set(finalColor);
  }

  public dispose(): void {
    if (this.threeObject) {
      if ((this.threeObject as THREE.Mesh).geometry.disposeBoundsTree) {
        (this.threeObject as THREE.Mesh).geometry.disposeBoundsTree();
      }
    }
    super.dispose();
  }
}
