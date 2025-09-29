/**
 * A simple, recursive deep merge utility.
 * It merges the properties of the source object into the target object.
 *
 * @param target - The target object to merge into.
 * @param source - The source object with the new properties.
 * @returns The merged target object.
 */
export declare function deepMerge<T extends object, S extends object>(target: T, source: S): T & S;
