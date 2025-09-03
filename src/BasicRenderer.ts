import * as THREE from 'three';
import { createEffect, on } from 'solid-js';
import { Store } from 'solid-js/store';
import { Spec, Element } from './types';
import { IRenderer } from './IRenderer';

/**
 * A basic renderer that creates an individual THREE.Mesh for each node.
 * This renderer is suitable for small graphs where the overhead of instancing is not necessary.
 */
export class BasicRenderer implements IRenderer {
  private scene: THREE.Scene;
  private state: Store<Spec>;
  private nodeMeshes: Map<string, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene, state: Store<Spec>) {
    this.scene = scene;
    this.state = state;

    this.init();
  }

  private init() {
    // This effect synchronizes the meshes with the nodes in the state.
    createEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.state.data?.nodes; // depend on nodes for reactivity
      const nodes = this.state.data?.nodes || [];
      const currentNodeIds = new Set(nodes.map((n) => n.id));

      // Add new meshes for new nodes.
      for (const node of nodes) {
        if (!this.nodeMeshes.has(node.id)) {
          this.addNodeMesh(node);
        }
      }

      // Remove meshes for nodes that no longer exist.
      for (const nodeId of this.nodeMeshes.keys()) {
        if (!currentNodeIds.has(nodeId)) {
          this.removeNodeMesh(nodeId);
        }
      }
    });

    // This effect updates individual mesh properties when node data changes.
    createEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.state.data?.nodes; // depend on nodes for reactivity
      this.state.data?.nodes.forEach((node) => {
        const mesh = this.nodeMeshes.get(node.id);
        if (mesh) {
          this.updateNodeMesh(mesh, node);
        }
      });
    });

    // This effect updates styles based on interaction state (hover/select).
    createEffect(
      on(
        () => [
          this.state.interaction.hoveredElementId,
          [...this.state.interaction.selectedElementIds],
        ],
        () => {
          // This is an unoptimized approach that re-evaluates all nodes.
          // For a small number of nodes, this is acceptable.
          this.state.data?.nodes.forEach((node) => {
            const mesh = this.nodeMeshes.get(node.id);
            if (mesh) {
              this.updateNodeMesh(mesh, node);
            }
          });
        },
        { defer: true }
      )
    );
  }

  private addNodeMesh(node: Element) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    geometry.computeBoundsTree();
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.nodeId = node.id; // Store ID for raycasting
    this.nodeMeshes.set(node.id, mesh);
    this.scene.add(mesh);
    this.updateNodeMesh(mesh, node); // Set initial properties
  }

  private removeNodeMesh(nodeId: string) {
    const mesh = this.nodeMeshes.get(nodeId);
    if (mesh) {
      if (mesh.geometry.disposeBoundsTree) {
        mesh.geometry.disposeBoundsTree();
      }
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.scene.remove(mesh);
      this.nodeMeshes.delete(nodeId);
    }
  }

  private updateNodeMesh(mesh: THREE.Mesh, node: Element) {
    // Update position
    mesh.position.set(
      node.position?.x ?? 0,
      node.position?.y ?? 0,
      node.position?.z ?? 0
    );

    // Update color based on state (default, hover, select)
    const hoveredId = this.state.interaction.hoveredElementId;
    const selectedIds = this.state.interaction.selectedElementIds;
    let finalColor = node.color || '#ffffff'; // Default color

    const isSelected = selectedIds.includes(node.id);
    const isHovered = hoveredId === node.id;

    // Apply styles with precedence: selected > hover > default
    if (isSelected) {
      finalColor = this.state.style?.['node:selected']?.color || finalColor;
    } else if (isHovered) {
      finalColor = this.state.style?.['node:hover']?.color || finalColor;
    }

    (mesh.material as THREE.MeshBasicMaterial).color.set(finalColor);
  }

  // --- IRenderer Implementation ---

  public getRaycastableObjects(): THREE.Object3D[] {
    return Array.from(this.nodeMeshes.values());
  }

  public getNodeIdFromIntersection(
    intersection: THREE.Intersection
  ): string | null {
    // Retrieve the nodeId stored in the mesh's userData.
    return intersection.object.userData.nodeId ?? null;
  }

  public dispose(): void {
    // Create a copy of the keys to avoid issues with modifying the map while iterating.
    const nodeIds = Array.from(this.nodeMeshes.keys());
    for (const nodeId of nodeIds) {
      this.removeNodeMesh(nodeId);
    }
  }
}
