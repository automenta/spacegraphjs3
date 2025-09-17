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
