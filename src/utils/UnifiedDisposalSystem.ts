import * as THREE from 'three';
import { Logger } from './Logger';

interface Disposable {
  dispose(): void;
}

interface HasGeometry {
  geometry: THREE.BufferGeometry;
}

interface HasMaterial {
  material: THREE.Material | THREE.Material[];
}

type DisposableObject =
  | THREE.Object3D
  | THREE.Material
  | THREE.Texture
  | THREE.BufferGeometry
  | Disposable;

/**
 * Unified Disposal System
 * Consolidated memory management and disposal utilities
 */
export class UnifiedDisposalSystem {
  private static instance: UnifiedDisposalSystem;
  private logger: Logger = Logger.getInstance();
  private trackedObjects: Set<DisposableObject> = new Set();
  private disposedObjects: WeakSet<DisposableObject> = new WeakSet();

  private constructor() {}

  /**
   * Gets the singleton instance
   */
  public static getInstance(): UnifiedDisposalSystem {
    if (!UnifiedDisposalSystem.instance) {
      UnifiedDisposalSystem.instance = new UnifiedDisposalSystem();
    }
    return UnifiedDisposalSystem.instance;
  }

  /**
   * Checks if an object has already been disposed
   */
  private isDisposed(object: DisposableObject): boolean {
    return this.disposedObjects.has(object);
  }

  /**
   * Marks an object as disposed
   */
  private markAsDisposed(object: DisposableObject): void {
    this.disposedObjects.add(object);
  }

  /**
   * Safely disposes a Three.js object and its children
   * @param object - The Three.js object to dispose
   */
  public safeDisposeObject(object: THREE.Object3D): void {
    try {
      // Remove from parent if it's attached
      if (object.parent) {
        object.parent.remove(object);
      }
    } catch (error) {
      this.logger.warn('UnifiedDisposalSystem', `Failed to remove object from parent: ${error}`);
    }

    // Dispose geometry
    this.safeDisposeGeometryFromObject(object);

    // Dispose material
    this.safeDisposeMaterialFromObject(object);

    // Dispose children recursively
    this.safeDisposeChildren(object);
  }

  /**
   * Safely disposes geometry from an object
   */
  private safeDisposeGeometryFromObject(object: any): void {
    try {
      if (object.geometry) {
        const geometry = object.geometry;
        if (geometry.disposeBoundsTree) {
          geometry.disposeBoundsTree();
        }
        geometry.dispose();
      }
    } catch (error) {
      this.logger.warn('UnifiedDisposalSystem', `Failed to dispose geometry: ${error}`);
    }
  }

  /**
   * Safely disposes material from an object
   */
  private safeDisposeMaterialFromObject(object: any): void {
    try {
      if (object.material) {
        const material = object.material;
        this.safeDisposeMaterial(material);
      }
    } catch (error) {
      this.logger.warn('UnifiedDisposalSystem', `Failed to dispose material: ${error}`);
    }
  }

  /**
   * Safely disposes children of an object
   */
  private safeDisposeChildren(object: THREE.Object3D): void {
    try {
      object.children.forEach((child) => {
        this.safeDisposeObject(child);
      });
    } catch (error) {
      this.logger.warn('UnifiedDisposalSystem', `Failed to dispose children: ${error}`);
    }
  }

  /**
   * Safely disposes a Three.js geometry
   * @param geometry - The geometry to dispose
   */
  public safeDisposeGeometry(geometry: THREE.BufferGeometry): void {
    try {
      if (geometry.disposeBoundsTree) {
        geometry.disposeBoundsTree();
      }
      geometry.dispose();
    } catch (error) {
      this.logger.warn('UnifiedDisposalSystem', `Failed to dispose geometry: ${error}`);
    }
  }

  /**
   * Safely disposes a Three.js material
   * @param material - The material to dispose
   */
  public safeDisposeMaterial(material: THREE.Material | THREE.Material[]): void {
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
      this.logger.warn('UnifiedDisposalSystem', `Failed to dispose material: ${error}`);
    }
  }

  /**
   * Disposes of a Three.js object and all its resources (comprehensive version)
   * @param object - The object to dispose
   */
  public disposeObject(object: DisposableObject): void {
    // Skip if already disposed
    if (this.isDisposed(object)) {
      return;
    }

    if (object instanceof THREE.Object3D) {
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
    } else if (object instanceof THREE.Material) {
      this.disposeMaterial(object);
    } else if (object instanceof THREE.Texture) {
      this.disposeTexture(object);
    } else if (object instanceof THREE.BufferGeometry) {
      this.disposeGeometry(object);
    } else if (typeof object.dispose === 'function') {
      try {
        object.dispose();
      } catch (error) {
        this.logger.warn('UnifiedDisposalSystem', `Error disposing object: ${error}`);
      }
    }

    // Mark as disposed
    this.markAsDisposed(object);

    // Remove from tracked objects
    this.trackedObjects.delete(object);
  }

  /**
   * Disposes of a material and its resources
   * @param material - The material to dispose
   */
  public disposeMaterial(material: THREE.Material): void {
    // Skip if already disposed
    if (this.isDisposed(material)) {
      return;
    }

    // Dispose of textures used by the material
    Object.keys(material).forEach((key) => {
      const value = (material as any)[key];
      if (value instanceof THREE.Texture) {
        this.disposeTexture(value);
      }
    });

    // Dispose of the material itself
    if (typeof material.dispose === 'function') {
      try {
        material.dispose();
      } catch (error) {
        this.logger.warn('UnifiedDisposalSystem', `Error disposing material: ${error}`);
      }
    }

    // Mark as disposed
    this.markAsDisposed(material);
  }

  /**
   * Disposes of a texture and its resources
   * @param texture - The texture to dispose
   */
  public disposeTexture(texture: THREE.Texture): void {
    // Skip if already disposed
    if (this.isDisposed(texture)) {
      return;
    }

    if (texture.image && typeof texture.image.close === 'function') {
      try {
        texture.image.close();
      } catch (error) {
        this.logger.warn('UnifiedDisposalSystem', `Error closing texture image: ${error}`);
      }
    }

    if (typeof texture.dispose === 'function') {
      try {
        texture.dispose();
      } catch (error) {
        this.logger.warn('UnifiedDisposalSystem', `Error disposing texture: ${error}`);
      }
    }

    // Mark as disposed
    this.markAsDisposed(texture);
  }

  /**
   * Disposes of a geometry and its resources
   * @param geometry - The geometry to dispose
   */
  public disposeGeometry(geometry: THREE.BufferGeometry): void {
    // Skip if already disposed
    if (this.isDisposed(geometry)) {
      return;
    }

    if (typeof geometry.dispose === 'function') {
      try {
        geometry.dispose();
      } catch (error) {
        this.logger.warn('UnifiedDisposalSystem', `Error disposing geometry: ${error}`);
      }
    }

    // Mark as disposed
    this.markAsDisposed(geometry);
  }

  /**
   * Safely dispose of any object with error handling
   * @param source - The source of the operation
   * @param object - The object to dispose
   * @param disposeMethod - The dispose method name (default: 'dispose')
   */
  public safeDispose(source: string, object: any, disposeMethod: string = 'dispose'): void {
    if (!object || typeof object[disposeMethod] !== 'function') {
      return;
    }

    try {
      object[disposeMethod]();
    } catch (error) {
      this.logger.warn(source, `Failed to dispose object: ${error}`);
    }
  }

  /**
   * Safely execute a cleanup function
   * @param source - The source of the operation
   * @param cleanupFn - The cleanup function to execute
   */
  public safeCleanup(source: string, cleanupFn: () => void): void {
    if (typeof cleanupFn !== 'function') {
      return;
    }

    try {
      cleanupFn();
    } catch (error) {
      this.logger.warn(source, `Cleanup function failed: ${error}`);
    }
  }

  /**
   * Tracks an object for later disposal
   * @param object - The object to track
   */
  public trackObject(object: DisposableObject): void {
    this.trackedObjects.add(object);
  }

  /**
   * Disposes of all tracked objects
   */
  public disposeAllTrackedObjects(): void {
    const objectsToDispose = Array.from(this.trackedObjects);
    objectsToDispose.forEach((object) => {
      try {
        this.disposeObject(object);
      } catch (error) {
        this.logger.warn('UnifiedDisposalSystem', `Error disposing tracked object: ${error}`);
      }
    });
    this.trackedObjects.clear();
  }

  /**
   * Gets the count of tracked objects
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

  /**
   * Execute a function with disposal error handling
   * @param source - The source of the operation
   * @param operation - The operation to execute
   * @param onError - Optional error handler
   */
  public async executeWithDisposalHandling<T>(
    source: string,
    operation: () => Promise<T>,
    onError?: (error: any) => void
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(source, 'Operation failed', error);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }

  /**
   * Execute a synchronous function with disposal error handling
   * @param source - The source of the operation
   * @param operation - The operation to execute
   * @param onError - Optional error handler
   */
  public executeSyncWithDisposalHandling<T>(
    source: string,
    operation: () => T,
    onError?: (error: any) => void
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.logger.error(source, 'Operation failed', error);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }

  /**
   * Wrap a function with disposal error handling
   * @param source - The source of the operation
   * @param fn - The function to wrap
   */
  public wrapFunctionWithDisposal<T extends (...args: any[]) => any>(
    source: string,
    fn: T
  ): (...args: Parameters<T>) => ReturnType<T> | null {
    return (...args: Parameters<T>): ReturnType<T> | null => {
      try {
        return fn(...args);
      } catch (error) {
        this.logger.error(source, 'Function execution failed', error);
        return null;
      }
    };
  }
}

// Export singleton instance functions for convenience
export const disposalSystem = UnifiedDisposalSystem.getInstance();

/**
 * Convenience functions that delegate to the singleton instance
 */
export function safeDisposeObject(object: THREE.Object3D): void {
  disposalSystem.safeDisposeObject(object);
}

export function safeDisposeGeometry(geometry: THREE.BufferGeometry): void {
  disposalSystem.safeDisposeGeometry(geometry);
}

export function safeDisposeMaterial(material: THREE.Material | THREE.Material[]): void {
  disposalSystem.safeDisposeMaterial(material);
}

export function disposeObject(object: DisposableObject): void {
  disposalSystem.disposeObject(object);
}

export function disposeMaterial(material: THREE.Material): void {
  disposalSystem.disposeMaterial(material);
}

export function disposeTexture(texture: THREE.Texture): void {
  disposalSystem.disposeTexture(texture);
}

export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  disposalSystem.disposeGeometry(geometry);
}

export function safeDispose(source: string, object: any, disposeMethod?: string): void {
  disposalSystem.safeDispose(source, object, disposeMethod);
}

export function safeCleanup(source: string, cleanupFn: () => void): void {
  disposalSystem.safeCleanup(source, cleanupFn);
}

export default UnifiedDisposalSystem;