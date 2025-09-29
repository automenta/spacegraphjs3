import { ObjectPool } from './ObjectPool';
import { Vector3Pool, Matrix4Pool, BoxGeometryPool, SphereGeometryPool, MaterialPool } from './ThreeObjectPools';
import * as THREE from 'three';

/**
 * Global pool manager for all Three.js object pools
 */
export class ThreeObjectPoolManager {
  private pools: Map<string, ObjectPool<any>> = new Map();
  private static instance: ThreeObjectPoolManager;

  private constructor() {
    this.initializeDefaultPools();
  }

  public static getInstance(): ThreeObjectPoolManager {
    if (!ThreeObjectPoolManager.instance) {
      ThreeObjectPoolManager.instance = new ThreeObjectPoolManager();
    }
    return ThreeObjectPoolManager.instance;
  }

  private initializeDefaultPools(): void {
    // Vector3 pool
    this.pools.set('vector3', new Vector3Pool());

    // Matrix4 pool
    this.pools.set('matrix4', new Matrix4Pool());

    // Geometry pools
    this.pools.set('boxGeometry', new BoxGeometryPool());
    this.pools.set('sphereGeometry', new SphereGeometryPool());

    // Material pool
    this.pools.set('material', new MaterialPool());
  }

  public getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  public registerPool<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool);
  }

  /**
   * Get pooled Vector3
   */
  public getVector3(): THREE.Vector3 {
    const pool = this.pools.get('vector3') as Vector3Pool;
    return pool.acquire();
  }

  /**
   * Release pooled Vector3
   */
  public releaseVector3(vec: THREE.Vector3): void {
    const pool = this.pools.get('vector3') as Vector3Pool;
    pool.release(vec);
  }

  /**
   * Get pooled BoxGeometry
   */
  public getBoxGeometry(width = 1, height = 1, depth = 1): THREE.BoxGeometry {
    const poolName = `boxGeometry_${width}_${height}_${depth}`;
    let pool = this.pools.get(poolName) as BoxGeometryPool;
    
    if (!pool) {
      pool = new BoxGeometryPool(width, height, depth);
      this.pools.set(poolName, pool);
    }
    
    return pool.acquire();
  }

  /**
   * Release pooled BoxGeometry
   */
  public releaseBoxGeometry(geom: THREE.BoxGeometry, width = 1, height = 1, depth = 1): void {
    const poolName = `boxGeometry_${width}_${height}_${depth}`;
    const pool = this.pools.get(poolName) as BoxGeometryPool;
    
    if (pool) {
      pool.release(geom);
    }
  }

  /**
   * Get pooled SphereGeometry
   */
  public getSphereGeometry(radius = 1, widthSegments = 32, heightSegments = 32): THREE.SphereGeometry {
    const poolName = `sphereGeometry_${radius}_${widthSegments}_${heightSegments}`;
    let pool = this.pools.get(poolName) as SphereGeometryPool;
    
    if (!pool) {
      pool = new SphereGeometryPool(radius, widthSegments, heightSegments);
      this.pools.set(poolName, pool);
    }
    
    return pool.acquire();
  }

  /**
   * Release pooled SphereGeometry
   */
  public releaseSphereGeometry(geom: THREE.SphereGeometry, radius = 1, widthSegments = 32, heightSegments = 32): void {
    const poolName = `sphereGeometry_${radius}_${widthSegments}_${heightSegments}`;
    const pool = this.pools.get(poolName) as SphereGeometryPool;
    
    if (pool) {
      pool.release(geom);
    }
  }

  /**
   * Get pooled Material
   */
  public getMaterial(color?: THREE.Color): THREE.MeshBasicMaterial {
    const pool = this.pools.get('material') as MaterialPool;
    const material = pool.acquire();
    
    if (color) {
      material.color.copy(color);
    }
    
    return material;
  }

  /**
   * Release pooled Material
   */
  public releaseMaterial(mat: THREE.MeshBasicMaterial): void {
    const pool = this.pools.get('material') as MaterialPool;
    pool.release(mat);
  }

  /**
   * Get all pool statistics
   */
  public getAllStats(): Record<string, { size: number }> {
    const stats: Record<string, { size: number }> = {};
    
    for (const [name, pool] of this.pools) {
      stats[name] = { size: pool.size };
    }
    
    return stats;
  }

  /**
   * Dispose of all pools
   */
  public dispose(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
    this.pools.clear();
  }

  /**
   * Reinitialize default pools after disposal
   */
  public reinitializeDefaultPools(): void {
    this.initializeDefaultPools();
  }
}