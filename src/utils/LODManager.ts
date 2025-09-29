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
export class LODManager {
  private objects: Map<Object3D, LODSettings> = new Map();
  private currentLevels: Map<Object3D, number> = new Map();
  private camera: Camera | null = null;

  /**
   * Sets the camera to use for distance calculations
   * 
   * @param camera - The camera to use
   */
  public setCamera(camera: Camera): void {
    this.camera = camera;
  }

  /**
   * Registers an object with its LOD settings
   * 
   * @param object - The object to register
   * @param settings - The LOD settings for the object
   */
  public registerObject(object: Object3D, settings: LODSettings): void {
    this.objects.set(object, settings);
    this.currentLevels.set(object, 0);
  }

  /**
   * Unregisters an object
   * 
   * @param object - The object to unregister
   */
  public unregisterObject(object: Object3D): void {
    this.objects.delete(object);
    this.currentLevels.delete(object);
  }

  /**
   * Updates all registered objects based on their distance from the camera
   */
  public update(): void {
    if (!this.camera) return;

    const cameraPosition = this.camera.position;

    for (const [object, settings] of this.objects.entries()) {
      const distance = cameraPosition.distanceTo(object.position);
      const newLevel = this.calculateLODLevel(distance, settings.distances);

      if (newLevel !== this.currentLevels.get(object)) {
        this.switchLODLevel(object, newLevel, settings);
        this.currentLevels.set(object, newLevel);
      }
    }
  }

  /**
   * Calculates the appropriate LOD level based on distance
   * 
   * @param distance - Distance from camera
   * @param distances - Distance thresholds
   * @returns The appropriate LOD level
   */
  private calculateLODLevel(distance: number, distances: number[]): number {
    for (let i = 0; i < distances.length; i++) {
      if (distance < distances[i]) {
        return i;
      }
    }
    return distances.length; // Highest detail level
  }

  /**
   * Switches an object to a different LOD level
   * 
   * @param object - The object to switch
   * @param level - The new LOD level
   * @param settings - The LOD settings
   */
  private switchLODLevel(object: Object3D, level: number, settings: LODSettings): void {
    // Remove current representation
    if (object.parent) {
      object.parent.remove(object);
    }

    // Create new representation
    if (level < settings.detailLevels.length) {
      const newObject = settings.detailLevels[level](object);
      // Add to parent if the original object had one
      if (object.parent) {
        object.parent.add(newObject);
      }
    }
  }

  /**
   * Gets the current LOD level for an object
   * 
   * @param object - The object to check
   * @returns The current LOD level
   */
  public getCurrentLODLevel(object: Object3D): number | undefined {
    return this.currentLevels.get(object);
  }

  /**
   * Clears all registered objects
   */
  public clear(): void {
    this.objects.clear();
    this.currentLevels.clear();
  }
}