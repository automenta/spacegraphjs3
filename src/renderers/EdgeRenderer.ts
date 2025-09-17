import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { GraphElement, Edge, Spec } from './types';

export class EdgeRenderer {
  private scene: THREE.Scene;
  private state: Store<Spec>;
  public lineSegments: THREE.LineSegments;
  private material: THREE.LineBasicMaterial;
  private geometry: THREE.BufferGeometry;
  private disposeEffect?: () => void;

  constructor(scene: THREE.Scene, state: Store<Spec>) {
    this.scene = scene;
    this.state = state;

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    });
    this.geometry = new THREE.BufferGeometry();

    this.lineSegments = new THREE.LineSegments(this.geometry, this.material);
    this.scene.add(this.lineSegments);

    createEffect(() => {
      this.updateEdges();
    });
  }

  public updateEdges(
    nodes: GraphElement[] = this.state.data.nodes,
    edges: Edge[] = this.state.data.edges,
  ) {
    if (!nodes || !edges || !this.lineSegments) {
      this.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([], 3),
      );
      this.geometry.attributes.position.needsUpdate = true;
      return;
    }

    const nodeMap = new Map(nodes.map((node: GraphElement) => [node.id, node]));
    const vertices: number[] = [];
    const colors: number[] = [];

    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (
        sourceNode &&
        targetNode &&
        sourceNode.position &&
        targetNode.position
      ) {
        vertices.push(
          sourceNode.position.x,
          sourceNode.position.y,
          sourceNode.position.z,
        );
        vertices.push(
          targetNode.position.x,
          targetNode.position.y,
          targetNode.position.z,
        );

        const color = new THREE.Color(edge.color || '#aaaaaa');
        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
      }
    }

    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    this.geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3),
    );

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  public dispose() {
    if (this.lineSegments) {
      this.scene.remove(this.lineSegments);
    }
    this.geometry.dispose();
    this.material.dispose();
  }
}
