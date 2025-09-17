import * as THREE from 'three';
import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { Element, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';
import { expandHex } from '../../utils/color';

/**
 * An ElementActor for rendering sphere nodes.
 */
export class SphereElementActor extends BaseElementActor {
  private elementId: string;
  private glowMesh!: THREE.Mesh;

  constructor(
    scene: THREE.Scene,
    elementState: Element,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
  }

  public init(): void {
    const group = new THREE.Group();
    this.threeObject = group;
    this.threeObject.userData.nodeId = this.elementId;
    this.scene.add(this.threeObject);

    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    geometry.computeBoundsTree();

    // Safely set the initial color.
    const initialColor = new THREE.Color();
    try {
      const colorValue = this.elementState.color || '#ffffff';
      initialColor.set(expandHex(colorValue));
    } catch (error) {
      console.warn(
        `Invalid initial color for node ${this.elementState.id}:`,
        this.elementState.color
      );
      initialColor.set('#ff00ff'); // Fallback to magenta for visibility.
    }

    const material = new THREE.MeshBasicMaterial({ color: initialColor });
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.userData.nodeId = this.elementId; // For raycasting
    group.add(mainMesh);

    // Create the glow mesh
    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glowMesh.scale.set(1.2, 1.2, 1.2);
    this.glowMesh.userData.isGlow = true; // So we can ignore it in raycasting if needed
    group.add(this.glowMesh);

    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => this.update());
      return dispose;
    });
  }

  public getRaycastableObject(): THREE.Object3D {
    // Return the main mesh, not the group, so the glow is not interactive
    return (
      this.threeObject.children.find((c) => !c.userData.isGlow) ||
      this.threeObject
    );
  }

  public update(): void {
    const isSelected = this.graphState.interaction.selectedElementIds.includes(
      this.elementId
    );
    const isHovered =
      this.graphState.interaction.hoveredElementId === this.elementId;

    // The elementState is already a reactive proxy passed to the constructor.
    // We can use it directly.
    if (!this.elementState) {
      // Node has been removed, actor will be disposed soon.
      return;
    }
    this.updateVisuals(this.elementState, isHovered, isSelected);
  }

  public dispose(): void {
    if (this.threeObject) {
      const group = this.threeObject as THREE.Group;
      const mainMesh = group.children[0] as THREE.Mesh<THREE.SphereGeometry>;
      const glowMesh = group.children[1] as THREE.Mesh<THREE.SphereGeometry>;

      if (mainMesh.geometry.disposeBoundsTree) {
        mainMesh.geometry.disposeBoundsTree();
      }
      mainMesh.geometry.dispose();
      (mainMesh.material as THREE.Material).dispose();

      if (glowMesh && glowMesh.geometry) glowMesh.geometry.dispose();
      if (glowMesh && glowMesh.material)
        (glowMesh.material as THREE.Material).dispose();
    }
    super.dispose();
  }

  private updateVisuals(
    elementState: Element,
    isElementHovered: boolean,
    isElementSelected: boolean
  ): void {
    if (!this.threeObject) return;
    const group = this.threeObject as THREE.Group;
    const mainMesh = group.children[0] as THREE.Mesh<
      THREE.SphereGeometry,
      THREE.MeshBasicMaterial
    >;

    group.position.set(
      elementState.position?.x ?? 0,
      elementState.position?.y ?? 0,
      elementState.position?.z ?? 0
    );

    const finalColor = new THREE.Color(); // Start with default color
    try {
      const colorValue = elementState.color || '#ffffff';
      finalColor.set(expandHex(colorValue));
    } catch (error) {
      console.warn(
        `Invalid color specified for node ${elementState.id}:`,
        elementState.color
      );
      finalColor.set('#ff00ff'); // Fallback to magenta for visibility.
    }

    const selectedStyle = this.graphState.style['node:selected'];
    const hoverStyle = this.graphState.style['node:hover'];

    if (isElementSelected && selectedStyle) {
      if (selectedStyle.color) finalColor.set(expandHex(selectedStyle.color));

      if (selectedStyle.glow) {
        this.glowMesh.visible = true;
        (this.glowMesh.material as THREE.MeshBasicMaterial).color.set(
          expandHex(selectedStyle.glow.color || '#ffffff')
        );
        (this.glowMesh.material as THREE.MeshBasicMaterial).opacity =
          selectedStyle.glow.strength || 0.4;
      } else {
        this.glowMesh.visible = false;
      }
    } else if (isElementHovered && hoverStyle) {
      if (hoverStyle.color) finalColor.set(expandHex(hoverStyle.color));
      this.glowMesh.visible = false; // No glow for hover in this implementation
    } else {
      this.glowMesh.visible = false;
    }

    mainMesh.material.color.copy(finalColor);
  }
}
