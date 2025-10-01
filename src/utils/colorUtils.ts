import * as THREE from 'three';
import { expandHex } from './color';

/**
 * Safely sets a color from a hex string, with fallback handling
 * @param colorValue - The hex color string to parse
 * @param elementId - The element ID for logging purposes
 * @param fallbackColor - The fallback color if parsing fails
 * @returns A THREE.Color object
 */
export function parseColor(colorValue: string | undefined, elementId: string, fallbackColor: string = '#ff00ff'): THREE.Color {
  const color = new THREE.Color();
  try {
    const value = colorValue || '#ffffff';
    color.set(expandHex(value));
  } catch (error) {
    void error; // Intentionally unused, keeping for potential future use
    console.warn(
      `Invalid color specified for node ${elementId}:`,
      colorValue
    );
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
): { color: THREE.Color; glowVisible: boolean; glowColor?: string; glowStrength?: number } {
  const result: { color: THREE.Color; glowVisible: boolean; glowColor?: string; glowStrength?: number } = {
    color: baseColor,
    glowVisible: false,
    glowColor: undefined,
    glowStrength: undefined
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