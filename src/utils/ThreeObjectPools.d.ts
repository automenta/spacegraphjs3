import * as THREE from 'three';
import { ObjectPool } from './ObjectPool';
/**
 * Pool for Three.js Vector3 objects
 */
export declare class Vector3Pool extends ObjectPool<THREE.Vector3> {
    constructor(initialSize?: number, maxSize?: number);
}
/**
 * Pool for Three.js Matrix4 objects
 */
export declare class Matrix4Pool extends ObjectPool<THREE.Matrix4> {
    constructor(initialSize?: number, maxSize?: number);
}
/**
 * Pool for Three.js BoxGeometry objects
 */
export declare class BoxGeometryPool extends ObjectPool<THREE.BoxGeometry> {
    private width;
    private height;
    private depth;
    constructor(width?: number, height?: number, depth?: number, initialSize?: number, maxSize?: number);
}
/**
 * Pool for Three.js SphereGeometry objects
 */
export declare class SphereGeometryPool extends ObjectPool<THREE.SphereGeometry> {
    private radius;
    private widthSegments;
    private heightSegments;
    constructor(radius?: number, widthSegments?: number, heightSegments?: number, initialSize?: number, maxSize?: number);
}
/**
 * Pool for Three.js MeshBasicMaterial objects
 */
export declare class MaterialPool extends ObjectPool<THREE.MeshBasicMaterial> {
    private defaultColor;
    constructor(defaultColor?: THREE.Color, initialSize?: number, maxSize?: number);
}
