// src/ElementActor.ts
import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { Element } from './types';

export class ElementActor {
  public mesh!: THREE.Mesh; // Definite assignment assertion
  public state: Element; // Changed to public
  private globalState: any; // Store global state

  constructor(state: Element, globalState: any) { // Accept globalState
    this.state = state;
    this.globalState = globalState; // Store global state
    this.initMesh();

    // Reactive updates
    createEffect(() => {
      const isHovered = this.globalState.interaction.hoveredElementId === this.state.id;
      const isSelected = this.globalState.interaction.selectedElementIds.includes(this.state.id);

      let color = this.state.color || '#ffffff'; // Default color

      // Apply hover style
      if (isHovered) {
        const hoverStyle = this.globalState.style['node:hover']?.color;
        if (hoverStyle) {
          color = hoverStyle;
        } else {
          // Default hover effect if no style is defined
          color = '#ffff00'; // Yellow for hover
        }
      }

      // Apply selected style (overrides hover if both are true)
      if (isSelected) {
        const selectedStyle = this.globalState.style['node:selected']?.color;
        if (selectedStyle) {
          color = selectedStyle;
        } else {
          // Default selected effect if no style is defined
          color = '#00ff00'; // Green for selected
        }
      }

      (this.mesh.material as THREE.MeshBasicMaterial).color.set(color);
    });
  }

  private initMesh() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: this.state.color || '#ffffff' });
    this.mesh = new THREE.Mesh(geometry, material);
  }

  public dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose(); // Type assertion for dispose
  }
}
