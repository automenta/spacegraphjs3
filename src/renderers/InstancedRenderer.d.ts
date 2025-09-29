/**
 * @file This file contains the InstancedRenderer, which is a high-performance renderer
 * that uses THREE.InstancedMesh to draw a large number of nodes.
 */
import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec } from '../types';
import { IRenderer } from './IRenderer';
export declare class InstancedRenderer implements IRenderer {
    instancedMeshes: Map<string, THREE.InstancedMesh>;
    private scene;
    private state;
    private instancedGeometryRegistry;
    private typeToIdMaps;
    private dummy;
    constructor(scene: THREE.Scene, state: Store<Spec>, instancedGeometryRegistry: Map<string, THREE.BufferGeometry>);
    updateAllInstances(): void;
    getRaycastableObjects(): THREE.Object3D[];
    getNodeIdFromIntersection(intersection: THREE.Intersection): string | null;
    dispose(): void;
    private init;
    private updateInstance;
}
