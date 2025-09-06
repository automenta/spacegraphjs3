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

    // Use untrack to access elementState properties without creating new dependencies
    const position = untrack(() => this.elementState.position);
    const color = untrack(() => this.elementState.color);
    console.log(`updateVisuals for ${this.elementState.id}: position`, position);

    // Update position
    this.threeObject.position.set(
      position?.x ?? 0,
      position?.y ?? 0,
      position?.z ?? 0
    );

    // Update color based on state (default, hover, select)
    const hoveredId = untrack(() => this.graphState.interaction.hoveredElementId);
    const selectedIds = untrack(() => this.graphState.interaction.selectedElementIds);
    let finalColor = color || '#ffffff'; // Default color

    const isSelected = selectedIds.includes(untrack(() => this.elementState.id));
    const isHovered = hoveredId === untrack(() => this.elementState.id);

    // Apply styles with precedence: selected > hover > default
    if (isSelected) {
      finalColor = untrack(() => this.graphState.style?.['node:selected']?.color) || finalColor;
    } else if (isHovered) {
      finalColor = untrack(() => this.graphState.style?.['node:hover']?.color) || finalColor;
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
