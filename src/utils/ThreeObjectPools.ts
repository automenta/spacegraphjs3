import * as THREE from 'three';
import { ObjectPool } from './ObjectPool';

/**
 * Pool for Three.js Vector3 objects
 */
export class Vector3Pool extends ObjectPool<THREE.Vector3> {
  constructor(initialSize = 100, maxSize = 1000) {
    super(
      () => new THREE.Vector3(),
      (vec: THREE.Vector3) => vec.set(0, 0, 0),
      initialSize,
      maxSize
    );
  }
}

/**
 * Pool for Three.js Matrix4 objects
 */
export class Matrix4Pool extends ObjectPool<THREE.Matrix4> {
  constructor(initialSize = 50, maxSize = 500) {
    super(
      () => new THREE.Matrix4(),
      (mat: THREE.Matrix4) => mat.identity(),
      initialSize,
      maxSize
    );
  }
}

/**
 * Pool for Three.js BoxGeometry objects
 */
export class BoxGeometryPool extends ObjectPool<THREE.BoxGeometry> {
  private width: number;
  private height: number;
  private depth: number;

  constructor(
    width = 1,
    height = 1,
    depth = 1,
    initialSize = 20,
    maxSize = 200
  ) {
    super(
      () => new THREE.BoxGeometry(width, height, depth),
      (geom: THREE.BoxGeometry) => {
        // Reset geometry if needed
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
      },
      initialSize,
      maxSize
    );

    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}

/**
 * Pool for Three.js SphereGeometry objects
 */
export class SphereGeometryPool extends ObjectPool<THREE.SphereGeometry> {
  private radius: number;
  private widthSegments: number;
  private heightSegments: number;

  constructor(
    radius = 1,
    widthSegments = 32,
    heightSegments = 32,
    initialSize = 50,
    maxSize = 500
  ) {
    super(
      () => new THREE.SphereGeometry(radius, widthSegments, heightSegments),
      (geom: THREE.SphereGeometry) => {
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
      },
      initialSize,
      maxSize
    );

    this.radius = radius;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;
  }
}

/**
 * Pool for Three.js MeshBasicMaterial objects
 */
export class MaterialPool extends ObjectPool<THREE.MeshBasicMaterial> {
  private defaultColor: THREE.Color;

  constructor(
    defaultColor = new THREE.Color(0xffffff),
    initialSize = 100,
    maxSize = 1000
  ) {
    super(
      () => new THREE.MeshBasicMaterial({ color: defaultColor }),
      (mat: THREE.MeshBasicMaterial) => {
        mat.color.copy(defaultColor);
        mat.opacity = 1;
        mat.transparent = false;
      },
      initialSize,
      maxSize
    );

    this.defaultColor = defaultColor.clone();
  }
}
