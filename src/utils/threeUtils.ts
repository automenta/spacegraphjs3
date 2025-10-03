import * as THREE from 'three';

/**
 * Safely disposes a Three.js object and its children
 * @param object - The Three.js object to dispose
 */
export function safeDisposeObject(object: THREE.Object3D): void {
  try {
    // Remove from parent if it's attached
    if (object.parent) {
      object.parent.remove(object);
    }
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Failed to remove object from parent:`, error);
  }

  // Dispose geometry
  try {
    if ((object as any).geometry) {
      const geometry = (object as any).geometry;
      if (geometry.disposeBoundsTree) {
        geometry.disposeBoundsTree();
      }
      geometry.dispose();
    }
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Failed to dispose geometry:`, error);
  }

  // Dispose material
  try {
    if ((object as any).material) {
      const material = (object as any).material;
      if (Array.isArray(material)) {
        material.forEach((m: THREE.Material) => {
          if (m && typeof m.dispose === 'function') {
            m.dispose();
          }
        });
      } else if (typeof material.dispose === 'function') {
        material.dispose();
      }
    }
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Failed to dispose material:`, error);
  }

  // Dispose children recursively
  try {
    object.children.forEach((child) => {
      safeDisposeObject(child);
    });
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Failed to dispose children:`, error);
  }
}

/**
 * Safely disposes a Three.js geometry
 * @param geometry - The geometry to dispose
 */
export function safeDisposeGeometry(geometry: THREE.BufferGeometry): void {
  try {
    if (geometry.disposeBoundsTree) {
      geometry.disposeBoundsTree();
    }
    geometry.dispose();
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Failed to dispose geometry:`, error);
  }
}

/**
 * Safely disposes a Three.js material
 * @param material - The material to dispose
 */
export function safeDisposeMaterial(
  material: THREE.Material | THREE.Material[]
): void {
  try {
    if (Array.isArray(material)) {
      material.forEach((m) => {
        if (m && typeof m.dispose === 'function') {
          m.dispose();
        }
      });
    } else if (material && typeof material.dispose === 'function') {
      material.dispose();
    }
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Failed to dispose material:`, error);
  }
}
