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
import { Spec, Element } from './types';
export declare class InstancedRenderer {
    private scene;
    private state;
    instancedMesh: THREE.InstancedMesh;
    private idToIndex;
    private indexToId;
    private dummy;
    constructor(scene: THREE.Scene, state: Store<Spec>);
    /**
     * Initialize the instanced mesh and set up the effects to update it.
     */
    private init;
    updateNodeMappings(): void;
    updateAllInstances(): void;
    updateInstance(index: number, node: Element): void;
    getNodeId(instanceId: number): string | undefined;
    dispose(): void;
}
