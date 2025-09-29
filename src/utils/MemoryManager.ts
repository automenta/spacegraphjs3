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

type DisposableObject = Object3D | Material | Texture | BufferGeometry | Disposable;

/**
 * MemoryManager handles efficient memory management for Three.js objects.
 * It provides utilities for disposing of geometries, materials, and textures
 * to prevent memory leaks and optimize performance.
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private trackedObjects: Set<DisposableObject> = new Set();

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
   * Disposes of a Three.js object and all its resources
   *
   * @param object - The object to dispose
   */
  public disposeObject(object: DisposableObject): void {
    if (object instanceof Object3D) {
      // Dispose of geometry and materials in the object
      if ('geometry' in object) {
        this.disposeGeometry((object as unknown as HasGeometry).geometry);
      }
      
      if ('material' in object) {
        const material = (object as unknown as HasMaterial).material;
        if (Array.isArray(material)) {
          material.forEach(mat => this.disposeMaterial(mat));
        } else {
          this.disposeMaterial(material);
        }
      }
      
      // Recursively dispose of children
      object.children.forEach(child => this.disposeObject(child));
    } else if (object instanceof Material) {
      this.disposeMaterial(object);
    } else if (object instanceof Texture) {
      this.disposeTexture(object);
    } else if (object instanceof BufferGeometry) {
      this.disposeGeometry(object);
    } else if (typeof object.dispose === 'function') {
      object.dispose();
    }
    
    // Remove from tracked objects
    this.trackedObjects.delete(object);
  }

  /**
   * Disposes of a material and its resources
   *
   * @param material - The material to dispose
   */
  public disposeMaterial(material: Material): void {
    // Dispose of textures used by the material
    Object.keys(material).forEach(key => {
      const value = (material as any)[key];
      if (value instanceof Texture) {
        this.disposeTexture(value);
      }
    });
    
    // Dispose of the material itself
    if (typeof material.dispose === 'function') {
      material.dispose();
    }
  }

  /**
   * Disposes of a texture and its resources
   *
   * @param texture - The texture to dispose
   */
  public disposeTexture(texture: Texture): void {
    if (texture.image && typeof texture.image.close === 'function') {
      texture.image.close();
    }
    
    if (typeof texture.dispose === 'function') {
      texture.dispose();
    }
  }

  /**
   * Disposes of a geometry and its resources
   *
   * @param geometry - The geometry to dispose
   */
  public disposeGeometry(geometry: BufferGeometry): void {
    if (typeof geometry.dispose === 'function') {
      geometry.dispose();
    }
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
    this.trackedObjects.forEach(object => this.disposeObject(object));
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
}