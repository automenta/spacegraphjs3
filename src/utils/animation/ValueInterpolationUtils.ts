import * as THREE from 'three';

/**
 * Utility class for handling value interpolation and manipulation in animations
 */
export class ValueInterpolationUtils {
  /**
   * Extract numeric value from various types for animation purposes
   */
  static extractValue(value: any): number {
    if (value instanceof THREE.Vector3) {
      return value.length();
    }
    if (value instanceof THREE.Vector2) {
      return value.length();
    }
    if (typeof value === 'number') {
      return value;
    }
    if (Array.isArray(value)) {
      return value[0] || 0;
    }
    // For objects with x, y, z properties (like Vector3-like objects)
    if (value && typeof value === 'object' && 'x' in value) {
      if ('z' in value) {
        // 3D vector
        return Math.sqrt(
          value.x * value.x + value.y * value.y + value.z * value.z
        );
      } else {
        // 2D vector
        return Math.sqrt(value.x * value.x + value.y * value.y);
      }
    }
    return 0;
  }

  /**
   * Clone a value for animation purposes
   */
  static cloneValue(value: any): any {
    if (value instanceof THREE.Vector3) {
      return value.clone();
    }
    if (value instanceof THREE.Vector2) {
      return value.clone();
    }
    if (typeof value === 'number') {
      return value;
    }
    if (Array.isArray(value)) {
      return [...value];
    }
    // For objects with x, y, z properties (like Vector3-like objects)
    if (value && typeof value === 'object' && 'x' in value) {
      if ('z' in value) {
        // 3D vector-like object
        return new THREE.Vector3(value.x, value.y, value.z);
      } else {
        // 2D vector-like object
        return new THREE.Vector2(value.x, value.y);
      }
    }
    return value;
  }

  /**
   * Interpolate between two values
   */
  static interpolateValue(from: any, to: any, progress: number): any {
    if (from instanceof THREE.Vector3 && to instanceof THREE.Vector3) {
      return new THREE.Vector3().lerpVectors(from, to, progress);
    }
    if (from instanceof THREE.Vector2 && to instanceof THREE.Vector2) {
      return new THREE.Vector2().lerpVectors(from, to, progress);
    }
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }
    if (Array.isArray(from) && Array.isArray(to)) {
      return from.map((val, index) => val + (to[index] - val) * progress);
    }
    // For objects with x, y, z properties (like Vector3-like objects)
    if (
      from &&
      to &&
      typeof from === 'object' &&
      typeof to === 'object' &&
      'x' in from &&
      'x' in to
    ) {
      if ('z' in from && 'z' in to) {
        // 3D vector-like objects
        return new THREE.Vector3(
          from.x + (to.x - from.x) * progress,
          from.y + (to.y - from.y) * progress,
          from.z + (to.z - from.z) * progress
        );
      } else {
        // 2D vector-like objects
        return new THREE.Vector2(
          from.x + (to.x - from.x) * progress,
          from.y + (to.y - from.y) * progress
        );
      }
    }
    return progress < 0.5 ? from : to;
  }

  /**
   * Multiply a value by a scalar factor
   */
  static multiplyValue(value: any, factor: number): any {
    if (value instanceof THREE.Vector3) {
      return value.clone().multiplyScalar(factor);
    }
    if (value instanceof THREE.Vector2) {
      return value.clone().multiplyScalar(factor);
    }
    if (typeof value === 'number') {
      return value * factor;
    }
    if (Array.isArray(value)) {
      return value.map((val) => val * factor);
    }
    // For objects with x, y, z properties (like Vector3-like objects)
    if (value && typeof value === 'object' && 'x' in value) {
      if ('z' in value) {
        // 3D vector-like object
        return new THREE.Vector3(
          value.x * factor,
          value.y * factor,
          value.z * factor
        );
      } else {
        // 2D vector-like object
        return new THREE.Vector2(value.x * factor, value.y * factor);
      }
    }
    return value;
  }

  /**
   * Offset a value by a given amount (useful for shake/bounce animations)
   */
  static offsetValue(value: any, offset: number): any {
    if (value instanceof THREE.Vector3) {
      // For shake/bounce animations, we want deterministic offsets
      // Using a fixed direction for consistency
      const direction = new THREE.Vector3(1, 1, 1).normalize();
      return value.clone().add(direction.multiplyScalar(offset));
    }
    if (value instanceof THREE.Vector2) {
      // For 2D vectors, use a 2D direction
      const direction = new THREE.Vector2(1, 1).normalize();
      return value.clone().add(direction.multiplyScalar(offset));
    }
    if (typeof value === 'number') {
      return value + offset;
    }
    // For objects with x, y, z properties (like Vector3-like objects)
    if (value && typeof value === 'object' && 'x' in value) {
      if ('z' in value) {
        // 3D vector-like object
        const direction = new THREE.Vector3(1, 1, 1).normalize();
        return new THREE.Vector3(
          value.x + direction.x * offset,
          value.y + direction.y * offset,
          value.z + direction.z * offset
        );
      } else {
        // 2D vector-like object
        const direction = new THREE.Vector2(1, 1).normalize();
        return new THREE.Vector2(
          value.x + direction.x * offset,
          value.y + direction.y * offset
        );
      }
    }
    return value;
  }

  /**
   * Set a nested property value on a target object
   */
  static setTargetValue(target: any, property: string, value: any): void {
    if (target instanceof THREE.Object3D && property.includes('.')) {
      // Handle nested properties like position.x
      const parts = property.split('.');
      let obj: any = target;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else {
      target[property] = value;
    }
  }
}