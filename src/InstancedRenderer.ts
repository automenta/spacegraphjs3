import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { Spec } from './types';

const MAX_INSTANCES = 100000;

export class InstancedRenderer {
    private scene: THREE.Scene;
    private state: Store<Spec>;
    public instancedMesh: THREE.InstancedMesh;
    private idToIndex: Map<string, number> = new Map();
    private indexToId: Map<number, string> = new Map();
    private dummy = new THREE.Object3D();

    constructor(scene: THREE.Scene, state: Store<Spec>) {
        this.scene = scene;
        this.state = state;

        this.init();
    }

    private init() {
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        // @ts-ignore
        geometry.computeBoundsTree();
        const material = new THREE.MeshBasicMaterial();
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3);
        this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.instancedMesh);

        createEffect(() => {
            const nodes = this.state.data?.nodes || [];

            this.idToIndex.clear();
            this.indexToId.clear();

            nodes.forEach((node, i) => {
                this.idToIndex.set(node.id, i);
                this.indexToId.set(i, node.id);
            });

            this.instancedMesh.count = nodes.length;
            this.updateAllInstances();
        });

        createEffect(() => {
            // This effect tracks changes to individual node properties
            this.state.data?.nodes.forEach(node => {
                const index = this.idToIndex.get(node.id);
                if (index !== undefined) {
                    this.updateInstance(index, node);
                }
            });
            this.instancedMesh.instanceMatrix.needsUpdate = true;
            this.instancedMesh.instanceColor!.needsUpdate = true;
        });

        createEffect(() => {
            // This effect specifically tracks interaction state changes for colors
            this.state.interaction.hoveredElementId;
            this.state.interaction.selectedElementIds;
            this.updateAllInstances();
        });
    }

    private updateAllInstances() {
        const nodes = this.state.data?.nodes || [];
        nodes.forEach((node, i) => {
            const index = this.idToIndex.get(node.id);
            if (index !== undefined) {
                this.updateInstance(index, node);
            }
        });
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.instanceColor!.needsUpdate = true;
    }

    private updateInstance(index: number, node: any) {
        // Update position
        this.dummy.position.set(
            node.position?.x ?? 0,
            node.position?.y ?? 0,
            node.position?.z ?? 0,
        );
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(index, this.dummy.matrix);

        // Update color
        const hoveredId = this.state.interaction.hoveredElementId;
        const selectedIds = this.state.interaction.selectedElementIds;
        let color = new THREE.Color(node.color || '#ffffff');

        if (hoveredId === node.id) {
            const hoverStyle = this.state.style['node:hover']?.color;
            color = new THREE.Color(hoverStyle || '#ffff00');
        }
        if (selectedIds.includes(node.id)) {
            const selectedStyle = this.state.style['node:selected']?.color;
            color = new THREE.Color(selectedStyle || '#00ff00');
        }
        this.instancedMesh.setColorAt(index, color);
    }

    public getNodeId(instanceId: number): string | undefined {
        return this.indexToId.get(instanceId);
    }

    public dispose() {
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as THREE.Material).dispose();
        this.scene.remove(this.instancedMesh);
        // @ts-ignore
        if (this.instancedMesh.geometry.boundsTree) {
            // @ts-ignore
            this.instancedMesh.geometry.disposeBoundsTree();
        }
    }
}
