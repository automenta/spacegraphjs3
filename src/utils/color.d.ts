/**
 * Expands a 3-digit hex color to a 6-digit hex color.
 * For example, '#f0c' becomes '#ff00cc'.
 * If the hex code is not a 3-digit hex code, it is returned as-is.
 *
 * @param hex The 3-digit hex color to expand.
 * @returns The expanded 6-digit hex color.
 */
export declare function expandHex(hex: string): string;
