import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createStore, Store } from 'solid-js/store';
import { Spec } from '../../src/types';
import { InstancedRenderer } from '../../src/InstancedRenderer';

const createMockState = (): Store<Spec> => {
  const [state] = createStore<Spec>({
    data: {
      nodes: [
        { id: 'n1', type: 'sphere', color: '#ff0000' }, // Red
        { id: 'n2', type: 'sphere', color: '#00ff00' }, // Green
      ],
      edges: [],
    },
    interaction: {
      hoveredElementId: null,
      selectedElementIds: [],
    },
    style: {
      'node:hover': { color: '#0000ff' }, // Blue
      'node:selected': { color: '#ffff00' }, // Yellow
    },
    layout: { type: 'force-directed' },
    camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
  });
  return state;
};

describe.skip('InstancedRenderer Styling', () => {
  it('should apply default, hover, and selected styles correctly', () => {
    const scene = new THREE.Scene();
    const state = createMockState();
    const renderer = new InstancedRenderer(scene, state);

    // Manually run the mapping and update to initialize nodes and colors
    renderer.updateNodeMappings();

    const defaultColorN1 = new THREE.Color();
    const defaultColorN2 = new THREE.Color();
    renderer.instancedMesh.getColorAt(0, defaultColorN1);
    renderer.instancedMesh.getColorAt(1, defaultColorN2);

    expect(defaultColorN1.getHexString()).toBe('ff0000');
    expect(defaultColorN2.getHexString()).toBe('00ff00');

    // Test hover
    state.interaction.hoveredElementId = 'n1';
    renderer.updateInstance(0, state.data.nodes[0]);
    const hoverColorN1 = new THREE.Color();
    renderer.instancedMesh.getColorAt(0, hoverColorN1);
    expect(hoverColorN1.getHexString()).toBe('0000ff');

    // Test selection (should override hover)
    state.interaction.selectedElementIds.push('n1');
    renderer.updateInstance(0, state.data.nodes[0]);
    const selectedColorN1 = new THREE.Color();
    renderer.instancedMesh.getColorAt(0, selectedColorN1);
    expect(selectedColorN1.getHexString()).toBe('ffff00');

    // Test un-hovering a selected node (should remain selected color)
    state.interaction.hoveredElementId = null;
    renderer.updateInstance(0, state.data.nodes[0]);
    const unhoverSelectedColorN1 = new THREE.Color();
    renderer.instancedMesh.getColorAt(0, unhoverSelectedColorN1);
    expect(unhoverSelectedColorN1.getHexString()).toBe('ffff00');

    // Test un-selecting (should go back to default color)
    state.interaction.selectedElementIds = [];
    renderer.updateInstance(0, state.data.nodes[0]);
    const finalColorN1 = new THREE.Color();
    renderer.instancedMesh.getColorAt(0, finalColorN1);
    expect(finalColorN1.getHexString()).toBe('ff0000');
  });
});
