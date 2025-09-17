import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { InstancedRenderer } from '../../src/renderers/InstancedRenderer';
import { createState } from '../../src/core/createState';

const createMockState = () => {
  return createState({
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
};

describe('InstancedRenderer Styling', () => {
  it('should apply default, hover, and selected styles correctly', async () => {
    const scene = new THREE.Scene();
    const { state, updateState } = createMockState();
    const renderer = new InstancedRenderer(scene, state);

    // Initial state check
    await new Promise((r) => setTimeout(r, 0));
    const sphereMesh = renderer.instancedMeshes.get('sphere')!;
    const defaultColorN1 = new THREE.Color();
    sphereMesh.getColorAt(0, defaultColorN1);
    expect(defaultColorN1.getHexString()).toBe('ff0000');

    // Test hover
    updateState({ interaction: { hoveredElementId: 'n1' } });
    await new Promise((r) => setTimeout(r, 0));
    const hoverColorN1 = new THREE.Color();
    sphereMesh.getColorAt(0, hoverColorN1);
    expect(hoverColorN1.getHexString()).toBe('0000ff');

    // Test selection (should override hover)
    updateState({ interaction: { selectedElementIds: ['n1'] } });
    await new Promise((r) => setTimeout(r, 0));
    const selectedColorN1 = new THREE.Color();
    sphereMesh.getColorAt(0, selectedColorN1);
    expect(selectedColorN1.getHexString()).toBe('ffff00');

    // Test un-hovering a selected node (should remain selected color)
    updateState({ interaction: { hoveredElementId: null } });
    await new Promise((r) => setTimeout(r, 0));
    const unhoverSelectedColorN1 = new THREE.Color();
    sphereMesh.getColorAt(0, unhoverSelectedColorN1);
    expect(unhoverSelectedColorN1.getHexString()).toBe('ffff00');

    // Test un-selecting (should go back to default color)
    updateState({ interaction: { selectedElementIds: [] } });
    await new Promise((r) => setTimeout(r, 0));
    const finalColorN1 = new THREE.Color();
    sphereMesh.getColorAt(0, finalColorN1);
    expect(finalColorN1.getHexString()).toBe('ff0000');
  });
});
