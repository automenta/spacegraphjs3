import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Spec } from '../../src/types';
import { createTestGraph, nextTick } from './test-utils';

describe('NodeRenderer and SphereElementActor', () => {
  it('should add and remove sphere nodes based on state changes', async () => {
    const spec: Spec = { data: { nodes: [], edges: [] } } as any;
    const { graph, cleanup } = createTestGraph(spec);

    expect(graph.scene.children.length).toBe(0);

    graph.update({ data: { nodes: { add: [{ id: 'n1', type: 'sphere' }] } } });
    await nextTick();
    expect(graph.scene.children.length).toBe(1);

    graph.update({
      data: {
        nodes: {
          add: [{ id: 'n2', type: 'sphere' }],
        },
      },
    });
    await nextTick();
    expect(graph.scene.children.length).toBe(2);

    graph.update({ data: { nodes: { remove: ['n1'] } } });
    await nextTick();
    expect(graph.scene.children.length).toBe(1);

    cleanup();
  });

  it('should reactively update node position and color', async () => {
    const spec: Spec = {
      data: {
        nodes: [
          {
            id: 'n1',
            type: 'sphere',
            position: { x: 0, y: 0, z: 0 },
            color: '#ff0000',
          },
        ],
        edges: [],
      },
    } as any;
    const { graph, cleanup } = createTestGraph(spec);

    await nextTick();

    let mesh = graph.scene.children.find(
      (c) => c.userData.nodeId === 'n1'
    ) as THREE.Mesh;
    expect(mesh).toBeDefined();
    expect(mesh.position.x).toBe(0);
    expect(
      (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
    ).toBe('ff0000');

    graph.update({
      data: { nodes: { update: [{ id: 'n1', position: { x: 10, y: 20, z: 30 } }] } },
    });
    await nextTick();
    mesh = graph.scene.children.find(
      (c) => c.userData.nodeId === 'n1'
    ) as THREE.Mesh;
    expect(mesh.position.x).toBe(10);

    graph.update({ data: { nodes: { update: [{ id: 'n1', color: '#0000ff' }] } } });
    await nextTick();
    mesh = graph.scene.children.find(
      (c) => c.userData.nodeId === 'n1'
    ) as THREE.Mesh;
    expect(
      (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
    ).toBe('0000ff');

    cleanup();
  });

  it('should apply hover and selected styles', async () => {
    const spec: Spec = {
      data: {
        nodes: [{ id: 'n1', type: 'sphere', color: '#ff0000' }],
        edges: [],
      },
      style: {
        'node:hover': { color: '#00ff00' },
        'node:selected': { color: '#0000ff' },
      },
    } as any;
    const { graph, cleanup } = createTestGraph(spec);

    await nextTick();

    let mesh = graph.scene.children.find(
      (c) => c.userData.nodeId === 'n1'
    ) as THREE.Mesh;
    expect(
      (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
    ).toBe('ff0000');

    graph.update({ interaction: { hoveredElementId: 'n1' } });
    await nextTick();
    mesh = graph.scene.children.find(
      (c) => c.userData.nodeId === 'n1'
    ) as THREE.Mesh;
    expect(
      (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
    ).toBe('00ff00');

    graph.update({ interaction: { selectedElementIds: ['n1'] } });
    await nextTick();
    mesh = graph.scene.children.find(
      (c) => c.userData.nodeId === 'n1'
    ) as THREE.Mesh;
    expect(
      (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
    ).toBe('0000ff');

    cleanup();
  });
});
