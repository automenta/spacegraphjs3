import * as THREE from 'three';
import { createEffect, createRoot, untrack } from 'solid-js';
import { Store } from 'solid-js/store';
import { Element, Spec, NodeStyle } from '../types';
import { BaseElementActor } from './BaseElementActor';

/**
 * An ElementActor for rendering sphere nodes.
 */
export class SphereElementActor extends BaseElementActor {
  private elementId: string;

  constructor(
    scene: THREE.Scene,
    elementState: Element,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
  }

  public init(): void {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    (geometry as any).computeBoundsTree();
    const material = new THREE.MeshBasicMaterial();
    this.threeObject = new THREE.Mesh(geometry, material);
    this.threeObject.userData.nodeId = this.elementId;
    this.scene.add(this.threeObject);

    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => {
        const elementState = this.graphState.data.nodes.find(n => n.id === this.elementId);
        if (!elementState) return;

        const hoveredId = this.graphState.interaction.hoveredElementId;
        const selectedIds = this.graphState.interaction.selectedElementIds;

        untrack(() => this.updateVisuals(elementState, hoveredId, selectedIds));
      });

      return dispose;
    });
  }

  private updateVisuals(
    elementState: Element,
    hoveredId: string | null,
    selectedIds: string[]
  ): void {
    if (!this.threeObject) return;
    const mesh = this.threeObject as THREE.Mesh<any, THREE.MeshBasicMaterial>;

    mesh.position.set(
      elementState.position?.x ?? 0,
      elementState.position?.y ?? 0,
      elementState.position?.z ?? 0
    );

    let finalColor = elementState.color || '#ffffff';
    const isSelected = selectedIds.includes(this.elementId);
    const isHovered = hoveredId === this.elementId;

    let style: NodeStyle | undefined;
    if (isSelected) {
      style = this.graphState.style['node:selected'];
    } else if (isHovered) {
      style = this.graphState.style['node:hover'];
    }

    if (style?.color) {
        finalColor = style.color;
    }

    mesh.material.color.set(finalColor);
  }

  public dispose(): void {
    if (this.threeObject) {
      const mesh = this.threeObject as THREE.Mesh;
      if (typeof (mesh.geometry as any).disposeBoundsTree === 'function') {
        (mesh.geometry as any).disposeBoundsTree();
      }
    }
    super.dispose();
  }
}
