import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Spec } from '../../src/types';
import { createTestGraph, nextTick } from './test-utils';
import { EdgeRenderer } from '../../src/renderers/EdgeRenderer';

describe('EdgeRenderer', () => {
  it('should create line segment geometry based on state', async () => {
    const spec: Spec = {
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
    } as any;
    const { graph, cleanup } = createTestGraph(spec);
    const edgeRenderer = graph.renderingManager['edgeRenderer'] as EdgeRenderer;

    await nextTick();

    const geometry = edgeRenderer.lineSegments.geometry;
    const positionAttribute = geometry.getAttribute('position');
    expect(positionAttribute).toBeDefined();
    expect(positionAttribute.count).toBe(4);

    const positions = positionAttribute.array;
    expect(positions.slice(0, 6)).toEqual(
      new Float32Array([0, 0, 0, 10, 0, 0])
    );
    expect(positions.slice(6, 12)).toEqual(
      new Float32Array([0, 0, 0, 0, 10, 0])
    );

    cleanup();
  });

  it('should apply colors to edges based on state', async () => {
    const spec: Spec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2', color: '#ff0000' }],
      },
    } as any;
    const { graph, cleanup } = createTestGraph(spec);
    const edgeRenderer = graph.renderingManager['edgeRenderer'] as EdgeRenderer;

    await nextTick();

    let geometry = edgeRenderer.lineSegments.geometry;
    let colorAttribute = geometry.getAttribute('color');
    expect(colorAttribute).toBeDefined();
    const color = new THREE.Color();
    color.fromBufferAttribute(colorAttribute, 0);
    expect(color.getHexString()).toBe('ff0000');

    graph.update({
      data: { edges: { update: [{ id: 'e1', color: '#00ff00' }] } },
    });

    await nextTick();

    geometry = edgeRenderer.lineSegments.geometry;
    colorAttribute = geometry.getAttribute('color');
    color.fromBufferAttribute(colorAttribute, 0);
    expect(color.getHexString()).toBe('00ff00');

    cleanup();
  });
});
