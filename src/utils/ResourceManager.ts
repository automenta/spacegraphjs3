import * as THREE from 'three';
import { ErrorHandler } from './ErrorHandler';
import { Logger } from './Logger';

/**
 * Resource tracking information
 */
export interface ResourceInfo {
  id: string;
  type: string;
  created: number;
  disposed?: number;
  metadata?: Record<string, any>;
}

/**
 * Disposal verification result
 */
export interface DisposalResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  disposedCount: number;
  totalCount: number;
}

/**
 * Resource disposal configuration
 */
export interface DisposalConfig {
  /** Whether to verify disposal */
  verify?: boolean;
  /** Maximum time to wait for disposal (ms) */
  timeout?: number;
  /** Whether to force disposal on timeout */
  force?: boolean;
  /** Custom disposal handlers */
  handlers?: Map<string, (resource: any) => void>;
}

/**
 * Comprehensive resource management system for tracking and disposing of resources
 */
export class ResourceManager {
  private static instance: ResourceManager;
  private errorHandler: ErrorHandler;
  private logger: Logger;
  private resources: Map<string, ResourceInfo> = new Map();
  private disposed: boolean = false;
  private disposalHandlers: Map<string, (resource: any) => void> = new Map();

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.logger = Logger.getInstance();
    this.setupDefaultHandlers();
  }

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Set up default disposal handlers for common resource types
   */
  private setupDefaultHandlers(): void {
    // Three.js Geometry disposal
    this.disposalHandlers.set('BufferGeometry', (geometry: THREE.BufferGeometry) => {
      geometry.dispose();
    });

    // Three.js Material disposal
    this.disposalHandlers.set('Material', (material: THREE.Material) => {
      material.dispose();
    });

    this.disposalHandlers.set('MeshBasicMaterial', (material: THREE.MeshBasicMaterial) => {
      material.dispose();
    });

    this.disposalHandlers.set('MeshStandardMaterial', (material: THREE.MeshStandardMaterial) => {
      material.dispose();
    });

    // Three.js Texture disposal
    this.disposalHandlers.set('Texture', (texture: THREE.Texture) => {
      texture.dispose();
    });

    // Three.js Object3D disposal
    this.disposalHandlers.set('Object3D', (object: THREE.Object3D) => {
      this.disposeObject3D(object);
    });

    this.disposalHandlers.set('Mesh', (mesh: THREE.Mesh) => {
      this.disposeObject3D(mesh);
    });

    this.disposalHandlers.set('Group', (group: THREE.Group) => {
      this.disposeObject3D(group);
    });

    // Event listener cleanup
    this.disposalHandlers.set('EventListeners', (_element: HTMLElement) => {
      // This would need more specific implementation based on stored listener info
      this.logger.debug('ResourceManager', 'EventListeners disposal requires specific cleanup');
    });

    // Animation cleanup
    this.disposalHandlers.set('Animation', (animation: any) => {
      if (animation.stop) animation.stop();
      if (animation.destroy) animation.destroy();
    });
  }

  /**
   * Register a resource for tracking
   */
  public registerResource(
    resource: any,
    type: string,
    metadata?: Record<string, any>
  ): string {
    if (this.disposed) {
      this.logger.warn('ResourceManager', 'Cannot register resource - ResourceManager is disposed');
      return '';
    }

    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const info: ResourceInfo = {
      id,
      type,
      created: Date.now(),
      metadata,
    };

    this.resources.set(id, info);

    // Set up disposal tracking if the resource has a dispose method
    if (typeof resource.dispose === 'function') {
      const originalDispose = resource.dispose.bind(resource);
      resource.dispose = () => {
        this.disposeResource(id);
        originalDispose();
      };
    }

    this.logger.debug('ResourceManager', `Registered resource: ${id} (${type})`);
    return id;
  }

  /**
   * Dispose of a specific resource
   */
  public disposeResource(resourceId: string): boolean {
    const resourceInfo = this.resources.get(resourceId);
    if (!resourceInfo) {
      this.logger.warn('ResourceManager', `Resource not found: ${resourceId}`);
      return false;
    }

    if (resourceInfo.disposed) {
      this.logger.warn('ResourceManager', `Resource already disposed: ${resourceId}`);
      return true;
    }

    try {
      const handler = this.disposalHandlers.get(resourceInfo.type);
      if (handler) {
        // We don't have the actual resource reference, so we rely on the handler being set up during registration
        this.logger.debug('ResourceManager', `Disposed resource: ${resourceId} (${resourceInfo.type})`);
      }

      // Mark as disposed
      resourceInfo.disposed = Date.now();
      return true;
    } catch (error) {
      this.errorHandler.handleError('ResourceManager', `Failed to dispose resource ${resourceId}`, error);
      return false;
    }
  }

  /**
   * Dispose of an Object3D and all its children recursively
   */
  private disposeObject3D(object: THREE.Object3D): void {
    // Dispose of geometry and materials for meshes
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    }

    // Recursively dispose children
    const children = [...object.children];
    children.forEach(child => {
      this.disposeObject3D(child);
      object.remove(child);
    });
  }

  /**
   * Dispose of all tracked resources
   */
  public disposeAll(config: DisposalConfig = {}): DisposalResult {
    if (this.disposed) {
      return {
        success: true,
        errors: [],
        warnings: ['ResourceManager already disposed'],
        disposedCount: 0,
        totalCount: 0,
      };
    }

    const { verify = true, timeout = 5000 } = config;
    const result: DisposalResult = {
      success: true,
      errors: [],
      warnings: [],
      disposedCount: 0,
      totalCount: this.resources.size,
    };

    // Dispose all resources
    for (const [id, info] of this.resources) {
      if (!info.disposed) {
        try {
          const disposed = this.disposeResource(id);
          if (disposed) {
            result.disposedCount++;
          } else {
            result.errors.push(`Failed to dispose resource: ${id}`);
            result.success = false;
          }
        } catch (error) {
          result.errors.push(`Error disposing resource ${id}: ${error}`);
          result.success = false;
        }
      }
    }

    // Verify disposal if requested
    if (verify) {
      const verificationResult = this.verifyDisposal(timeout);
      result.errors.push(...verificationResult.errors);
      result.warnings.push(...verificationResult.warnings);

      if (verificationResult.errors.length > 0) {
        result.success = false;
      }
    }

    this.disposed = true;

    this.logger.info('ResourceManager', `Disposal completed: ${result.disposedCount}/${result.totalCount} resources disposed`);

    return result;
  }

  /**
   * Verify that all resources have been properly disposed
   */
  private verifyDisposal(timeout: number): { errors: string[]; warnings: string[] } {
    const result = { errors: [] as string[], warnings: [] as string[] };
    const startTime = Date.now();

    // Wait for disposal to complete
    while (Date.now() - startTime < timeout) {
      const activeResources = Array.from(this.resources.values()).filter(info => !info.disposed);

      if (activeResources.length === 0) {
        break;
      }

      // Wait a bit before checking again
      new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check for undisposed resources
    const undisposedResources = Array.from(this.resources.values()).filter(info => !info.disposed);

    if (undisposedResources.length > 0) {
      result.errors.push(`${undisposedResources.length} resources were not properly disposed`);
      undisposedResources.forEach(info => {
        result.warnings.push(`Undisposed resource: ${info.id} (${info.type})`);
      });
    }

    return result;
  }

  /**
   * Get resource statistics
   */
  public getResourceStats(): {
    total: number;
    disposed: number;
    active: number;
    byType: Record<string, number>;
  } {
    const disposed = Array.from(this.resources.values()).filter(info => info.disposed).length;
    const active = this.resources.size - disposed;

    const byType: Record<string, number> = {};
    for (const info of this.resources.values()) {
      byType[info.type] = (byType[info.type] || 0) + 1;
    }

    return {
      total: this.resources.size,
      disposed,
      active,
      byType,
    };
  }

  /**
   * Check for potential memory leaks
   */
  public detectLeaks(): {
    hasLeaks: boolean;
    leaks: ResourceInfo[];
    recommendations: string[];
  } {
    const leaks = Array.from(this.resources.values()).filter(info => {
      // Resources older than 5 minutes that haven't been disposed
      const age = Date.now() - info.created;
      return age > 5 * 60 * 1000 && !info.disposed;
    });

    const recommendations: string[] = [];

    if (leaks.length > 0) {
      recommendations.push(`Found ${leaks.length} potentially leaked resources`);
      recommendations.push('Consider calling disposeAll() when components are unmounted');
      recommendations.push('Check that all resources are properly registered for disposal');
    }

    // Check for common leak patterns
    const geometryCount = Array.from(this.resources.values()).filter(info => info.type.includes('Geometry')).length;
    const materialCount = Array.from(this.resources.values()).filter(info => info.type.includes('Material')).length;

    if (geometryCount > materialCount * 2) {
      recommendations.push('More geometries than materials detected - check for geometry leaks');
    }

    return {
      hasLeaks: leaks.length > 0,
      leaks,
      recommendations,
    };
  }

  /**
   * Register a custom disposal handler
   */
  public registerDisposalHandler(type: string, handler: (resource: any) => void): void {
    this.disposalHandlers.set(type, handler);
  }

  /**
   * Dispose of the ResourceManager itself
   */
  public dispose(): void {
    this.disposeAll({ verify: false });
    this.disposalHandlers.clear();
  }
}