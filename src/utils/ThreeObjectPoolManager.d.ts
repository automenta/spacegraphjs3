import { ObjectPool } from './ObjectPool';
import * as THREE from 'three';
/**
 * Global pool manager for all Three.js object pools
 */
export declare class ThreeObjectPoolManager {
    private pools;
    private static instance;
    private constructor();
    static getInstance(): ThreeObjectPoolManager;
    private initializeDefaultPools;
    getPool<T>(name: string): ObjectPool<T> | undefined;
    registerPool<T>(name: string, pool: ObjectPool<T>): void;
    /**
     * Get pooled Vector3
     */
    getVector3(): THREE.Vector3;
    /**
     * Release pooled Vector3
     */
    releaseVector3(vec: THREE.Vector3): void;
    /**
     * Get pooled BoxGeometry
     */
    getBoxGeometry(width?: number, height?: number, depth?: number): THREE.BoxGeometry;
    /**
     * Release pooled BoxGeometry
     */
    releaseBoxGeometry(geom: THREE.BoxGeometry, width?: number, height?: number, depth?: number): void;
    /**
     * Get pooled SphereGeometry
     */
    getSphereGeometry(radius?: number, widthSegments?: number, heightSegments?: number): THREE.SphereGeometry;
    /**
     * Release pooled SphereGeometry
     */
    releaseSphereGeometry(geom: THREE.SphereGeometry, radius?: number, widthSegments?: number, heightSegments?: number): void;
    /**
     * Get pooled Material
     */
    getMaterial(color?: THREE.Color): THREE.MeshBasicMaterial;
    /**
     * Release pooled Material
     */
    releaseMaterial(mat: THREE.MeshBasicMaterial): void;
    /**
     * Get all pool statistics
     */
    getAllStats(): Record<string, {
        size: number;
    }>;
    /**
     * Dispose of all pools
     */
    dispose(): void;
    /**
     * Reinitialize default pools after disposal
     */
    reinitializeDefaultPools(): void;
}
