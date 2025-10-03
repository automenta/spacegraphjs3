import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec, TextNodeSpec } from '../../types';
import { BaseGeometryActor } from './BaseGeometryActor';

/**
 * An ElementActor for rendering 3D text nodes with advanced text features.
 * Supports configurable text properties, multi-line text, text wrapping, and rich text formatting.
 */
export class TextElementActor extends BaseGeometryActor {
  private static fontLoader: FontLoader = new FontLoader();
  private static fontCache: Map<string, any> = new Map();
  private static fontLoadingPromises: Map<string, Promise<any>> = new Map();
  private static defaultFontUrl: string =
    'https://cdn.jsdelivr.net/npm/three@0.179.1/examples/fonts/helvetiker_regular.typeface.json';
  private static boldFontUrl: string =
    'https://cdn.jsdelivr.net/npm/three@0.179.1/examples/fonts/helvetiker_bold.typeface.json';

  private currentTextGeometry: THREE.BufferGeometry | null = null;

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
    // Load the actual font and create text geometry
    this.loadFontAndCreateText();
  }

  public update(): void {
    super.update();
    // Check if text properties have changed and recreate text if needed
    this.checkAndUpdateText();
  }

  private async checkAndUpdateText(): Promise<void> {
    // In a more sophisticated implementation, we would check if the text properties have changed
    // For now, we'll just recreate the text geometry
    await this.loadFontAndCreateText();
  }

  private async loadFontAndCreateText(): Promise<void> {
    try {
      const textSpec = this.elementState as TextNodeSpec;

      // Get text properties with defaults
      const text =
        textSpec.text || textSpec.label || this.elementState.id || 'Text';
      // const font = textSpec.font || 'helvetiker'; // Not currently used
      const size = textSpec.size || 0.5;
      const depth = textSpec.depth || 0.1;
      const align = textSpec.align || 'center';
      const lineHeight = textSpec.lineHeight || 1.2;
      const maxWidth = textSpec.maxWidth || Infinity;
      const bold = textSpec.bold || false;
      // const italic = textSpec.italic || false; // Not currently used

      // Determine font URL based on properties
      let fontUrl = TextElementActor.defaultFontUrl;
      if (bold) {
        fontUrl = TextElementActor.boldFontUrl;
      }

      // Load font
      const fontData = await this.loadFont(fontUrl);

      // Process text for wrapping if needed
      const processedText = this.wrapText(text, maxWidth, fontData, size);

      // Split text into lines for multi-line support
      const lines = processedText.split('\n');

      // Create text geometries for each line
      const lineGeometries: THREE.BufferGeometry[] = [];
      // let totalHeight = 0; // Not used in this scope

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue; // Skip empty lines

        const lineGeometry = new TextGeometry(line, {
          font: fontData,
          size: size,
          depth: depth,
          curveSegments: 4,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.01,
          bevelOffset: 0,
          bevelSegments: 2,
        });

        // Compute bounding box for positioning
        lineGeometry.computeBoundingBox();

        lineGeometries.push(lineGeometry);
        // if (lineGeometry.boundingBox) {
        //   totalHeight += lineGeometry.boundingBox.max.y - lineGeometry.boundingBox.min.y;
        // }
      }

      // Combine all line geometries into a single geometry
      const combinedGeometry = this.combineLineGeometries(
        lineGeometries,
        align,
        lineHeight,
        size
      );

      // Update the main mesh with the new geometry
      if (this.currentTextGeometry) {
        this.currentTextGeometry.dispose();
      }
      this.currentTextGeometry = combinedGeometry;
      this.updateMainGeometry(combinedGeometry);

      // Update glow geometry
      if (this.glowMesh) {
        // Dispose of the old glow geometry
        const oldGlowGeometry = this.glowMesh.geometry;
        if (oldGlowGeometry) {
          if (oldGlowGeometry.disposeBoundsTree) {
            oldGlowGeometry.disposeBoundsTree();
          }
          oldGlowGeometry.dispose();
        }
        // Set the new glow geometry
        this.glowMesh.geometry = combinedGeometry.clone();
        if (this.glowMesh.geometry.computeBoundsTree) {
          this.glowMesh.geometry.computeBoundsTree();
        }
      }
    } catch (error) {
      // In test environments, we don't want to log warnings for expected failures
      // In production, we still want to log the warning
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
        console.warn(
          `Failed to create text geometry for node ${this.elementId}:`,
          error
        );
      }
      // Keep the placeholder box if text creation fails
    }
  }

  private async loadFont(fontUrl: string): Promise<any> {
    // Check if font is already cached
    if (TextElementActor.fontCache.has(fontUrl)) {
      return TextElementActor.fontCache.get(fontUrl);
    }

    // Check if font is already being loaded
    if (TextElementActor.fontLoadingPromises.has(fontUrl)) {
      return TextElementActor.fontLoadingPromises.get(fontUrl);
    }

    // Create new loading promise
    const loadingPromise = new Promise((resolve, _reject) => {
      TextElementActor.fontLoader.load(
        fontUrl,
        (font) => {
          TextElementActor.fontCache.set(fontUrl, font);
          TextElementActor.fontLoadingPromises.delete(fontUrl);
          resolve(font);
        },
        undefined,
        (error) => {
          console.warn('Failed to load font, using fallback:', error);
          // Create a minimal font object as fallback
          const fallbackFont = {
            data: {
              glyphs: {},
              familyName: 'Fallback',
              ascender: 0.8,
              descender: -0.2,
              underlineThickness: 0.05,
              underlinePosition: -0.1,
            },
          };
          TextElementActor.fontCache.set(fontUrl, fallbackFont);
          TextElementActor.fontLoadingPromises.delete(fontUrl);
          resolve(fallbackFont);
        }
      );
    });

    TextElementActor.fontLoadingPromises.set(fontUrl, loadingPromise);
    return loadingPromise;
  }

  private wrapText(
    text: string,
    maxWidth: number,
    font: any,
    fontSize: number
  ): string {
    if (maxWidth === Infinity || !font.data) {
      return text;
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // Approximate character width calculation
    const getCharWidth = (char: string): number => {
      if (font.data.glyphs[char]) {
        return ((font.data.glyphs[char].advanceWidth || 0) / 1000) * fontSize;
      }
      return fontSize * 0.6; // Fallback width
    };

    for (const word of words) {
      const wordWidth = word
        .split('')
        .reduce((sum, char) => sum + getCharWidth(char), 0);
      const lineWidth = currentLine
        .split('')
        .reduce((sum, char) => sum + getCharWidth(char), 0);

      if (lineWidth + getCharWidth(' ') + wordWidth <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  private combineLineGeometries(
    geometries: THREE.BufferGeometry[],
    align: 'left' | 'center' | 'right',
    lineHeight: number,
    fontSize: number
  ): THREE.BufferGeometry {
    if (geometries.length === 0) {
      return new THREE.BoxGeometry(1, 0.5, 0.1);
    }

    if (geometries.length === 1) {
      this.centerGeometry(geometries[0]);
      return geometries[0];
    }

    // Create a new geometry to hold all lines
    const combinedGeometry = new THREE.BufferGeometry();

    // Collect all vertices and indices from all geometries
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    // Calculate total height for vertical centering
    let totalHeight = 0;
    const lineHeights: number[] = [];

    for (const geometry of geometries) {
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        const height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
        lineHeights.push(height);
        totalHeight += height;
      } else {
        lineHeights.push(fontSize);
        totalHeight += fontSize;
      }
    }

    // Add spacing between lines
    totalHeight += (geometries.length - 1) * fontSize * (lineHeight - 1);

    // Position each line
    let currentY = totalHeight / 2; // Start from top for easier alignment

    for (let i = 0; i < geometries.length; i++) {
      const geometry = geometries[i];
      const lineHeightValue = lineHeights[i];

      // Center the line horizontally
      this.centerGeometry(geometry);

      // Calculate horizontal offset for alignment
      let xOffset = 0;
      if (align === 'left') {
        // For left alignment, we need to know the width of the line
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          xOffset = -geometry.boundingBox.min.x; // Move left edge to x=0
        }
      } else if (align === 'right') {
        // For right alignment, we need to know the width of the line
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          xOffset = -geometry.boundingBox.max.x; // Move right edge to x=0
        }
      }
      // For center alignment, no xOffset needed as it's already centered

      // Calculate vertical offset
      const yOffset = currentY - lineHeightValue / 2;

      // Apply transformations to vertices
      const positionAttribute = geometry.getAttribute('position');
      for (let j = 0; j < positionAttribute.count; j++) {
        vertices.push(
          positionAttribute.getX(j) + xOffset,
          positionAttribute.getY(j) + yOffset,
          positionAttribute.getZ(j)
        );
      }

      // Add indices with offset
      if (geometry.index) {
        for (let j = 0; j < geometry.index.count; j++) {
          indices.push(geometry.index.getX(j) + vertexOffset);
        }
      } else {
        // If no index, create one
        for (let j = 0; j < positionAttribute.count; j++) {
          indices.push(j + vertexOffset);
        }
      }

      vertexOffset += positionAttribute.count;
      currentY -= lineHeightValue + fontSize * (lineHeight - 1);
    }

    // Create new attributes for combined geometry
    combinedGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    combinedGeometry.setIndex(indices);

    // Compute normals for proper lighting
    combinedGeometry.computeVertexNormals();

    return combinedGeometry;
  }

  private centerGeometry(geometry: THREE.BufferGeometry): void {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      const centerOffset = new THREE.Vector3();
      geometry.boundingBox.getCenter(centerOffset);
      centerOffset.multiplyScalar(-1);
      // Only center horizontally (x-axis) for proper alignment
      centerOffset.y = 0;
      centerOffset.z = 0;
      geometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);
    }
  }

  public dispose(): void {
    if (this.currentTextGeometry) {
      this.currentTextGeometry.dispose();
      this.currentTextGeometry = null;
    }
    super.dispose();
  }
}
