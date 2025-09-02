import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createStore, Store } from 'solid-js/store';
import { Spec } from '../../src/types';
import { EdgeRenderer } from '../../src/EdgeRenderer';

const createMockState = (): Store<Spec> => {
  const [state] = createStore<Spec>({
    data: {
      nodes: [
        { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
        { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
        { id: 'n3', type: 'sphere', position: { x: 0, y: 10, z: 0 } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n1', target: 'n3' },
      ],
    },
  });
  return state;
};

describe('EdgeRenderer', () => {
  it('should create and update line segment geometry based on state', () => {
    const scene = new THREE.Scene();
    const state = createMockState();

    const edgeRenderer = new EdgeRenderer(scene, state);
    edgeRenderer.updateEdges(); // Manually trigger the update

    const geometry = edgeRenderer.lineSegments.geometry;
    const positionAttribute = geometry.getAttribute('position');

    expect(positionAttribute).toBeDefined();
    expect(positionAttribute.count).toBe(4);

    const positions = positionAttribute.array;

    // Edge 1: n1 -> n2
    expect(positions[0]).toBe(0);
    expect(positions[1]).toBe(0);
    expect(positions[2]).toBe(0);
    expect(positions[3]).toBe(10);
    expect(positions[4]).toBe(0);
    expect(positions[5]).toBe(0);

    // Edge 2: n1 -> n3
    expect(positions[6]).toBe(0);
    expect(positions[7]).toBe(0);
    expect(positions[8]).toBe(0);
    expect(positions[9]).toBe(0);
    expect(positions[10]).toBe(10);
    expect(positions[11]).toBe(0);
  });

  it('should apply colors to edges based on state', () => {
    const scene = new THREE.Scene();
    const state = createMockState();
    // Add colors to the mock edges
    state.data.edges[0].color = '#ff0000'; // Red
    state.data.edges[1].color = '#00ff00'; // Green

    const edgeRenderer = new EdgeRenderer(scene, state);
    edgeRenderer.updateEdges();

    const geometry = edgeRenderer.lineSegments.geometry;
    const colorAttribute = geometry.getAttribute('color');

    expect(colorAttribute).toBeDefined();
    expect(colorAttribute.count).toBe(4);

    const color = new THREE.Color();

    // Edge 1 should be red
    color.fromBufferAttribute(colorAttribute, 0);
    expect(color.getHexString()).toBe('ff0000');
    color.fromBufferAttribute(colorAttribute, 1);
    expect(color.getHexString()).toBe('ff0000');

    // Edge 2 should be green
    color.fromBufferAttribute(colorAttribute, 2);
    expect(color.getHexString()).toBe('00ff00');
    color.fromBufferAttribute(colorAttribute, 3);
    expect(color.getHexString()).toBe('00ff00');
  });
});
