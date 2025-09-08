/**
 * @file This file contains the InstancedRenderer, which is a high-performance renderer
 * that uses THREE.InstancedMesh to draw a large number of nodes.
 *
 * @note This renderer is currently a work-in-progress and is not used by default.
 * It needs to be updated to implement the IRenderer interface before it can be
 * integrated into the SpaceGraph architecture.
 */

import * as THREE from 'three';
import { createEffect, on } from 'solid-js';
import { Store } from 'solid-js/store';
import { Spec, Element } from './types';

const MAX_INSTANCES = 100000;

export class InstancedRenderer {
  private scene: THREE.Scene;
  private state: Store<Spec>;
  public instancedMesh!: THREE.InstancedMesh;
  private idToIndex: Map<string, number> = new Map();
  private indexToId: Map<number, string> = new Map();
  private dummy = new THREE.Object3D();

  constructor(scene: THREE.Scene, state: Store<Spec>) {
    this.scene = scene;
    this.state = state;

    this.init();
  }

  /**
   * Initialize the instanced mesh and set up the effects to update it.
   */
  private init() {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    (geometry as any).computeBoundsTree();
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      MAX_INSTANCES
    );
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_INSTANCES * 3),
      3
    );
    this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.instancedMesh);

    createEffect(() => {
      this.updateNodeMappings();
    });

    createEffect(() => {
      this.state.data?.nodes?.forEach((node) => {
        const index = this.idToIndex.get(node.id);
        if (index !== undefined) {
          this.updateInstance(index, node);
        }
      });
      if (this.instancedMesh.instanceMatrix) {
        this.instancedMesh.instanceMatrix.needsUpdate = true;
      }
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    });

    createEffect(
        // @ts-ignore
      on(
        () => [
          this.state.interaction.hoveredElementId,
          [...this.state.interaction.selectedElementIds],
        ],
        ([next, prev]) => {
          const [nextHovered, nextSelected] = next;
          const prevHovered = prev ? prev[0] : null;
          const prevSelected = prev ? prev[1] : [];

          const changedIds = new Set<string>();

          if (nextHovered !== prevHovered) {
            if (prevHovered) changedIds.add(prevHovered);
            if (nextHovered) changedIds.add(nextHovered);
          }

          const allSelected = new Set([...prevSelected, ...nextSelected]);
          for (const id of allSelected) {
            const wasSelected = prevSelected.includes(id);
            const isSelected = nextSelected.includes(id);
            if (wasSelected !== isSelected) {
              changedIds.add(id);
            }
          }

          for (const id of changedIds) {
            const index = this.idToIndex.get(id);
            const node = this.state.data?.nodes?.find((n) => n.id === id);
            if (index !== undefined && node) {
              this.updateInstance(index, node);
            }
          }
          if (this.instancedMesh.instanceMatrix) {
            this.instancedMesh.instanceMatrix.needsUpdate = true;
          }
          if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
          }
        },
        { defer: true }
      )
    );
  }

  public updateNodeMappings() {
    const nodes = this.state.data?.nodes || [];

    this.idToIndex.clear();
    this.indexToId.clear();

    nodes.forEach((node, i) => {
      this.idToIndex.set(node.id, i);
      this.indexToId.set(i, node.id);
    });

    this.instancedMesh.count = nodes.length;
    this.updateAllInstances();
  }

  public updateAllInstances() {
    const nodes = this.state.data?.nodes || [];
    nodes.forEach((node) => {
      const index = this.idToIndex.get(node.id);
      if (index !== undefined) {
        this.updateInstance(index, node);
      }
    });
    if (this.instancedMesh.instanceMatrix) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public updateInstance(index: number, node: Element) {
    this.dummy.position.set(
      node.position?.x ?? 0,
      node.position?.y ?? 0,
      node.position?.z ?? 0
    );
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix);

    const hoveredId = this.state.interaction.hoveredElementId;
    const selectedIds = this.state.interaction.selectedElementIds;
    let finalColor: string | number = node.color || '#ffffff';

    const isSelected = selectedIds.includes(node.id);
    const isHovered = hoveredId === node.id;

    if (isSelected) {
      finalColor =
        this.state.style['node:selected']?.color || finalColor;
    } else if (isHovered) {
      finalColor = this.state.style['node:hover']?.color || finalColor;
    }

    this.instancedMesh.setColorAt(index, new THREE.Color(finalColor));
  }

  public getNodeId(instanceId: number): string | undefined {
    return this.indexToId.get(instanceId);
  }

  public dispose() {
    if (this.instancedMesh.geometry) {
      this.instancedMesh.geometry.dispose();
    }
    if(this.instancedMesh.material) {
        (this.instancedMesh.material as THREE.Material).dispose();
    }
    this.scene.remove(this.instancedMesh);
    if ((this.instancedMesh.geometry as any)?.boundsTree) {
      (this.instancedMesh.geometry as any).disposeBoundsTree();
    }
  }
}
