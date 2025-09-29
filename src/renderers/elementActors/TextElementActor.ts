import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';
import { expandHex } from '../../utils/color';
import { parseColor, applyElementStyling } from '../../utils/colorUtils';

/**
 * An ElementActor for rendering 3D text nodes.
 * This implementation loads fonts and creates TextGeometry for actual 3D text rendering.
 */
export class TextElementActor extends BaseElementActor {
  private readonly elementId: string;
  private glowMesh!: THREE.Mesh;
  private textMesh!: THREE.Mesh;
  private static fontLoader: FontLoader = new FontLoader();
  private static defaultFont: any = null;
  private static fontLoadingPromise: Promise<any> | null = null;
  private static fontUrl: string = 'https://cdn.jsdelivr.net/npm/three@0.179.1/examples/fonts/helvetiker_regular.typeface.json';

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

    // Load font if not already loaded
    if (!TextElementActor.defaultFont && !TextElementActor.fontLoadingPromise) {
      TextElementActor.fontLoadingPromise = this.loadFont();
    }

    // Create a temporary placeholder while font loads
    const placeholderGeometry = new THREE.BoxGeometry(1, 0.5, 0.1);
    if (placeholderGeometry.computeBoundsTree) {
      placeholderGeometry.computeBoundsTree();
    }

    // Safely set the initial color.
    const initialColor = parseColor(this.elementState.color, this.elementState.id);

    // Create material with initial color
    const material = new THREE.MeshBasicMaterial({ color: initialColor });
    this.textMesh = new THREE.Mesh(placeholderGeometry, material);
    this.textMesh.userData.nodeId = this.elementId; // For raycasting
    group.add(this.textMesh);

    // Create the glow mesh
    const glowGeometry = new THREE.BoxGeometry(1, 0.5, 0.1);
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

    // Load the actual font and create text geometry
    this.loadFontAndCreateText();
  }

  private async loadFont(): Promise<any> {
    return new Promise((resolve) => {
      TextElementActor.fontLoader.load(
        TextElementActor.fontUrl,
        (font) => {
          TextElementActor.defaultFont = font;
          resolve(font);
        },
        undefined,
        (error) => {
          console.warn('Failed to load font, using fallback:', error);
          // Create a minimal font object as fallback
          TextElementActor.defaultFont = {
            data: {
              glyphs: {},
              familyName: 'Fallback',
              ascender: 0.8,
              descender: -0.2,
              underlineThickness: 0.05,
              underlinePosition: -0.1
            }
          };
          resolve(TextElementActor.defaultFont);
        }
      );
    });
  }

  private async loadFontAndCreateText(): Promise<void> {
    try {
      // Wait for font to be loaded
      if (!TextElementActor.defaultFont && TextElementActor.fontLoadingPromise) {
        await TextElementActor.fontLoadingPromise;
      }

      // If we still don't have a font, use fallback
      const font = TextElementActor.defaultFont || {
        data: {
          glyphs: {},
          familyName: 'Fallback',
          ascender: 0.8,
          descender: -0.2
        }
      };

      // Get text from element state or use element ID as fallback
      const text = this.elementState.label || this.elementState.id || 'Text';

      // Create text geometry
      const textGeometry = new TextGeometry(text, {
        font: font,
        size: 0.5,
        depth: 0.1,
        curveSegments: 4,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 2
      });

      // Center the geometry
      textGeometry.computeBoundingBox();
      if (textGeometry.boundingBox) {
        const centerOffset = new THREE.Vector3();
        textGeometry.boundingBox.getCenter(centerOffset);
        centerOffset.multiplyScalar(-1);
        textGeometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);
      }

      if (textGeometry.computeBoundsTree) {
        textGeometry.computeBoundsTree();
      }

      // Update the mesh with the new geometry
      const oldGeometry = this.textMesh.geometry;
      this.textMesh.geometry = textGeometry;

      // Dispose of the old placeholder geometry
      if (oldGeometry && oldGeometry !== textGeometry) {
        if (oldGeometry.disposeBoundsTree) {
          oldGeometry.disposeBoundsTree();
        }
        oldGeometry.dispose();
      }
    } catch (error) {
      // In test environments, we don't want to log warnings for expected failures
      // In production, we still want to log the warning
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Failed to create text geometry for node ${this.elementId}:`, error);
      }
      // Keep the placeholder box if text creation fails
    }
  }

  public getRaycastableObject(): THREE.Object3D | null {
    // Return the text mesh, not the group, so the glow is not interactive
    if (!this.threeObject) return null;
    return this.textMesh || this.threeObject;
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

    (this.textMesh.material as THREE.MeshBasicMaterial).color.copy(finalColor);
  }
}