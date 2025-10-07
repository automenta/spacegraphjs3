import * as THREE from 'three';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';

/**
 * Object pool configuration
 */
export interface ObjectPoolConfig {
  /** Initial pool size */
  initialSize?: number;
  /** Maximum pool size */
  maxSize?: number;
  /** Whether to grow the pool when empty */
  growOnEmpty?: boolean;
  /** Growth increment when pool is empty */
  growthIncrement?: number;
  /** Factory function to create new objects */
  factory: () => any;
  /** Reset function to clean objects before reuse */
  reset?: (obj: any) => void;
  /** Dispose function to clean up objects when pool is destroyed */
  dispose?: (obj: any) => void;
  /** Validation function to check if object is still valid */
  validate?: (obj: any) => boolean;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  name: string;
  created: number;
  active: number;
  available: number;
  disposed: number;
  hitRate: number;
  totalRequests: number;
  creationRate: number; // objects created per second
}

/**
 * Enhanced object pooling system for frequently created objects
 */
export class EnhancedObjectPool {
  private static instance: EnhancedObjectPool;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private pools: Map<string, {
    config: ObjectPoolConfig;
    available: any[];
    active: Set<any>;
    created: number;
    disposed: number;
    totalRequests: number;
    hits: number;
    creationStartTime: number;
  }> = new Map();
  private disposed: boolean = false;

  private constructor() {
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
  }

  public static getInstance(): EnhancedObjectPool {
    if (!EnhancedObjectPool.instance) {
      EnhancedObjectPool.instance = new EnhancedObjectPool();
    }
    return EnhancedObjectPool.instance;
  }

  /**
   * Create a new object pool
   */
  public createPool(name: string, config: ObjectPoolConfig): void {
    if (this.disposed) {
      this.logger.warn('EnhancedObjectPool', 'Cannot create pool - ObjectPool is disposed');
      return;
    }

    if (this.pools.has(name)) {
      this.logger.warn('EnhancedObjectPool', `Pool already exists: ${name}`);
      return;
    }

    const { initialSize = 10, growOnEmpty = true, growthIncrement = 5 } = config;

    const pool = {
      config: { ...config, growOnEmpty, growthIncrement },
      available: [] as any[],
      active: new Set<any>(),
      created: 0,
      disposed: 0,
      totalRequests: 0,
      hits: 0,
      creationStartTime: Date.now(),
    };

    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createObject(name, pool);
      if (obj) {
        pool.available.push(obj);
      }
    }

    this.pools.set(name, pool);
    this.logger.debug('EnhancedObjectPool', `Created pool: ${name} with ${initialSize} objects`);
  }

  /**
   * Get an object from the pool
   */
  public get<T>(name: string): T | null {
    if (this.disposed) {
      this.logger.warn('EnhancedObjectPool', 'Cannot get object - ObjectPool is disposed');
      return null;
    }

    const pool = this.pools.get(name);
    if (!pool) {
      this.logger.warn('EnhancedObjectPool', `Pool not found: ${name}`);
      return null;
    }

    pool.totalRequests++;

    // Try to get from available objects
    if (pool.available.length > 0) {
      const obj = pool.available.pop()!;
      pool.active.add(obj);
      pool.hits++;

      // Reset the object if reset function is provided
      if (pool.config.reset) {
        try {
          pool.config.reset(obj);
        } catch (error) {
          this.errorHandler.handleError('EnhancedObjectPool', `Reset failed for pool ${name}`, error);
        }
      }

      this.logger.debug('EnhancedObjectPool', `Retrieved object from pool: ${name}`);
      return obj as T;
    }

    // Pool is empty, try to grow if allowed
    if (pool.config.growOnEmpty && pool.created < (pool.config.maxSize || 100)) {
      const growthIncrement = pool.config.growthIncrement || 5;
      const canCreate = Math.min(growthIncrement, (pool.config.maxSize || 100) - pool.created);

      for (let i = 0; i < canCreate; i++) {
        const obj = this.createObject(name, pool);
        if (obj) {
          pool.available.push(obj);
        }
      }

      // Try again to get an object
      if (pool.available.length > 0) {
        const obj = pool.available.pop()!;
        pool.active.add(obj);

        if (pool.config.reset) {
          pool.config.reset(obj);
        }

        this.logger.debug('EnhancedObjectPool', `Grew pool ${name} and retrieved object`);
        return obj as T;
      }
    }

    this.logger.warn('EnhancedObjectPool', `Pool exhausted: ${name}`);
    return null;
  }

  /**
   * Return an object to the pool
   */
  public release(name: string, obj: any): boolean {
    if (this.disposed) {
      this.logger.warn('EnhancedObjectPool', 'Cannot release object - ObjectPool is disposed');
      return false;
    }

    const pool = this.pools.get(name);
    if (!pool) {
      this.logger.warn('EnhancedObjectPool', `Pool not found: ${name}`);
      return false;
    }

    if (!pool.active.has(obj)) {
      this.logger.warn('EnhancedObjectPool', `Object not from pool: ${name}`);
      return false;
    }

    // Validate object if validator is provided
    if (pool.config.validate) {
      try {
        if (!pool.config.validate(obj)) {
          this.logger.warn('EnhancedObjectPool', `Object failed validation: ${name}`);
          pool.active.delete(obj);
          if (pool.config.dispose) {
            pool.config.dispose(obj);
          }
          return false;
        }
      } catch (error) {
        this.errorHandler.handleError('EnhancedObjectPool', `Validation failed for pool ${name}`, error);
        pool.active.delete(obj);
        if (pool.config.dispose) {
          pool.config.dispose(obj);
        }
        return false;
      }
    }

    // Reset object before returning to pool
    if (pool.config.reset) {
      try {
        pool.config.reset(obj);
      } catch (error) {
        this.errorHandler.handleError('EnhancedObjectPool', `Reset failed for pool ${name}`, error);
      }
    }

    pool.active.delete(obj);
    pool.available.push(obj);

    this.logger.debug('EnhancedObjectPool', `Released object to pool: ${name}`);
    return true;
  }

  /**
   * Create a new object for the pool
   */
  private createObject(name: string, pool: any): any | null {
    try {
      const obj = pool.config.factory();
      pool.created++;
      return obj;
    } catch (error) {
      this.errorHandler.handleError('EnhancedObjectPool', `Factory failed for pool ${name}`, error);
      return null;
    }
  }

  /**
   * Get statistics for a specific pool
   */
  public getPoolStats(name: string): PoolStats | null {
    const pool = this.pools.get(name);
    if (!pool) {
      return null;
    }

    const uptime = (Date.now() - pool.creationStartTime) / 1000; // seconds
    const creationRate = uptime > 0 ? pool.created / uptime : 0;
    const hitRate = pool.totalRequests > 0 ? pool.hits / pool.totalRequests : 0;

    return {
      name,
      created: pool.created,
      active: pool.active.size,
      available: pool.available.length,
      disposed: pool.disposed,
      hitRate,
      totalRequests: pool.totalRequests,
      creationRate,
    };
  }

  /**
   * Get statistics for all pools
   */
  public getAllPoolStats(): PoolStats[] {
    return Array.from(this.pools.keys()).map(name => this.getPoolStats(name)!).filter(Boolean);
  }

  /**
   * Dispose of a specific pool
   */
  public disposePool(name: string): boolean {
    const pool = this.pools.get(name);
    if (!pool) {
      return false;
    }

    // Dispose all objects in the pool
    for (const obj of pool.available) {
      if (pool.config.dispose) {
        try {
          pool.config.dispose(obj);
        } catch (error) {
          this.errorHandler.handleError('EnhancedObjectPool', `Dispose failed for pool ${name}`, error);
        }
      }
    }

    for (const obj of pool.active) {
      if (pool.config.dispose) {
        try {
          pool.config.dispose(obj);
        } catch (error) {
          this.errorHandler.handleError('EnhancedObjectPool', `Dispose failed for pool ${name}`, error);
        }
      }
    }

    pool.disposed += pool.created;
    this.pools.delete(name);

    this.logger.debug('EnhancedObjectPool', `Disposed pool: ${name}`);
    return true;
  }

  /**
   * Dispose of all pools
   */
  public disposeAll(): void {
    const poolNames = Array.from(this.pools.keys());
    for (const name of poolNames) {
      this.disposePool(name);
    }
    this.disposed = true;
    this.logger.debug('EnhancedObjectPool', 'Disposed all pools');
  }

  /**
   * Predefined pools for common Three.js objects
   */
  public createThreeJSPools(): void {
    // Vector3 pool
    this.createPool('Vector3', {
      initialSize: 50,
      maxSize: 200,
      factory: () => new THREE.Vector3(),
      reset: (vec: THREE.Vector3) => vec.set(0, 0, 0),
      dispose: (_vec: THREE.Vector3) => {
        // Vector3 doesn't need explicit disposal
      },
      validate: (vec: THREE.Vector3) => vec instanceof THREE.Vector3,
    });

    // Matrix4 pool
    this.createPool('Matrix4', {
      initialSize: 20,
      maxSize: 100,
      factory: () => new THREE.Matrix4(),
      reset: (mat: THREE.Matrix4) => mat.identity(),
      dispose: (_mat: THREE.Matrix4) => {
        // Matrix4 doesn't need explicit disposal
      },
      validate: (mat: THREE.Matrix4) => mat instanceof THREE.Matrix4,
    });

    // Color pool
    this.createPool('Color', {
      initialSize: 20,
      maxSize: 100,
      factory: () => new THREE.Color(),
      reset: (color: THREE.Color) => color.setHex(0xffffff),
      dispose: (_color: THREE.Color) => {
        // Color doesn't need explicit disposal
      },
      validate: (color: THREE.Color) => color instanceof THREE.Color,
    });

    // Box3 pool
    this.createPool('Box3', {
      initialSize: 10,
      maxSize: 50,
      factory: () => new THREE.Box3(),
      reset: (box: THREE.Box3) => box.makeEmpty(),
      dispose: (_box: THREE.Box3) => {
        // Box3 doesn't need explicit disposal
      },
      validate: (box: THREE.Box3) => box instanceof THREE.Box3,
    });

    this.logger.debug('EnhancedObjectPool', 'Created Three.js object pools');
  }

  /**
   * Get or create a pooled Vector3
   */
  public getVector3(): THREE.Vector3 {
    return this.get<THREE.Vector3>('Vector3') || new THREE.Vector3();
  }

  /**
   * Release a Vector3 back to the pool
   */
  public releaseVector3(vec: THREE.Vector3): void {
    this.release('Vector3', vec);
  }

  /**
   * Get or create a pooled Matrix4
   */
  public getMatrix4(): THREE.Matrix4 {
    return this.get<THREE.Matrix4>('Matrix4') || new THREE.Matrix4();
  }

  /**
   * Release a Matrix4 back to the pool
   */
  public releaseMatrix4(mat: THREE.Matrix4): void {
    this.release('Matrix4', mat);
  }

  /**
   * Get or create a pooled Color
   */
  public getColor(): THREE.Color {
    return this.get<THREE.Color>('Color') || new THREE.Color();
  }

  /**
   * Release a Color back to the pool
   */
  public releaseColor(color: THREE.Color): void {
    this.release('Color', color);
  }

  /**
   * Get or create a pooled Box3
   */
  public getBox3(): THREE.Box3 {
    return this.get<THREE.Box3>('Box3') || new THREE.Box3();
  }

  /**
   * Release a Box3 back to the pool
   */
  public releaseBox3(box: THREE.Box3): void {
    this.release('Box3', box);
  }
}