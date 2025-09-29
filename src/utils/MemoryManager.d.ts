import { Object3D, Material, Texture, BufferGeometry } from 'three';
interface Disposable {
    dispose(): void;
}
type DisposableObject = Object3D | Material | Texture | BufferGeometry | Disposable;
/**
 * MemoryManager handles efficient memory management for Three.js objects.
 * It provides utilities for disposing of geometries, materials, and textures
 * to prevent memory leaks and optimize performance.
 */
export declare class MemoryManager {
    private static instance;
    private trackedObjects;
    private constructor();
    /**
     * Gets the singleton instance of MemoryManager
     *
     * @returns The MemoryManager instance
     */
    static getInstance(): MemoryManager;
    /**
     * Disposes of a Three.js object and all its resources
     *
     * @param object - The object to dispose
     */
    disposeObject(object: DisposableObject): void;
    /**
     * Disposes of a material and its resources
     *
     * @param material - The material to dispose
     */
    disposeMaterial(material: Material): void;
    /**
     * Disposes of a texture and its resources
     *
     * @param texture - The texture to dispose
     */
    disposeTexture(texture: Texture): void;
    /**
     * Disposes of a geometry and its resources
     *
     * @param geometry - The geometry to dispose
     */
    disposeGeometry(geometry: BufferGeometry): void;
    /**
     * Tracks an object for later disposal
     *
     * @param object - The object to track
     */
    trackObject(object: DisposableObject): void;
    /**
     * Disposes of all tracked objects
     */
    disposeAllTrackedObjects(): void;
    /**
     * Gets the count of tracked objects
     *
     * @returns Number of tracked objects
     */
    getTrackedObjectCount(): number;
}
export {};
