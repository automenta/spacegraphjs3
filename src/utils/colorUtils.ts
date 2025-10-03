import * as THREE from 'three';

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
