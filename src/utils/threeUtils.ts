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

/**
 * Converts screen coordinates to world coordinates
 * @param screenPos - Screen position (pixels)
 * @param camera - Three.js camera
 * @param distance - Distance from camera (default: 1)
 * @returns World position vector
 */
export function screenToWorld(
  screenPos: THREE.Vector2,
  camera: THREE.Camera,
  distance: number = 1
): THREE.Vector3 {
  const vector = new THREE.Vector3(
    (screenPos.x / window.innerWidth) * 2 - 1,
    -(screenPos.y / window.innerHeight) * 2 + 1,
    0.5
  );

  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  return camera.position.clone().add(dir.multiplyScalar(distance));
}

/**
 * Converts world coordinates to screen coordinates
 * @param worldPos - World position vector
 * @param camera - Three.js camera
 * @returns Screen position vector (pixels)
 */
export function worldToScreen(
  worldPos: THREE.Vector3,
  camera: THREE.Camera
): THREE.Vector2 {
  const vector = worldPos.clone();
  vector.project(camera);

  return new THREE.Vector2(
    ((vector.x + 1) / 2) * window.innerWidth,
    (-(vector.y - 1) / 2) * window.innerHeight
  );
}

/**
 * Performs raycasting from screen position
 * @param screenPos - Screen position (pixels)
 * @param camera - Three.js camera
 * @param raycaster - Raycaster instance
 * @param objects - Objects to test against (default: scene children)
 * @returns Array of intersections
 */
export function raycastFromScreen(
  screenPos: THREE.Vector2,
  camera: THREE.Camera,
  raycaster: THREE.Raycaster,
  objects: THREE.Object3D[] = []
): THREE.Intersection[] {
  const mouse = new THREE.Vector2(
    (screenPos.x / window.innerWidth) * 2 - 1,
    -(screenPos.y / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, true);
}

/**
 * Gets the object at a screen position
 * @param screenPos - Screen position (pixels)
 * @param camera - Three.js camera
 * @param raycaster - Raycaster instance
 * @param objects - Objects to test against
 * @returns The intersected object or null
 */
export function getObjectAtPosition(
  screenPos: THREE.Vector2,
  camera: THREE.Camera,
  raycaster: THREE.Raycaster,
  objects: THREE.Object3D[] = []
): THREE.Object3D | null {
  const intersections = raycastFromScreen(screenPos, camera, raycaster, objects);
  return intersections.length > 0 ? intersections[0].object : null;
}
