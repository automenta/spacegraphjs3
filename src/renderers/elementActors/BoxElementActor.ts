import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { BoxNodeSpec, NodeSpec, Spec } from '../../types';
import { BaseGeometryActor } from './BaseGeometryActor';

/**
 * An ElementActor for rendering box/cube nodes with configurable dimensions and rounded corners.
 */
export class BoxElementActor extends BaseGeometryActor {
  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Get dimensions from node spec or use defaults
    const boxSpec = this.elementState as BoxNodeSpec;
    const width = boxSpec.width ?? 1.0;
    const height = boxSpec.height ?? 1.0;
    const depth = boxSpec.depth ?? 1.0;
    const rounded = boxSpec.rounded ?? false;

    // Create appropriate geometry based on rounded property
    if (rounded) {
      return this.createRoundedBoxGeometry(width, height, depth, 0.1);
    } else {
      return new THREE.BoxGeometry(width, height, depth);
    }
  }

  protected createGlowGeometry(): THREE.BufferGeometry {
    // Get dimensions from node spec or use defaults
    const boxSpec = this.elementState as BoxNodeSpec;
    const width = boxSpec.width ?? 1.0;
    const height = boxSpec.height ?? 1.0;
    const depth = boxSpec.depth ?? 1.0;
    const rounded = boxSpec.rounded ?? false;

    // Create slightly larger geometry for glow effect
    const glowScale = 1.2;
    if (rounded) {
      return this.createRoundedBoxGeometry(
        width * glowScale,
        height * glowScale,
        depth * glowScale,
        0.1
      );
    } else {
      return new THREE.BoxGeometry(
        width * glowScale,
        height * glowScale,
        depth * glowScale
      );
    }
  }

  /**
   * Create a rounded box geometry approximation
   * @param width - Width of the box
   * @param height - Height of the box
   * @param depth - Depth of the box
   * @param radius - Radius for rounding corners
   * @returns BufferGeometry with rounded corners
   */
  private createRoundedBoxGeometry(
    width: number,
    height: number,
    depth: number,
    radius: number
  ): THREE.BufferGeometry {
    // Limit the radius to prevent overlapping
    const maxRadius = Math.min(width, height, depth) * 0.5;
    radius = Math.min(radius, maxRadius);

    // Create a basic box geometry
    const geometry = new THREE.BoxGeometry(width, height, depth);

    // If radius is 0, return the regular box
    if (radius <= 0) {
      return geometry;
    }

    // For a more accurate rounded box, we would need to:
    // 1. Create spheres at each corner
    // 2. Create cylinders along each edge
    // 3. Create the faces with proper UV mapping
    //
    // For now, we'll use a simplified approach that adjusts vertex positions
    // to approximate rounded corners

    const positionAttribute = geometry.getAttribute('position');

    // Get the vertices
    const vertices = [];
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push(
        new THREE.Vector3(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        )
      );
    }

    // Adjust vertices to create rounded effect
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];

      // Determine which corner this vertex belongs to
      const cornerX = Math.sign(vertex.x) * width * 0.5;
      const cornerY = Math.sign(vertex.y) * height * 0.5;
      const cornerZ = Math.sign(vertex.z) * depth * 0.5;

      // Calculate distance from corner
      const dx = Math.abs(vertex.x - cornerX);
      const dy = Math.abs(vertex.y - cornerY);
      const dz = Math.abs(vertex.z - cornerZ);

      // Only adjust vertices near corners
      if (dx < radius && dy < radius && dz < radius) {
        // Move vertex toward corner by radius amount
        const direction = new THREE.Vector3(
          vertex.x - cornerX,
          vertex.y - cornerY,
          vertex.z - cornerZ
        ).normalize();

        const newPosition = new THREE.Vector3(cornerX, cornerY, cornerZ).add(
          direction.multiplyScalar(radius)
        );

        vertex.copy(newPosition);
      }
    }

    // Update position attribute
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }
}
