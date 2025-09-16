/**
 * @file This file contains the InstancedRenderer, which is a high-performance renderer
 * that uses THREE.InstancedMesh to draw a large number of nodes.
 *
 * @note This renderer is currently a work-in-progress and is not used by default.
 * It needs to be updated to implement the IRenderer interface before it can be
 * integrated into the SpaceGraph architecture.
 */

import * as THREE from 'three';
import { createEffect, on, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { Spec, GraphElement } from './types';
import { IRenderer } from './IRenderer';

const MAX_INSTANCES = 100000;

export class InstancedRenderer implements IRenderer {
  private static registeredGeometries: Map<string, THREE.BufferGeometry> = new Map();

  private scene: THREE.Scene;
  private state: Store<Spec>;
  public instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private typeToIdMaps: Map<
    string,
    { idToIndex: Map<string, number>; indexToId: Map<number, string> }
  > = new Map();
  private dummy = new THREE.Object3D();
  private _dispose: () => void;

  public static registerInstancedType(
    typeName: string,
    geometry: THREE.BufferGeometry
  ) {
    InstancedRenderer.registeredGeometries.set(typeName, geometry);
  }

  constructor(scene: THREE.Scene, state: Store<Spec>) {
    this.scene = scene;
    this.state = state;

    this._dispose = createRoot((dispose) => {
      this.init();
      return dispose;
    });
  }

  private init() {
    // Register a default sphere geometry if no types are registered
    if (InstancedRenderer.registeredGeometries.size === 0) {
      InstancedRenderer.registerInstancedType(
        'sphere',
        new THREE.SphereGeometry(0.5, 16, 16)
      );
    }

    // Create InstancedMesh for each registered geometry type
    for (const [
      typeName,
      geometry,
    ] of InstancedRenderer.registeredGeometries.entries()) {
      geometry.computeBoundsTree();
      const material = new THREE.MeshBasicMaterial({ vertexColors: true });
      const mesh = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(MAX_INSTANCES * 3),
        3
      );
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
      mesh.userData.typeName = typeName; // Store typeName for raycasting
      this.scene.add(mesh);
      this.instancedMeshes.set(typeName, mesh);
      this.typeToIdMaps.set(typeName, {
        idToIndex: new Map(),
        indexToId: new Map(),
      });
    }

    // Effect for updating all instances when nodes change
    createEffect(() => {
      const nodes = this.state.data?.nodes || [];
      const nodesByType = new Map<string, GraphElement[]>();

      // Group nodes by their type
      for (const node of nodes) {
        if (!nodesByType.has(node.type)) {
          nodesByType.set(node.type, []);
        }
        nodesByType.get(node.type)!.push(node);
      }

      // Update each InstancedMesh
      for (const [typeName, mesh] of this.instancedMeshes.entries()) {
        const typedNodes = nodesByType.get(typeName) || [];
        const idMaps = this.typeToIdMaps.get(typeName)!;

        idMaps.idToIndex.clear();
        idMaps.indexToId.clear();

        typedNodes.forEach((node, i) => {
          idMaps.idToIndex.set(node.id, i);
          idMaps.indexToId.set(i, node.id);
          this.updateInstance(mesh, idMaps, i, node);
        });

        mesh.count = typedNodes.length;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    });

    // Effect for updating instances on interaction changes (hover, select)
    createEffect(
      on(
        () => [
          this.state.interaction.hoveredElementId,
          this.state.interaction.selectedElementIds,
        ],
        () => {
          // This is a simplified update, re-coloring all instances of affected meshes
          // A more optimized version would track changes more granularly
          for (const [typeName, mesh] of this.instancedMeshes.entries()) {
            const nodes =
              this.state.data?.nodes?.filter((n) => n.type === typeName) || [];
            const idMaps = this.typeToIdMaps.get(typeName)!;
            nodes.forEach((node) => {
              const index = idMaps.idToIndex.get(node.id);
              if (index !== undefined) {
                this.updateInstance(mesh, idMaps, index, node);
              }
            });
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
          }
        },
        { defer: true }
      )
    );
  }

  private updateInstance(
    mesh: THREE.InstancedMesh,
    idMaps: { idToIndex: Map<string, number>; indexToId: Map<number, string> },
    index: number,
    node: GraphElement
  ) {
    // Update matrix for position
    this.dummy.position.set(
      node.position?.x ?? 0,
      node.position?.y ?? 0,
      node.position?.z ?? 0
    );
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index, this.dummy.matrix);

    // Update color based on state
    const { hoveredElementId, selectedElementIds } = this.state.interaction;
    let finalColor: string | number = node.color || '#ffffff';
    const isSelected = selectedElementIds.includes(node.id);
    const isHovered = hoveredElementId === node.id;

    if (isSelected && this.state.style['node:selected']?.color) {
      finalColor = this.state.style['node:selected'].color;
    } else if (isHovered && this.state.style['node:hover']?.color) {
      finalColor = this.state.style['node:hover'].color;
    }

    mesh.setColorAt(index, new THREE.Color(finalColor));
  }

  // --- IRenderer Implementation ---
  public getRaycastableObjects(): THREE.Object3D[] {
    return Array.from(this.instancedMeshes.values());
  }

  public getNodeIdFromIntersection(
    intersection: THREE.Intersection
  ): string | null {
    if (intersection.instanceId === undefined) return null;

    const mesh = intersection.object as THREE.InstancedMesh;
    const typeName = mesh.userData.typeName;
    if (!typeName) return null;

    const idMaps = this.typeToIdMaps.get(typeName);
    if (!idMaps) return null;

    return idMaps.indexToId.get(intersection.instanceId) ?? null;
  }

  public dispose() {
    this._dispose(); // Dispose of the SolidJS root and all its effects
    for (const mesh of this.instancedMeshes.values()) {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        (mesh.material as THREE.Material).dispose();
      }
      this.scene.remove(mesh);
      if ((mesh.geometry as any)?.boundsTree) {
        (mesh.geometry as any).disposeBoundsTree();
      }
    }
    this.instancedMeshes.clear();
    this.typeToIdMaps.clear();
  }
}
