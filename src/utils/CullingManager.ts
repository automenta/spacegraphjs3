import { Camera, Object3D, Frustum, Matrix4, Sphere, BufferGeometry } from 'three';

interface HasGeometry {
  geometry: BufferGeometry;
}

type GeometryObject = Object3D & HasGeometry;

/**
 * CullingManager handles advanced frustum culling for 3D objects.
 * It determines which objects are visible within the camera's view
 * to optimize rendering performance.
 */
export class CullingManager {
  private camera: Camera | null = null;
  private frustum: Frustum = new Frustum();
  private matrix: Matrix4 = new Matrix4();
  private objects: Set<Object3D> = new Set();
  private boundingSphereCache: Map<Object3D, Sphere> = new Map();

  /**
   * Sets the camera to use for culling calculations
   *
   * @param camera - The camera to use
   */
  public setCamera(camera: Camera): void {
    this.camera = camera;
  }

  /**
   * Registers an object for culling checks
   *
   * @param object - The object to register
   */
  public registerObject(object: Object3D): void {
    this.objects.add(object);
  }

  /**
   * Unregisters an object from culling checks
   *
   * @param object - The object to unregister
   */
  public unregisterObject(object: Object3D): void {
    this.objects.delete(object);
    this.boundingSphereCache.delete(object);
  }

  /**
   * Updates the frustum based on the current camera
   */
  public updateFrustum(): void {
    if (!this.camera) return;

    // Update the frustum based on the camera's projection matrix
    this.matrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.matrix);
  }

  /**
   * Performs culling checks on all registered objects
   *
   * @returns Array of visible objects
   */
  public cullObjects(): Object3D[] {
    if (!this.camera) return Array.from(this.objects);

    const visibleObjects: Object3D[] = [];

    for (const object of this.objects) {
      if (this.isVisible(object)) {
        visibleObjects.push(object);
      }
    }

    return visibleObjects;
  }

  /**
   * Checks if an object is visible within the frustum
   *
   * @param object - The object to check
   * @returns True if the object is visible
   */
  public isVisible(object: Object3D): boolean {
    if (!this.camera) return true;

    // Get or create bounding sphere for the object
    let boundingSphere = this.boundingSphereCache.get(object);
    if (!boundingSphere) {
      boundingSphere = new Sphere();
      this.updateBoundingSphere(object, boundingSphere);
      this.boundingSphereCache.set(object, boundingSphere);
    } else {
      // Update the bounding sphere position
      boundingSphere.center.copy(object.position);
    }

    // Check if the bounding sphere intersects with the frustum
    return this.frustum.intersectsSphere(boundingSphere);
  }

  /**
   * Updates the bounding sphere for an object
   *
   * @param object - The object to update
   * @param sphere - The sphere to update
   */
  private updateBoundingSphere(object: Object3D, sphere: Sphere): void {
    // Calculate bounding sphere based on object's geometry or children
    if ('geometry' in object) {
      const geomObject = object as GeometryObject;
      // For objects with geometry, use the geometry's bounding sphere
      if (!geomObject.geometry.boundingSphere) {
        geomObject.geometry.computeBoundingSphere();
      }
      if (geomObject.geometry.boundingSphere) {
        sphere.copy(geomObject.geometry.boundingSphere);
        sphere.applyMatrix4(object.matrixWorld);
        return;
      }
    }

    // Fallback: Create a basic bounding sphere based on position and a default radius
    sphere.set(object.position, 1);
  }

  /**
   * Forces an update of an object's bounding sphere cache
   *
   * @param object - The object to update
   */
  public updateObjectBounds(object: Object3D): void {
    const boundingSphere = this.boundingSphereCache.get(object);
    if (boundingSphere) {
      this.updateBoundingSphere(object, boundingSphere);
    }
  }

  /**
   * Clears all registered objects and cached bounding spheres
   */
  public clear(): void {
    this.objects.clear();
    this.boundingSphereCache.clear();
  }

  /**
   * Gets the count of registered objects
   *
   * @returns Number of registered objects
   */
  public getObjectCount(): number {
    return this.objects.size;
  }

  /**
   * Gets the count of cached bounding spheres
   *
   * @returns Number of cached bounding spheres
   */
  public getCacheCount(): number {
    return this.boundingSphereCache.size;
  }
}