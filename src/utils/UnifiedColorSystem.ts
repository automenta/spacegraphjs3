import * as THREE from 'three';
import { NodeSpec, Spec } from '../types';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

/**
 * Unified Color System
 * Consolidated color utilities for parsing, manipulation, and application
 */

/**
 * Expands a 3-digit hex color to a 6-digit hex color.
 * For example, '#f0c' becomes '#ff00cc'.
 * If the hex code is not a 3-digit hex code, it is returned as-is.
 *
 * @param hex The 3-digit hex color to expand.
 * @returns The expanded 6-digit hex color.
 */
export function expandHex(hex: string): string {
  if (hex.length === 4 && hex.charAt(0) === '#' && true) {
    const r = hex.charAt(1);
    const g = hex.charAt(2);
    const b = hex.charAt(3);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

/**
 * Safely sets a color from a hex string or number, with fallback handling
 * @param colorValue - The hex color string or number to parse
 * @param elementId - The element ID for logging purposes
 * @param fallbackColor - The fallback color if parsing fails
 * @returns A THREE.Color object
 */
export function parseColor(
  colorValue: string | number | undefined,
  elementId: string,
  fallbackColor: string = '#ff00ff'
): THREE.Color {
  const color = new THREE.Color();
  try {
    if (colorValue === undefined) {
      color.set('#ffffff');
    } else if (typeof colorValue === 'number') {
      color.setHex(colorValue);
    } else {
      color.set(expandHex(colorValue));
    }
  } catch (error) {
    void error; // Intentionally unused, keeping for potential future use
    console.warn(`Invalid color specified for node ${elementId}:`, colorValue);
    color.set(fallbackColor); // Fallback to magenta for visibility.
  }
  return color;
}

/**
 * Applies styling to an element based on its state
 * @param baseColor - The base color to modify
 * @param isSelected - Whether the element is selected
 * @param isHovered - Whether the element is hovered
 * @param selectedStyle - The selected style configuration
 * @param hoverStyle - The hover style configuration
 * @returns The final color and whether glow should be visible
 */
export function applyElementStyling(
  baseColor: THREE.Color,
  isSelected: boolean,
  isHovered: boolean,
  selectedStyle: any,
  hoverStyle: any
): {
  color: THREE.Color;
  glowVisible: boolean;
  glowColor?: string;
  glowStrength?: number;
} {
  const result: {
    color: THREE.Color;
    glowVisible: boolean;
    glowColor?: string;
    glowStrength?: number;
  } = {
    color: baseColor,
    glowVisible: false,
    glowColor: undefined,
    glowStrength: undefined,
  };

  if (isSelected && selectedStyle) {
    if (selectedStyle.color) {
      result.color.set(expandHex(selectedStyle.color));
    }

    if (selectedStyle.glow) {
      result.glowVisible = true;
      result.glowColor = expandHex(selectedStyle.glow.color || '#ffffff');
      result.glowStrength = selectedStyle.glow.strength || 0.4;
    }
  } else if (isHovered && hoverStyle) {
    if (hoverStyle.color) {
      result.color.set(expandHex(hoverStyle.color));
    }
    // No glow for hover in this implementation
  }

  return result;
}

/**
 * Utility functions for handling node colors across different renderers
 */
export class NodeColorUtils {
  /**
   * Get the final color for a node based on its state and style
   */
  static getNodeColor(node: NodeSpec, state: Spec): string | number {
    const { hoveredElementId, selectedElementIds } = state.interaction;
    let finalColor: string | number = node.color || '#ffffff';
    const isSelected = selectedElementIds.includes(node.id);
    const isHovered = hoveredElementId === node.id;

    if (isSelected && state.style['node:selected']?.color) {
      finalColor = state.style['node:selected'].color;
    } else if (isHovered && state.style['node:hover']?.color) {
      finalColor = state.style['node:hover'].color;
    }

    return finalColor;
  }

  /**
   * Apply color to a Three.js mesh with error handling
   */
  static applyColorToMesh(
    mesh: THREE.Mesh,
    color: string | number,
    nodeId: string
  ): void {
    if (!(mesh.material instanceof THREE.MeshBasicMaterial)) {
      return;
    }

    try {
      mesh.material.color = new THREE.Color(parseColor(color, nodeId));
    } catch (error) {
      console.warn(
        `Invalid color specified for node ${nodeId}:`,
        color,
        error
      );
      mesh.material.color = new THREE.Color('#ff00ff'); // Fallback to magenta
    }
  }

  /**
   * Apply color to a CSS3D object with error handling
   */
  static applyColorToCSS3DObject(
    css3dObject: CSS3DObject,
    color: string | number,
    nodeId: string
  ): void {
    if (!css3dObject.element) {
      return;
    }

    try {
      const colorString = '#' + parseColor(color, nodeId).getHexString();
      css3dObject.element.style.backgroundColor = colorString;
    } catch (error) {
      console.warn(
        `Invalid color specified for HTML node ${nodeId}:`,
        color,
        error
      );
      css3dObject.element.style.backgroundColor = '#ff00ff'; // Fallback to magenta
    }
  }

  /**
   * Update the color of any object (mesh or CSS3D)
   */
  static updateObjectColor(
    object: THREE.Object3D,
    node: NodeSpec,
    state: Spec
  ): void {
    const finalColor = this.getNodeColor(node, state);

    if (object instanceof THREE.Mesh) {
      this.applyColorToMesh(object, finalColor, node.id);
    } else if (object instanceof CSS3DObject) {
      this.applyColorToCSS3DObject(object, finalColor, node.id);
    }
  }
}

/**
 * Additional color utility functions
 */
export class ColorUtils {
  /**
   * Convert a color to hex string
   */
  static toHexString(color: THREE.Color): string {
    return '#' + color.getHexString();
  }

  /**
   * Convert a color to RGB string
   */
  static toRgbString(color: THREE.Color): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Convert a color to HSL string
   */
  static toHslString(color: THREE.Color): string {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const h = Math.round(hsl.h * 360);
    const s = Math.round(hsl.s * 100);
    const l = Math.round(hsl.l * 100);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  /**
   * Create a color palette from a base color
   */
  static createPalette(baseColor: THREE.Color, count: number = 5): THREE.Color[] {
    const palette: THREE.Color[] = [];
    const baseHsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(baseHsl);

    for (let i = 0; i < count; i++) {
      const lightness = Math.max(0.1, Math.min(0.9, baseHsl.l + (i - Math.floor(count / 2)) * 0.1));
      const color = new THREE.Color().setHSL(baseHsl.h, baseHsl.s, lightness);
      palette.push(color);
    }

    return palette;
  }

  /**
   * Interpolate between two colors
   */
  static interpolate(color1: THREE.Color, color2: THREE.Color, factor: number): THREE.Color {
    return new THREE.Color().lerpColors(color1, color2, factor);
  }

  /**
   * Get a contrasting color (light or dark) based on the input color
   */
  static getContrastingColor(color: THREE.Color): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    return hsl.l > 0.5 ? new THREE.Color(0x000000) : new THREE.Color(0xffffff);
  }

  /**
   * Adjust the brightness of a color
   */
  static adjustBrightness(color: THREE.Color, factor: number): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    hsl.l = Math.max(0, Math.min(1, hsl.l * factor));
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }

  /**
   * Adjust the saturation of a color
   */
  static adjustSaturation(color: THREE.Color, factor: number): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    hsl.s = Math.max(0, Math.min(1, hsl.s * factor));
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }
}

export default {
  expandHex,
  parseColor,
  applyElementStyling,
  NodeColorUtils,
  ColorUtils,
};