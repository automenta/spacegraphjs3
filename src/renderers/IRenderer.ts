import * as THREE from 'three';

/**
 * Defines the contract for a renderer in SpaceGraph.
 * A renderer is responsible for creating and managing the visual representation of nodes.
 */
export interface IRenderer {
  /**
   * Returns the Three.js objects that should be tested for raycasting.
   * This is used by the InteractionController to detect which element is under the pointer.
   */
  getRaycastableObjects(): THREE.Object3D[];

  /**
   * Given a Three.js intersection object, returns the ID of the graph element.
   * This is used by the InteractionController to translate a raycaster hit into a node ID.
   * @param intersection - The intersection object from the raycaster.
   */
  getNodeIdFromIntersection(intersection: THREE.Intersection): string | null;

  /**
   * Cleans up all resources used by the renderer, such as geometries, materials, and scene objects.
   */
  dispose(): void;
}
