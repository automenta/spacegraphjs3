import * as THREE from 'three';
import { createEffect, createRoot, untrack } from 'solid-js';
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
    this.threeObject.userData.nodeId = this.elementState.id; // Store ID for raycasting
    this.scene.add(this.threeObject);

    // All reactive effects should be created within a `createRoot` context.
    // The returned `dispose` function is stored to be called when the actor is destroyed.
    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => {
        // By accessing properties of the state, we create reactive dependencies.
        // SolidJS will automatically re-run this effect when any of these properties change.
        const position = this.elementState.position;
        const color = this.elementState.color;
        const hoveredId = this.graphState.interaction.hoveredElementId;
        const selectedIds = this.graphState.interaction.selectedElementIds;
        const id = this.elementState.id;

        // Untrack the updateVisuals call to avoid circular dependencies.
        // We only want to re-run when the specific properties above change.
        untrack(() => this.updateVisuals(position, color, hoveredId, selectedIds, id));
      });

      return dispose;
    });
  }

  private updateVisuals(position, color, hoveredId, selectedIds, id): void {
    if (!this.threeObject) {
      console.warn(`updateVisuals: threeObject is null for ${this.elementState.id}`);
      return;
    }

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
    if (this.disposeEffect) {
      this.disposeEffect();
    }
    if (this.threeObject) {
      if ((this.threeObject as THREE.Mesh).geometry.disposeBoundsTree) {
        (this.threeObject as THREE.Mesh).geometry.disposeBoundsTree();
      }
    }
    super.dispose();
  }
}
