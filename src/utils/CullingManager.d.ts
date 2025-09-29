import { Camera, Object3D } from 'three';
/**
 * CullingManager handles advanced frustum culling for 3D objects.
 * It determines which objects are visible within the camera's view
 * to optimize rendering performance.
 */
export declare class CullingManager {
    private camera;
    private frustum;
    private matrix;
    private objects;
    private boundingSphereCache;
    /**
     * Sets the camera to use for culling calculations
     *
     * @param camera - The camera to use
     */
    setCamera(camera: Camera): void;
    /**
     * Registers an object for culling checks
     *
     * @param object - The object to register
     */
    registerObject(object: Object3D): void;
    /**
     * Unregisters an object from culling checks
     *
     * @param object - The object to unregister
     */
    unregisterObject(object: Object3D): void;
    /**
     * Updates the frustum based on the current camera
     */
    updateFrustum(): void;
    /**
     * Performs culling checks on all registered objects
     *
     * @returns Array of visible objects
     */
    cullObjects(): Object3D[];
    /**
     * Checks if an object is visible within the frustum
     *
     * @param object - The object to check
     * @returns True if the object is visible
     */
    isVisible(object: Object3D): boolean;
    /**
     * Updates the bounding sphere for an object
     *
     * @param object - The object to update
     * @param sphere - The sphere to update
     */
    private updateBoundingSphere;
    /**
     * Forces an update of an object's bounding sphere cache
     *
     * @param object - The object to update
     */
    updateObjectBounds(object: Object3D): void;
    /**
     * Clears all registered objects and cached bounding spheres
     */
    clear(): void;
    /**
     * Gets the count of registered objects
     *
     * @returns Number of registered objects
     */
    getObjectCount(): number;
    /**
     * Gets the count of cached bounding spheres
     *
     * @returns Number of cached bounding spheres
     */
    getCacheCount(): number;
}
