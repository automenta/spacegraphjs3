import * as THREE from 'three';

/**
 * Generic object pool implementation for recycling objects to reduce garbage collection.
 *
 * @template T - The type of objects managed by this pool
 */
export class ObjectPool<T> {
  private readonly createFn: () => T;
  private readonly resetFn?: (obj: T) => void;
  private readonly pool: T[] = [];
  private readonly maxSize: number;
  private acquiredCount: number = 0;
  private releasedCount: number = 0;

  /**
   * Creates a new ObjectPool.
   *
   * @param createFn - Function that creates new instances of T
   * @param resetFn - Optional function to reset objects when returning to pool
   * @param initialSize - Initial number of objects to pre-allocate
   * @param maxSize - Maximum size of the pool (0 = unlimited)
   */
  constructor(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    initialSize = 0,
    maxSize = 0
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // Pre-allocate objects if requested
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Acquires an object from the pool or creates a new one if pool is empty.
   *
   * @returns An instance of T
   */
  acquire(): T {
    this.acquiredCount++;
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  /**
   * Returns an object to the pool for reuse.
   *
   * @param obj - The object to return to the pool
   */
  release(obj: T): void {
    this.releasedCount++;

    // Validate input
    if (obj === null || obj === undefined) {
      console.warn('Attempted to release null or undefined object to pool');
      return;
    }

    // Reset the object if a reset function was provided
    if (this.resetFn) {
      try {
        this.resetFn(obj);
      } catch (error) {
        console.warn('Error resetting object in pool:', error);
        // Continue with releasing the object even if reset fails
      }
    }

    // Add to pool if we're under the max size (or if maxSize is 0 for unlimited)
    if (this.maxSize === 0 || this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // If pool is at max capacity, the object will be garbage collected
  }

  /**
   * Gets the current size of the pool.
   *
   * @returns Number of objects currently in the pool
   */
  get size(): number {
    return this.pool.length;
  }

  /**
   * Gets statistics about pool usage.
   *
   * @returns Object containing pool statistics
   */
  getStats(): {
    size: number;
    acquired: number;
    released: number;
    utilization: number;
  } {
    return {
      size: this.pool.length,
      acquired: this.acquiredCount,
      released: this.releasedCount,
      utilization:
        this.acquiredCount > 0
          ? Math.min(1, this.releasedCount / this.acquiredCount)
          : 0,
    };
  }

  /**
   * Clears all objects from the pool.
   */
  clear(): void {
    this.pool.length = 0;
    // Note: We don't reset acquired/released counts to preserve historical data
  }

  /**
   * Resets pool statistics.
   */
  resetStats(): void {
    this.acquiredCount = 0;
    this.releasedCount = 0;
  }
}

/**
 * Unified object pool manager that handles both generic objects and Three.js specific objects efficiently.
 * Consolidates ObjectPool, ThreeObjectPools, and ThreeObjectPoolManager functionality.
 */
export class ObjectPoolManager {
  private pools: Map<string, ObjectPool<any>> = new Map();
  private static instance: ObjectPoolManager;

  // Cached references to frequently used pools for better performance
  private vector3Pool: ObjectPool<THREE.Vector3> | null = null;
  private matrix4Pool: ObjectPool<THREE.Matrix4> | null = null;
  private materialPool: ObjectPool<THREE.MeshBasicMaterial> | null = null;

  private constructor() {
    this.initializeDefaultPools();
  }

  public static getInstance(): ObjectPoolManager {
    if (!ObjectPoolManager.instance) {
      ObjectPoolManager.instance = new ObjectPoolManager();
    }
    return ObjectPoolManager.instance;
  }

  private initializeDefaultPools(): void {
    // Vector3 pool
    this.vector3Pool = new ObjectPool<THREE.Vector3>(
      () => new THREE.Vector3(),
      (vec: THREE.Vector3) => vec.set(0, 0, 0)
    );
    this.pools.set('vector3', this.vector3Pool);

    // Matrix4 pool
    this.matrix4Pool = new ObjectPool<THREE.Matrix4>(
      () => new THREE.Matrix4(),
      (mat: THREE.Matrix4) => mat.identity()
    );
    this.pools.set('matrix4', this.matrix4Pool);

    // Material pool
    this.materialPool = new ObjectPool<THREE.MeshBasicMaterial>(
      () => new THREE.MeshBasicMaterial({ color: 0xffffff }),
      (mat: THREE.MeshBasicMaterial) => {
        mat.color.setHex(0xffffff);
        mat.opacity = 1;
        mat.transparent = false;
      }
    );
    this.pools.set('material', this.materialPool);
  }

  // Generic pool management
  public getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  public registerPool<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool);
  }

  public createPool<T>(
    name: string,
    createFn: () => T,
    resetFn?: (obj: T) => void,
    initialSize = 0,
    maxSize = 0
  ): ObjectPool<T> {
    const pool = new ObjectPool<T>(createFn, resetFn, initialSize, maxSize);
    this.pools.set(name, pool);
    return pool;
  }

  // Three.js specific pool methods
  public getVector3(): THREE.Vector3 {
    if (this.vector3Pool) {
      return this.vector3Pool.acquire();
    }
    const pool = this.pools.get('vector3') as ObjectPool<THREE.Vector3>;
    return pool.acquire();
  }

  public releaseVector3(vec: THREE.Vector3): void {
    if (this.vector3Pool) {
      this.vector3Pool.release(vec);
      return;
    }
    const pool = this.pools.get('vector3') as ObjectPool<THREE.Vector3>;
    pool.release(vec);
  }

  public getMatrix4(): THREE.Matrix4 {
    if (this.matrix4Pool) {
      return this.matrix4Pool.acquire();
    }
    const pool = this.pools.get('matrix4') as ObjectPool<THREE.Matrix4>;
    return pool.acquire();
  }

  public releaseMatrix4(mat: THREE.Matrix4): void {
    if (this.matrix4Pool) {
      this.matrix4Pool.release(mat);
      return;
    }
    const pool = this.pools.get('matrix4') as ObjectPool<THREE.Matrix4>;
    pool.release(mat);
  }

  public getBoxGeometry(width = 1, height = 1, depth = 1): THREE.BoxGeometry {
    const poolName = `boxGeometry_${width}_${height}_${depth}`;
    let pool = this.pools.get(poolName) as ObjectPool<THREE.BoxGeometry>;

    if (!pool) {
      pool = new ObjectPool<THREE.BoxGeometry>(
        () => new THREE.BoxGeometry(width, height, depth),
        (geom: THREE.BoxGeometry) => {
          geom.computeBoundingBox();
          geom.computeBoundingSphere();
        }
      );
      this.pools.set(poolName, pool);
    }

    return pool.acquire();
  }

  public releaseBoxGeometry(
    geom: THREE.BoxGeometry,
    width = 1,
    height = 1,
    depth = 1
  ): void {
    const poolName = `boxGeometry_${width}_${height}_${depth}`;
    const pool = this.pools.get(poolName) as ObjectPool<THREE.BoxGeometry>;

    if (pool) {
      pool.release(geom);
    }
  }

  public getSphereGeometry(
    radius = 1,
    widthSegments = 32,
    heightSegments = 32
  ): THREE.SphereGeometry {
    const poolName = `sphereGeometry_${radius}_${widthSegments}_${heightSegments}`;
    let pool = this.pools.get(poolName) as ObjectPool<THREE.SphereGeometry>;

    if (!pool) {
      pool = new ObjectPool<THREE.SphereGeometry>(
        () => new THREE.SphereGeometry(radius, widthSegments, heightSegments),
        (geom: THREE.SphereGeometry) => {
          geom.computeBoundingBox();
          geom.computeBoundingSphere();
        }
      );
      this.pools.set(poolName, pool);
    }

    return pool.acquire();
  }

  public releaseSphereGeometry(
    geom: THREE.SphereGeometry,
    radius = 1,
    widthSegments = 32,
    heightSegments = 32
  ): void {
    const poolName = `sphereGeometry_${radius}_${widthSegments}_${heightSegments}`;
    const pool = this.pools.get(poolName) as ObjectPool<THREE.SphereGeometry>;

    if (pool) {
      pool.release(geom);
    }
  }

  public getMaterial(color?: THREE.Color): THREE.MeshBasicMaterial {
    if (this.materialPool) {
      const material = this.materialPool.acquire();

      if (color) {
        material.color.copy(color);
      }

      return material;
    }

    const pool = this.pools.get('material') as ObjectPool<THREE.MeshBasicMaterial>;
    const material = pool.acquire();

    if (color) {
      material.color.copy(color);
    }

    return material;
  }

  public releaseMaterial(mat: THREE.MeshBasicMaterial): void {
    if (this.materialPool) {
      this.materialPool.release(mat);
      return;
    }

    const pool = this.pools.get('material') as ObjectPool<THREE.MeshBasicMaterial>;
    pool.release(mat);
  }

  // Statistics and management
  public getAllStats(): Record<
    string,
    {
      size: number;
      acquired?: number;
      released?: number;
      utilization?: number;
    }
  > {
    const stats: Record<
      string,
      {
        size: number;
        acquired?: number;
        released?: number;
        utilization?: number;
      }
    > = {};

    for (const [name, pool] of this.pools) {
      if (typeof (pool as any).getStats === 'function') {
        stats[name] = (pool as any).getStats();
      } else {
        stats[name] = { size: pool.size };
      }
    }

    return stats;
  }

  public resetAllStats(): void {
    for (const pool of this.pools.values()) {
      if (typeof (pool as any).resetStats === 'function') {
        (pool as any).resetStats();
      }
    }
  }

  public dispose(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
    this.pools.clear();

    // Clear cached references
    this.vector3Pool = null;
    this.matrix4Pool = null;
    this.materialPool = null;
  }

  public reinitializeDefaultPools(): void {
    this.initializeDefaultPools();
  }
}


// ObjectPool is already exported above for backward compatibility