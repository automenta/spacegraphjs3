import * as THREE from 'three';
import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { Element, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';

/**
 * An ElementActor for rendering sphere nodes.
 */
export class SphereElementActor extends BaseElementActor {
  private elementId: string;

  constructor(
    scene: THREE.Scene,
    elementState: Element,
    graphState: Store<Spec>,
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
  }

  public init(): void {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    geometry.computeBoundsTree();
    const material = new THREE.MeshBasicMaterial();
    this.threeObject = new THREE.Mesh(geometry, material);
    this.threeObject.userData.nodeId = this.elementId;
    this.scene.add(this.threeObject);

    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => this.update());
      return dispose;
    });
  }

  public update(): void {
    const isSelected = this.graphState.interaction.selectedElementIds.includes(this.elementId);
    const isHovered = this.graphState.interaction.hoveredElementId === this.elementId;

    const elementState = this.graphState.data.nodes.find(
      (n) => n.id === this.elementId,
    );
    if (!elementState) {
      // Node has been removed, actor will be disposed soon.
      return;
    }
    this.updateVisuals(elementState, isHovered, isSelected);
  }

  private updateVisuals(
    elementState: Element,
    isElementHovered: boolean,
    isElementSelected: boolean,
  ): void {
    if (!this.threeObject) return;
    const mesh = this.threeObject as THREE.Mesh<
      THREE.SphereGeometry,
      THREE.MeshBasicMaterial
    >;

    mesh.position.set(
      elementState.position?.x ?? 0,
      elementState.position?.y ?? 0,
      elementState.position?.z ?? 0,
    );

    const finalColor = new THREE.Color(elementState.color || '#ffffff'); // Start with default color

    if (isElementSelected) {
      const selectedColor = this.graphState.style['node:selected']?.color;
      if (selectedColor) {
        finalColor.set(selectedColor);
      }
    } else if (isElementHovered) {
      const hoveredColor = this.graphState.style['node:hover']?.color;
      if (hoveredColor) {
        finalColor.set(hoveredColor);
      }
    }

    mesh.material.color.copy(finalColor);
  }

  public dispose(): void {
    if (this.threeObject) {
      const mesh = this.threeObject as THREE.Mesh<THREE.SphereGeometry>;
      if (mesh.geometry.disposeBoundsTree) {
        mesh.geometry.disposeBoundsTree();
      }
    }
    super.dispose();
  }
}
