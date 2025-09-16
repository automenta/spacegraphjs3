/**
 * A simple, recursive deep merge utility.
 * It merges the properties of the source object into the target object.
 *
 * @param target - The target object to merge into.
 * @param source - The source object with the new properties.
 * @returns The merged target object.
 */
export function deepMerge(target: any, source: any): any {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        // Recurse for nested objects
        if (!targetValue || typeof targetValue !== 'object' || Array.isArray(targetValue)) {
          target[key] = {};
        }
        deepMerge(target[key], sourceValue);
      } else if (sourceValue !== undefined) {
        // Overwrite primitive values and arrays
        target[key] = sourceValue;
      }
    }
  }
  return target;
}
