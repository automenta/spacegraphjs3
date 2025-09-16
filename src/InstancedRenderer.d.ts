/**
 * @file This file contains the InstancedRenderer, which is a high-performance renderer
 * that uses THREE.InstancedMesh to draw a large number of nodes.
 *
 * @note This renderer is currently a work-in-progress and is not used by default.
 * It needs to be updated to implement the IRenderer interface before it can be
 * integrated into the SpaceGraph architecture.
 */
import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec } from './types';
import { IRenderer } from './IRenderer';
export declare class InstancedRenderer implements IRenderer {
    private static registeredGeometries;
    private scene;
    private state;
    instancedMeshes: Map<string, THREE.InstancedMesh>;
    private typeToIdMaps;
    private dummy;
    private _dispose;
    static registerInstancedType(typeName: string, geometry: THREE.BufferGeometry): void;
    constructor(scene: THREE.Scene, state: Store<Spec>);
    private init;
    private updateInstance;
    getRaycastableObjects(): THREE.Object3D[];
    getNodeIdFromIntersection(intersection: THREE.Intersection): string | null;
    dispose(): void;
}
