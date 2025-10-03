import * as THREE from 'three';
import { NodeSpec, Spec } from '../types';
import { parseColor } from './colorUtils';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

/**
 * Utility functions for handling node colors across different renderers
 */
export class NodeColorUtils {
  /**
   * Get the final color for a node based on its state and style
   */
  static getNodeColor(node: NodeSpec, state: Spec): string | number {
    const { hoveredElementId, selectedElementIds } = state.interaction;
    let finalColor: string | number = node.color || '#ffffff';
    const isSelected = selectedElementIds.includes(node.id);
    const isHovered = hoveredElementId === node.id;

    if (isSelected && state.style['node:selected']?.color) {
      finalColor = state.style['node:selected'].color;
    } else if (isHovered && state.style['node:hover']?.color) {
      finalColor = state.style['node:hover'].color;
    }

    return finalColor;
  }

  /**
   * Apply color to a Three.js mesh with error handling
   */
  static applyColorToMesh(
    mesh: THREE.Mesh,
    color: string | number,
    nodeId: string
  ): void {
    if (!(mesh.material instanceof THREE.MeshBasicMaterial)) {
      return;
    }

    try {
      mesh.material.color = new THREE.Color(parseColor(color, nodeId));
    } catch (error) {
      console.warn(
        `Invalid color specified for node ${nodeId}:`,
        color,
        error
      );
      mesh.material.color = new THREE.Color('#ff00ff'); // Fallback to magenta
    }
  }

  /**
   * Apply color to a CSS3D object with error handling
   */
  static applyColorToCSS3DObject(
    css3dObject: CSS3DObject,
    color: string | number,
    nodeId: string
  ): void {
    if (!css3dObject.element) {
      return;
    }

    try {
      const colorString = '#' + parseColor(color, nodeId).getHexString();
      css3dObject.element.style.backgroundColor = colorString;
    } catch (error) {
      console.warn(
        `Invalid color specified for HTML node ${nodeId}:`,
        color,
        error
      );
      css3dObject.element.style.backgroundColor = '#ff00ff'; // Fallback to magenta
    }
  }

  /**
   * Update the color of any object (mesh or CSS3D)
   */
  static updateObjectColor(
    object: THREE.Object3D,
    node: NodeSpec,
    state: Spec
  ): void {
    const finalColor = this.getNodeColor(node, state);

    if (object instanceof THREE.Mesh) {
      this.applyColorToMesh(object, finalColor, node.id);
    } else if (object instanceof CSS3DObject) {
      this.applyColorToCSS3DObject(object, finalColor, node.id);
    }
  }
}