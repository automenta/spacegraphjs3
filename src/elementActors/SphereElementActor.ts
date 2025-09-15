import { THREE } from '../utils/three';
import { createEffect, createRoot, untrack, createMemo, createSignal } from 'solid-js';
import { Store } from 'solid-js/store';
import { Element, Spec, NodeStyle } from '../types';
import { BaseElementActor } from './BaseElementActor';

/**
 * An ElementActor for rendering sphere nodes.
 */
export class SphereElementActor extends BaseElementActor {
  private elementId: string;
  private _selectedIds: () => string[];
  private setSelectedIds: (ids: string[]) => void;

  constructor(
    scene: THREE.Scene,
    elementState: Element,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
    [this._selectedIds, this.setSelectedIds] = createSignal<string[]>([]);
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
        // Update the local signal when the store's selectedIds change
        this.setSelectedIds([...this.graphState.interaction.selectedElementIds]);
      });

      createEffect(() => {
        const elementState = this.graphState.data.nodes.find(n => n.id === this.elementId);
        if (!elementState) return;

        const hoveredId = this.graphState.interaction.hoveredElementId;
        const selectedIds = this._selectedIds();

        const isElementSelected = createMemo(() => selectedIds.includes(this.elementId));
        const isElementHovered = createMemo(() => hoveredId === this.elementId);

        this.updateVisuals(elementState, isElementHovered(), isElementSelected());
      });

      return dispose;
    });
  }



  private updateVisuals(
    elementState: Element,
    isElementHovered: boolean,
    isElementSelected: boolean
  ): void {
    if (!this.threeObject) return;
    const mesh = this.threeObject as THREE.Mesh<any, THREE.MeshBasicMaterial>;

    mesh.position.set(
      elementState.position?.x ?? 0,
      elementState.position?.y ?? 0,
      elementState.position?.z ?? 0
    );

    let finalColor = new THREE.Color(elementState.color || '#ffffff'); // Start with default color

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
      const mesh = this.threeObject as THREE.Mesh;
      if (typeof (mesh.geometry as any).disposeBoundsTree === 'function') {
        (mesh.geometry as any).disposeBoundsTree();
      }
    }
    super.dispose();
  }
}
