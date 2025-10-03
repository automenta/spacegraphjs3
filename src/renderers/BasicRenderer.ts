/**
 * @file This file contains the BasicRenderer, which is a simplified renderer
 * that creates individual Three.js objects for each node, as an alternative
 * to the high-performance InstancedRenderer.
 */

import * as THREE from 'three';
import { createEffect, on } from 'solid-js';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec } from '../types';
import { IRenderer } from './IRenderer';
import { parseColor } from '../utils/colorUtils';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export class BasicRenderer implements IRenderer {
  public nodeObjects: Map<string, THREE.Object3D> = new Map();
  private scene: THREE.Scene;
  private state: Store<Spec>;
  private css3DScene: THREE.Scene | null = null;
  private dummy = new THREE.Object3D();

  constructor(
    scene: THREE.Scene,
    state: Store<Spec>,
    css3DScene?: THREE.Scene
  ) {
    this.scene = scene;
    this.state = state;
    this.css3DScene = css3DScene || null;

    this.init();
  }

  public updateAllNodes() {
    const nodes = this.state.data?.nodes || [];
    const currentNodeIds = new Set(nodes.map((n) => n.id));

    // Add new objects for new nodes
    nodes.forEach((node) => {
      if (!this.nodeObjects.has(node.id)) {
        this.addNodeObject(node);
      }
    });

    // Remove objects for nodes that no longer exist
    for (const nodeId of this.nodeObjects.keys()) {
      if (!currentNodeIds.has(nodeId)) {
        this.removeNodeObject(nodeId);
      }
    }

    // Update positions and colors of all nodes
    nodes.forEach((node) => {
      this.updateNodeObject(node);
    });
  }

  // --- IRenderer Implementation ---
  public getRaycastableObjects(): THREE.Object3D[] {
    return Array.from(this.nodeObjects.values()).filter((obj) => {
      // Filter out CSS3D objects from raycasting as they're handled separately
      return !(obj instanceof CSS3DObject);
    });
  }

  public getNodeIdFromIntersection(
    intersection: THREE.Intersection
  ): string | null {
    // Retrieve the nodeId stored in the object's userData.
    return intersection.object.userData.nodeId ?? null;
  }

  public dispose() {
    // Remove all node objects from the scene
    for (const nodeId of this.nodeObjects.keys()) {
      this.removeNodeObject(nodeId);
    }
    this.nodeObjects.clear();
  }

  private init() {
    // Effect for updating all nodes when nodes change
    createEffect(() => this.updateAllNodes());

    // Effect for updating nodes on interaction changes (hover, select)
    createEffect(
      on(
        () => [
          this.state.interaction.hoveredElementId,
          this.state.interaction.selectedElementIds,
        ],
        () => {
          // Update all nodes when interaction state changes
          const nodes = this.state.data?.nodes || [];
          nodes.forEach((node) => {
            this.updateNodeObject(node);
          });
        },
        { defer: false }
      )
    );
  }

  private addNodeObject(node: NodeSpec) {
    let object: THREE.Object3D;

    // Create appropriate object based on node type
    switch (node.type) {
      case 'box': {
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const boxMaterial = new THREE.MeshBasicMaterial({
          color: parseColor(node.color, node.id),
        });
        object = new THREE.Mesh(boxGeometry, boxMaterial);
        break;
      }

      case 'text': {
        // For text nodes, create a more visible representation
        const textGeometry = new THREE.BoxGeometry(2, 0.8, 0.2);
        const textMaterial = new THREE.MeshBasicMaterial({
          color: parseColor(node.color, node.id),
        });
        object = new THREE.Mesh(textGeometry, textMaterial);
        break;
      }

      case 'custom': {
        const customGeometry = new THREE.IcosahedronGeometry(0.7, 0);
        const customMaterial = new THREE.MeshBasicMaterial({
          color: parseColor(node.color, node.id),
        });
        object = new THREE.Mesh(customGeometry, customMaterial);
        break;
      }

      case 'html': {
        // For HTML nodes, create a CSS3D object if css3DScene is available
        if (this.css3DScene) {
          const element = document.createElement('div');
          element.style.width = '200px';
          element.style.height = '100px';
          element.style.backgroundColor =
            '#' + parseColor(node.color, node.id).getHexString();
          element.style.border = '2px solid white';
          element.style.borderRadius = '8px';
          element.style.padding = '10px';
          element.style.boxSizing = 'border-box';
          element.style.fontFamily = 'Arial, sans-serif';
          element.style.fontSize = '14px';
          element.style.color = 'white';
          element.style.overflow = 'hidden';
          element.style.textAlign = 'center';
          element.style.display = 'flex';
          element.style.flexDirection = 'column';
          element.style.justifyContent = 'center';
          element.style.alignItems = 'center';
          element.innerHTML = `<div>HTML Node<br/>${node.id}</div>`;

          object = new CSS3DObject(element);
          // Add to CSS3D scene instead of regular scene
          this.css3DScene.add(object);
        } else {
          // Fallback to a simple plane if no CSS3D scene
          const htmlGeometry = new THREE.PlaneGeometry(2, 1);
          const htmlMaterial = new THREE.MeshBasicMaterial({
            color: parseColor(node.color, node.id),
            side: THREE.DoubleSide,
          });
          object = new THREE.Mesh(htmlGeometry, htmlMaterial);
        }
        break;
      }

      case 'sphere':
      default: {
        const sphereGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: parseColor(node.color, node.id),
        });
        object = new THREE.Mesh(sphereGeometry, sphereMaterial);
        break;
      }
    }

    object.userData.nodeId = node.id;

    // Set position
    object.position.set(
      node.position?.x ?? 0,
      node.position?.y ?? 0,
      node.position?.z ?? 0
    );

    // Add to regular scene if not already added to CSS3D scene
    if (!(object instanceof CSS3DObject) || !this.css3DScene) {
      this.scene.add(object);
    }

    this.nodeObjects.set(node.id, object);
  }

  private removeNodeObject(nodeId: string) {
    const object = this.nodeObjects.get(nodeId);
    if (object) {
      // Remove from appropriate scene
      if (object instanceof CSS3DObject && this.css3DScene) {
        this.css3DScene.remove(object);
      } else {
        this.scene.remove(object);
      }

      // Dispose of geometry and material to prevent memory leaks
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          (object.material as THREE.Material).dispose();
        }
      }

      this.nodeObjects.delete(nodeId);
    }
  }

  private updateNodeObject(node: NodeSpec) {
    const object = this.nodeObjects.get(node.id);
    if (!object) return;

    // Update position
    object.position.set(
      node.position?.x ?? 0,
      node.position?.y ?? 0,
      node.position?.z ?? 0
    );

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

    // Apply color updates for different object types
    if (
      object instanceof THREE.Mesh &&
      object.material instanceof THREE.MeshBasicMaterial
    ) {
      try {
        object.material.color = new THREE.Color(
          parseColor(finalColor, node.id)
        );
      } catch (error) {
        console.warn(
          `Invalid color specified for node ${node.id}:`,
          finalColor,
          error
        );
        object.material.color = new THREE.Color('#ff00ff'); // Fallback to magenta
      }
    } else if (object instanceof CSS3DObject && object.element) {
      // For CSS3D objects, update the background color of the element
      try {
        const colorString =
          '#' + parseColor(finalColor, node.id).getHexString();
        object.element.style.backgroundColor = colorString;
      } catch (error) {
        console.warn(
          `Invalid color specified for HTML node ${node.id}:`,
          finalColor,
          error
        );
        object.element.style.backgroundColor = '#ff00ff'; // Fallback to magenta
      }
    }
  }
}
