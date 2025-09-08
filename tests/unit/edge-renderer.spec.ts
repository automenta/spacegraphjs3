import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { createState } from '../../src/createState';
import { EdgeRenderer } from '../../src/EdgeRenderer';
import { Spec } from '../../src/types';

describe('EdgeRenderer', () => {
  let scene: THREE.Scene;
  let state: ReturnType<typeof createState>['state'];
  let updateState: ReturnType<typeof createState>['updateState'];
  let edgeRenderer: EdgeRenderer;
  let dispose: () => void;

  beforeEach(() => {
    scene = new THREE.Scene();
    createRoot((_dispose) => {
      const { state: s, updateState: u } = createState({
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
      state = s;
      updateState = u;
      edgeRenderer = new EdgeRenderer(scene, state);
      dispose = _dispose;
    });
  });

  it('should create line segment geometry based on state', async () => {
    await Promise.resolve(); // allow effects to run
    const geometry = edgeRenderer.lineSegments.geometry;
    const positionAttribute = geometry.getAttribute('position');

    expect(positionAttribute).toBeDefined();
    expect(positionAttribute.count).toBe(4);

    const positions = positionAttribute.array;
    // Edge 1: n1 -> n2
    expect(positions.slice(0, 6)).toEqual(new Float32Array([0, 0, 0, 10, 0, 0]));
    // Edge 2: n1 -> n3
    expect(positions.slice(6, 12)).toEqual(new Float32Array([0, 0, 0, 0, 10, 0]));
    dispose();
  });

  it('should apply colors to edges based on state', async () => {
    updateState({
      data: {
        edges: [
          { id: 'e1', color: '#ff0000' }, // Red
          { id: 'e2', color: '#00ff00' }, // Green
        ],
      },
    });
    await Promise.resolve(); // allow effects to run

    const geometry = edgeRenderer.lineSegments.geometry;
    const colorAttribute = geometry.getAttribute('color');
    expect(colorAttribute).toBeDefined();

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
    dispose();
  });
});
