import * as THREE from 'three';
import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';
import { parseColor, applyElementStyling } from '../../utils/colorUtils';

/**
 * A base class for geometry-based element actors that provides common functionality
 * for rendering Three.js objects with glow effects and styling.
 */
export abstract class BaseGeometryActor extends BaseElementActor {
  protected readonly elementId: string;
  protected glowMesh!: THREE.Mesh;
  protected mainMesh!: THREE.Mesh;

  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
  }

  /**
   * Creates the main geometry for this actor
   * @returns The geometry to use for the main mesh
   */
  protected abstract createGeometry(): THREE.BufferGeometry;

  /**
   * Creates the glow geometry for this actor
   * @returns The geometry to use for the glow mesh
   */
  protected createGlowGeometry(): THREE.BufferGeometry {
    // By default, use the same geometry as the main mesh
    return this.createGeometry();
  }

  public init(): void {
    const group = new THREE.Group();
    this.threeObject = group;
    this.threeObject.userData.nodeId = this.elementId;
    this.scene.add(this.threeObject);

    // Create main geometry and material
    const geometry = this.createGeometry();
    if (geometry.computeBoundsTree) {
      geometry.computeBoundsTree();
    }

    // Safely set the initial color
    const initialColor = parseColor(this.elementState.color, this.elementState.id);
    const material = new THREE.MeshBasicMaterial({ color: initialColor });
    
    this.mainMesh = new THREE.Mesh(geometry, material);
    this.mainMesh.userData.nodeId = this.elementId; // For raycasting
    group.add(this.mainMesh);

    // Create the glow mesh
    const glowGeometry = this.createGlowGeometry();
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

  public getRaycastableObject(): THREE.Object3D | null {
    // Return the main mesh, not the group, so the glow is not interactive
    if (!this.threeObject) return null;
    return this.mainMesh || this.threeObject;
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

  protected updateVisuals(
    elementState: Store<NodeSpec>,
    isElementHovered: boolean,
    isElementSelected: boolean
  ): void {
    if (!this.threeObject) return;
    const group = this.threeObject as THREE.Group;

    group.position.set(
      elementState.position?.x ?? 0,
      elementState.position?.y ?? 0,
      elementState.position?.z ?? 0
    );

    const finalColor = parseColor(elementState.color, elementState.id);

    const selectedStyle = this.graphState.style['node:selected'];
    const hoverStyle = this.graphState.style['node:hover'];

    const stylingResult = applyElementStyling(
      finalColor,
      isElementSelected,
      isElementHovered,
      selectedStyle,
      hoverStyle
    );

    finalColor.copy(stylingResult.color);
    
    if (stylingResult.glowVisible && stylingResult.glowColor !== undefined && stylingResult.glowStrength !== undefined) {
      this.glowMesh.visible = true;
      (this.glowMesh.material as THREE.MeshBasicMaterial).color.set(stylingResult.glowColor);
      (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = stylingResult.glowStrength;
    } else {
      this.glowMesh.visible = false;
    }

    (this.mainMesh.material as THREE.MeshBasicMaterial).color.copy(finalColor);
  }

  /**
   * Updates the geometry of the main mesh
   * @param newGeometry The new geometry to use
   */
  protected updateMainGeometry(newGeometry: THREE.BufferGeometry): void {
    if (!this.mainMesh) return;

    // Dispose of the old geometry
    const oldGeometry = this.mainMesh.geometry;
    if (oldGeometry && oldGeometry !== newGeometry) {
      if (oldGeometry.disposeBoundsTree) {
        oldGeometry.disposeBoundsTree();
      }
      oldGeometry.dispose();
    }

    // Set the new geometry
    this.mainMesh.geometry = newGeometry;
    if (newGeometry.computeBoundsTree) {
      newGeometry.computeBoundsTree();
    }
  }
}