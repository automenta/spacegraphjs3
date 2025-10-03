import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { EdgeSpec, NodeSpec } from '../types';

/**
 * A class for rendering 3D text labels on edges.
 * This implementation creates actual 3D text geometry for edge labels.
 */
export class EdgeLabel {
  private static fontLoader: FontLoader = new FontLoader();
  private static defaultFont: any = null;
  private static fontLoadingPromise: Promise<any> | null = null;
  private static fontUrl: string =
    'https://cdn.jsdelivr.net/npm/three@0.179.1/examples/fonts/helvetiker_regular.typeface.json';

  private scene: THREE.Scene;
  private edge: EdgeSpec;
  private sourceNode: NodeSpec;
  private targetNode: NodeSpec;
  private textMesh!: THREE.Mesh;
  private backgroundMesh!: THREE.Mesh;
  private group: THREE.Group;
  private label: string;

  constructor(
    scene: THREE.Scene,
    edge: EdgeSpec,
    sourceNode: NodeSpec,
    targetNode: NodeSpec
  ) {
    this.scene = scene;
    this.edge = edge;
    this.sourceNode = sourceNode;
    this.targetNode = targetNode;
    this.label = edge.label || '';
    this.group = new THREE.Group();
    this.group.userData.edgeId = edge.id;
    this.group.userData.isLabel = true;

    // Load font if not already loaded
    if (!EdgeLabel.defaultFont && !EdgeLabel.fontLoadingPromise) {
      EdgeLabel.fontLoadingPromise = this.loadFont();
    }

    this.scene.add(this.group);
  }

  public async init(): Promise<void> {
    // Create placeholder while font loads
    const placeholderGeometry = new THREE.BoxGeometry(1, 0.5, 0.1);
    if (placeholderGeometry.computeBoundsTree) {
      placeholderGeometry.computeBoundsTree();
    }

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.textMesh = new THREE.Mesh(placeholderGeometry, material);
    this.textMesh.userData.edgeId = this.edge.id;
    this.group.add(this.textMesh);

    // Create background
    const backgroundGeometry = new THREE.PlaneGeometry(1, 0.6);
    const backgroundMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7,
    });
    this.backgroundMesh = new THREE.Mesh(
      backgroundGeometry,
      backgroundMaterial
    );
    this.backgroundMesh.position.z = -0.05; // Slightly behind the text
    this.group.add(this.backgroundMesh);

    // Position the label
    this.positionLabel();

    // Load the actual font and create text geometry
    await this.loadFontAndCreateText();
  }

  private async loadFont(): Promise<any> {
    return new Promise((resolve) => {
      EdgeLabel.fontLoader.load(
        EdgeLabel.fontUrl,
        (font) => {
          EdgeLabel.defaultFont = font;
          resolve(font);
        },
        undefined,
        (error) => {
          console.warn(
            'Failed to load font for edge label, using fallback:',
            error
          );
          // Create a minimal font object as fallback
          EdgeLabel.defaultFont = {
            data: {
              glyphs: {},
              familyName: 'Fallback',
              ascender: 0.8,
              descender: -0.2,
              underlineThickness: 0.05,
              underlinePosition: -0.1,
            },
          };
          resolve(EdgeLabel.defaultFont);
        }
      );
    });
  }

  private async loadFontAndCreateText(): Promise<void> {
    try {
      // Wait for font to be loaded
      if (!EdgeLabel.defaultFont && EdgeLabel.fontLoadingPromise) {
        await EdgeLabel.fontLoadingPromise;
      }

      // If we still don't have a font, use fallback
      const font = EdgeLabel.defaultFont || {
        data: {
          glyphs: {},
          familyName: 'Fallback',
          ascender: 0.8,
          descender: -0.2,
        },
      };

      // Create text geometry
      const textGeometry = new TextGeometry(this.label, {
        font: font,
        size: 0.3,
        depth: 0.05,
        curveSegments: 4,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.005,
        bevelOffset: 0,
        bevelSegments: 2,
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

      // Update background to fit text
      if (textGeometry.boundingBox) {
        const size = new THREE.Vector3();
        textGeometry.boundingBox.getSize(size);
        const backgroundGeometry = new THREE.PlaneGeometry(
          size.x + 0.2,
          size.y + 0.2
        );
        const oldBackgroundGeometry = this.backgroundMesh.geometry;
        this.backgroundMesh.geometry = backgroundGeometry;

        if (
          oldBackgroundGeometry &&
          oldBackgroundGeometry !== backgroundGeometry
        ) {
          if (oldBackgroundGeometry.disposeBoundsTree) {
            oldBackgroundGeometry.disposeBoundsTree();
          }
          oldBackgroundGeometry.dispose();
        }
      }
    } catch (error) {
      // In test environments, we don't want to log warnings for expected failures
      // In production, we still want to log the warning
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          `Failed to create text geometry for edge label ${this.edge.id}:`,
          error
        );
      }
      // Keep the placeholder box if text creation fails
    }
  }

  public positionLabel(): void {
    // Position the label at the midpoint of the edge
    const sourcePos = this.sourceNode.position || { x: 0, y: 0, z: 0 };
    const targetPos = this.targetNode.position || { x: 0, y: 0, z: 0 };
    const midpoint = new THREE.Vector3(
      (sourcePos.x + targetPos.x) / 2,
      (sourcePos.y + targetPos.y) / 2,
      (sourcePos.z + targetPos.z) / 2
    );

    this.group.position.copy(midpoint);
  }

  public updateStyle(
    isHovered: boolean = false,
    isSelected: boolean = false
  ): void {
    // Update text color based on state
    let textColor = 0xffffff; // Default white

    if (isSelected) {
      textColor = 0xffff00; // Yellow when selected
    } else if (isHovered) {
      textColor = 0x00ffff; // Cyan when hovered
    }

    (this.textMesh.material as THREE.MeshBasicMaterial).color.set(textColor);

    // Update background opacity based on state
    const backgroundOpacity = isSelected ? 0.9 : isHovered ? 0.8 : 0.7;
    (this.backgroundMesh.material as THREE.MeshBasicMaterial).opacity =
      backgroundOpacity;
  }

  public dispose(): void {
    // Remove from scene
    if (this.group.parent === this.scene) {
      this.scene.remove(this.group);
    }

    // Dispose of geometries
    if (this.textMesh.geometry) {
      if (this.textMesh.geometry.disposeBoundsTree) {
        this.textMesh.geometry.disposeBoundsTree();
      }
      this.textMesh.geometry.dispose();
    }

    if (this.backgroundMesh.geometry) {
      if (this.backgroundMesh.geometry.disposeBoundsTree) {
        this.backgroundMesh.geometry.disposeBoundsTree();
      }
      this.backgroundMesh.geometry.dispose();
    }

    // Dispose of materials
    if (this.textMesh.material) {
      (this.textMesh.material as THREE.Material).dispose();
    }

    if (this.backgroundMesh.material) {
      (this.backgroundMesh.material as THREE.Material).dispose();
    }
  }

  public getObject(): THREE.Group {
    return this.group;
  }
}
