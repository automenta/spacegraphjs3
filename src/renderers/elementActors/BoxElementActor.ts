import * as THREE from 'three';
import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';
import { expandHex } from '../../utils/color';
import { parseColor, applyElementStyling } from '../../utils/colorUtils';

/**
 * An ElementActor for rendering box/cube nodes.
 */
export class BoxElementActor extends BaseElementActor {
  protected readonly elementId: string;
  private glowMesh!: THREE.Mesh;

  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
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

    // Create box geometry with default size
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.computeBoundsTree();

    // Safely set the initial color.
    const initialColor = parseColor(this.elementState.color, this.elementState.id);

    const material = new THREE.MeshBasicMaterial({ color: initialColor });
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.userData.nodeId = this.elementId; // For raycasting
    group.add(mainMesh);

    // Create the glow mesh
    const glowGeometry = new THREE.BoxGeometry(1, 1, 1);
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
    const child = this.threeObject.children.find((c) => !c.userData.isGlow);
    return child || this.threeObject;
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
    super.dispose();
  }

  private updateVisuals(
    elementState: Store<NodeSpec>,
    isElementHovered: boolean,
    isElementSelected: boolean
  ): void {
    if (!this.threeObject) return;
    const group = this.threeObject as THREE.Group;
    const mainMesh = group.children[0] as THREE.Mesh<
      THREE.BoxGeometry,
      THREE.MeshBasicMaterial
    >;

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

    mainMesh.material.color.copy(finalColor);
  }
}