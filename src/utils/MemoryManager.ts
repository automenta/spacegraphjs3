import { Object3D, Material, Texture, BufferGeometry } from 'three';

interface Disposable {
  dispose(): void;
}

interface HasGeometry {
  geometry: BufferGeometry;
}

interface HasMaterial {
  material: Material | Material[];
}

type DisposableObject =
  | Object3D
  | Material
  | Texture
  | BufferGeometry
  | Disposable;

/**
 * MemoryManager handles efficient memory management for Three.js objects.
 * It provides utilities for disposing of geometries, materials, and textures
 * to prevent memory leaks and optimize performance.
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private trackedObjects: Set<DisposableObject> = new Set();
  private disposedObjects: WeakSet<DisposableObject> = new WeakSet();

  private constructor() {}

  /**
   * Gets the singleton instance of MemoryManager
   *
   * @returns The MemoryManager instance
   */
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Checks if an object has already been disposed
   *
   * @param object - The object to check
   * @returns True if the object has been disposed
   */
  private isDisposed(object: DisposableObject): boolean {
    return this.disposedObjects.has(object);
  }

  /**
   * Marks an object as disposed
   *
   * @param object - The object to mark as disposed
   */
  private markAsDisposed(object: DisposableObject): void {
    this.disposedObjects.add(object);
  }

  /**
   * Disposes of a Three.js object and all its resources
   *
   * @param object - The object to dispose
   */
  public disposeObject(object: DisposableObject): void {
    // Skip if already disposed
    if (this.isDisposed(object)) {
      return;
    }

    if (object instanceof Object3D) {
      // Dispose of geometry and materials in the object
      if ('geometry' in object && (object as unknown as HasGeometry).geometry) {
        this.disposeGeometry((object as unknown as HasGeometry).geometry);
      }

      if ('material' in object) {
        const material = (object as unknown as HasMaterial).material;
        if (Array.isArray(material)) {
          material.forEach((mat) => this.disposeMaterial(mat));
        } else if (material) {
          this.disposeMaterial(material);
        }
      }

      // Recursively dispose of children
      object.children.forEach((child) => this.disposeObject(child));
    } else if (object instanceof Material) {
      this.disposeMaterial(object);
    } else if (object instanceof Texture) {
      this.disposeTexture(object);
    } else if (object instanceof BufferGeometry) {
      this.disposeGeometry(object);
    } else if (typeof object.dispose === 'function') {
      try {
        object.dispose();
      } catch (error) {
        console.warn('Error disposing object:', error);
      }
    }

    // Mark as disposed
    this.markAsDisposed(object);

    // Remove from tracked objects
    this.trackedObjects.delete(object);
  }

  /**
   * Disposes of a material and its resources
   *
   * @param material - The material to dispose
   */
  public disposeMaterial(material: Material): void {
    // Skip if already disposed
    if (this.isDisposed(material)) {
      return;
    }

    // Dispose of textures used by the material
    Object.keys(material).forEach((key) => {
      const value = (material as any)[key];
      if (value instanceof Texture) {
        this.disposeTexture(value);
      }
    });

    // Dispose of the material itself
    if (typeof material.dispose === 'function') {
      try {
        material.dispose();
      } catch (error) {
        console.warn('Error disposing material:', error);
      }
    }

    // Mark as disposed
    this.markAsDisposed(material);
  }

  /**
   * Disposes of a texture and its resources
   *
   * @param texture - The texture to dispose
   */
  public disposeTexture(texture: Texture): void {
    // Skip if already disposed
    if (this.isDisposed(texture)) {
      return;
    }

    if (texture.image && typeof texture.image.close === 'function') {
      try {
        texture.image.close();
      } catch (error) {
        console.warn('Error closing texture image:', error);
      }
    }

    if (typeof texture.dispose === 'function') {
      try {
        texture.dispose();
      } catch (error) {
        console.warn('Error disposing texture:', error);
      }
    }

    // Mark as disposed
    this.markAsDisposed(texture);
  }

  /**
   * Disposes of a geometry and its resources
   *
   * @param geometry - The geometry to dispose
   */
  public disposeGeometry(geometry: BufferGeometry): void {
    // Skip if already disposed
    if (this.isDisposed(geometry)) {
      return;
    }

    if (typeof geometry.dispose === 'function') {
      try {
        geometry.dispose();
      } catch (error) {
        console.warn('Error disposing geometry:', error);
      }
    }

    // Mark as disposed
    this.markAsDisposed(geometry);
  }

  /**
   * Tracks an object for later disposal
   *
   * @param object - The object to track
   */
  public trackObject(object: DisposableObject): void {
    this.trackedObjects.add(object);
  }

  /**
   * Disposes of all tracked objects
   */
  public disposeAllTrackedObjects(): void {
    // Create a copy of the set to avoid modification during iteration
    const objectsToDispose = Array.from(this.trackedObjects);
    objectsToDispose.forEach((object) => {
      try {
        this.disposeObject(object);
      } catch (error) {
        console.warn('Error disposing tracked object:', error);
      }
    });
    this.trackedObjects.clear();
  }

  /**
   * Gets the count of tracked objects
   *
   * @returns Number of tracked objects
   */
  public getTrackedObjectCount(): number {
    return this.trackedObjects.size;
  }

  /**
   * Clears all tracked objects without disposing them
   */
  public clearTracking(): void {
    this.trackedObjects.clear();
  }
}
