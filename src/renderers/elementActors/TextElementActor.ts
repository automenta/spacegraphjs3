import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../../types';
import { BaseGeometryActor } from './BaseGeometryActor';

/**
 * An ElementActor for rendering 3D text nodes.
 * This implementation loads fonts and creates TextGeometry for actual 3D text rendering.
 */
export class TextElementActor extends BaseGeometryActor {
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
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Create a temporary placeholder while font loads
    return new THREE.BoxGeometry(1, 0.5, 0.1);
  }

  protected createGlowGeometry(): THREE.BufferGeometry {
    // Create a glow placeholder
    return new THREE.BoxGeometry(1, 0.5, 0.1);
  }

  public init(): void {
    super.init();

    // Load font if not already loaded
    if (!TextElementActor.defaultFont && !TextElementActor.fontLoadingPromise) {
      TextElementActor.fontLoadingPromise = this.loadFont();
    }

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

      // Update the main mesh with the new geometry
      this.updateMainGeometry(textGeometry);
    } catch (error) {
      // In test environments, we don't want to log warnings for expected failures
      // In production, we still want to log the warning
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
        console.warn(`Failed to create text geometry for node ${this.elementId}:`, error);
      }
      // Keep the placeholder box if text creation fails
    }
  }
}