import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createRoot, createEffect, on } from 'solid-js';
import { createState } from '../../src/createState';
import { Spec } from '../../src/types';
import { NodeRenderer } from '../../src/renderers/NodeRenderer';

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('NodeRenderer and SphereElementActor', () => {
  it('should add and remove sphere nodes based on state changes', async () => {
    await createRoot(async (dispose) => {
      const scene = new THREE.Scene();
      const spec: Spec = { data: { nodes: [], edges: [] } };
      const { state, updateState } = createState(spec);
      const nodeRenderer = new NodeRenderer(scene, state);

      expect(scene.children.length).toBe(0);

      updateState({ data: { nodes: [{ id: 'n1', type: 'sphere' }] } });
      await nextTick();
      expect(scene.children.length).toBe(1);

      updateState({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere' },
            { id: 'n2', type: 'sphere' },
          ],
        },
      });
      await nextTick();
      expect(scene.children.length).toBe(2);

      updateState({ data: { nodes: [{ id: 'n1', delete: true } as any] } });
      await nextTick();
      expect(scene.children.length).toBe(1);

      nodeRenderer.dispose();
      dispose();
    });
  });

  it('should reactively update node position and color', async () => {
    await createRoot(async (dispose) => {
      const scene = new THREE.Scene();
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
        },
      };
      const { state, updateState } = createState(spec);
      const nodeRenderer = new NodeRenderer(scene, state);

      await nextTick();

      let mesh = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Mesh;
      expect(mesh).toBeDefined();
      expect(mesh.position.x).toBe(0);
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('ff0000');

      updateState({
        data: { nodes: [{ id: 'n1', position: { x: 10, y: 20, z: 30 } }] },
      });
      await nextTick();
      mesh = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Mesh;
      expect(mesh.position.x).toBe(10);

      updateState({ data: { nodes: [{ id: 'n1', color: '#0000ff' }] } });
      await nextTick();
      mesh = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Mesh;
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('0000ff');

      nodeRenderer.dispose();
      dispose();
    });
  });

  it('should apply hover and selected styles', async () => {
    await createRoot(async (dispose) => {
      const scene = new THREE.Scene();
      const spec: Spec = {
        data: { nodes: [{ id: 'n1', type: 'sphere', color: '#ff0000' }] },
        style: {
          'node:hover': { color: '#00ff00' },
          'node:selected': { color: '#0000ff' },
        },
      };
      const { state, updateState } = createState(spec);
      const nodeRenderer = new NodeRenderer(scene, state);

      await nextTick();

      let mesh = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Mesh;
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('ff0000');

      updateState({ interaction: { hoveredElementId: 'n1' } });
      await nextTick();
      mesh = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Mesh;
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('00ff00');

      updateState({ interaction: { selectedElementIds: ['n1'] } });
      await nextTick();
      mesh = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Mesh;
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('0000ff');

      nodeRenderer.dispose();
      dispose();
    });
  });
});
