/**
 * A simple, recursive deep merge utility.
 * It merges the properties of the source object into the target object.
 *
 * @param target - The target object to merge into.
 * @param source - The source object with the new properties.
 * @returns The merged target object.
 */
export function deepMerge<T extends object, S extends object>(target: T, source: S): T & S {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = (source as any)[key];
      const targetValue = (target as any)[key];

      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        if (!targetValue || typeof targetValue !== 'object' || Array.isArray(targetValue)) {
          (target as any)[key] = {};
        }
        deepMerge((target as any)[key], sourceValue);
      } else if (sourceValue !== undefined) {
        (target as any)[key] = sourceValue;
      }
    }
  }
  return target as T & S;
}
