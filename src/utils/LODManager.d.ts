import { Object3D, Camera } from 'three';
/**
 * Level of Detail (LOD) settings for an object
 */
export interface LODSettings {
    /** Distance thresholds for different detail levels */
    distances: number[];
    /** Functions to generate different detail representations */
    detailLevels: ((object: Object3D) => Object3D)[];
}
/**
 * LODManager handles level of detail management for 3D objects.
 * It automatically switches between different representations of objects
 * based on their distance from the camera to optimize performance.
 */
export declare class LODManager {
    private objects;
    private currentLevels;
    private camera;
    /**
     * Sets the camera to use for distance calculations
     *
     * @param camera - The camera to use
     */
    setCamera(camera: Camera): void;
    /**
     * Registers an object with its LOD settings
     *
     * @param object - The object to register
     * @param settings - The LOD settings for the object
     */
    registerObject(object: Object3D, settings: LODSettings): void;
    /**
     * Unregisters an object
     *
     * @param object - The object to unregister
     */
    unregisterObject(object: Object3D): void;
    /**
     * Updates all registered objects based on their distance from the camera
     */
    update(): void;
    /**
     * Calculates the appropriate LOD level based on distance
     *
     * @param distance - Distance from camera
     * @param distances - Distance thresholds
     * @returns The appropriate LOD level
     */
    private calculateLODLevel;
    /**
     * Switches an object to a different LOD level
     *
     * @param object - The object to switch
     * @param level - The new LOD level
     * @param settings - The LOD settings
     */
    private switchLODLevel;
    /**
     * Gets the current LOD level for an object
     *
     * @param object - The object to check
     * @returns The current LOD level
     */
    getCurrentLODLevel(object: Object3D): number | undefined;
    /**
     * Clears all registered objects
     */
    clear(): void;
}
