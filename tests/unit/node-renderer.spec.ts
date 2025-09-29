import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createStore } from 'solid-js/store';
import { NodeSpec, Spec } from '../../src';
import { NodeRenderer } from '../../src/renderers/NodeRenderer';
import { SphereElementActor } from '../../src/renderers/elementActors/SphereElementActor';
import { nextTick } from './test-utils';
import { createRoot } from 'solid-js';

// Mock the element actor registry
const elementActorRegistry = new Map([['sphere', SphereElementActor]]);

describe('NodeRenderer', () => {
  it('should add and remove sphere nodes based on state changes', async () => {
    await createRoot(async (dispose) => {
      const scene = new THREE.Scene();
      const [state, setState] = createStore<Spec>({
        data: { nodes: [], edges: [] },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: 0,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 1,
            zoomSpeed: 1,
            orbitSpeed: 1,
          },
        },
        performance: {
          instancingThreshold: 1000,
        },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      });

      const css3DScene = new THREE.Scene();
      const nodeRenderer = new NodeRenderer(scene, css3DScene, state, elementActorRegistry);
      nodeRenderer.updateNodes();

      expect(scene.children.length).toBe(0);

      // Add a node
      setState('data', 'nodes', (n) => [...n, { id: 'n1', type: 'sphere' }]);
      nodeRenderer.updateNodes();
      await nextTick();
      expect(scene.children.length).toBe(1);

      // Add another node
      setState('data', 'nodes', (n) => [...n, { id: 'n2', type: 'sphere' }]);
      nodeRenderer.updateNodes();
      await nextTick();
      expect(scene.children.length).toBe(2);

      // Remove a node
      setState('data', 'nodes', (n) => n.filter((node) => node.id !== 'n1'));
      nodeRenderer.updateNodes();
      await nextTick();
      expect(scene.children.length).toBe(1);

      nodeRenderer.dispose();
      dispose();
    });
  });

  it('should reactively update node position and color', async () => {
    await createRoot(async (dispose) => {
      const scene = new THREE.Scene();
      const initialNodes: NodeSpec[] = [
        {
          id: 'n1',
          type: 'sphere',
          position: { x: 0, y: 0, z: 0 },
          color: '#ff0000',
        },
      ];
      const [state, setState] = createStore<Spec>({
        data: { nodes: initialNodes, edges: [] },
        style: {},
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: 0,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 1,
            zoomSpeed: 1,
            orbitSpeed: 1,
          },
        },
        performance: {
          instancingThreshold: 1000,
        },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      });

      const css3DScene = new THREE.Scene();
      const nodeRenderer = new NodeRenderer(scene, css3DScene, state, elementActorRegistry);
      nodeRenderer.updateNodes();
      (nodeRenderer.elementActors.get('n1') as SphereElementActor)?.update();
      await nextTick();

      let group = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Group;
      let mesh = group.children[0] as THREE.Mesh;
      expect(group).toBeDefined();
      expect(group.position.x).toBe(0);
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('ff0000');

      // Update position
      setState('data', 'nodes', (n) => n.id === 'n1', 'position', {
        x: 10,
        y: 20,
        z: 30,
      });
      (nodeRenderer.elementActors.get('n1') as SphereElementActor)?.update();
      await nextTick();
      group = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Group;
      expect(group.position.x).toBe(10);

      // Update color
      setState('data', 'nodes', (n) => n.id === 'n1', 'color', '#0000ff');
      (nodeRenderer.elementActors.get('n1') as SphereElementActor)?.update();
      await nextTick();
      group = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Group;
      mesh = group.children[0] as THREE.Mesh;
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
      const initialNodes: NodeSpec[] = [
        { id: 'n1', type: 'sphere', color: '#ff0000' },
      ];
      const [state, setState] = createStore<Spec>({
        data: { nodes: initialNodes, edges: [] },
        style: {
          'node:hover': { color: '#00ff00' },
          'node:selected': { color: '#0000ff' },
        },
        layout: { type: 'force-directed' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: 0,
          theta: 0,
          distance: 100,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 1,
            zoomSpeed: 1,
            orbitSpeed: 1,
          },
        },
        performance: {
          instancingThreshold: 1000,
        },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      });

      const css3DScene = new THREE.Scene();
      const nodeRenderer = new NodeRenderer(scene, css3DScene, state, elementActorRegistry);
      nodeRenderer.updateNodes();
      (nodeRenderer.elementActors.get('n1') as SphereElementActor)?.update();
      await nextTick();

      let group = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Group;
      let mesh = group.children[0] as THREE.Mesh;
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('ff0000');

      // Hover
      setState('interaction', 'hoveredElementId', 'n1');
      (nodeRenderer.elementActors.get('n1') as SphereElementActor)?.update();
      await nextTick();
      group = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Group;
      mesh = group.children[0] as THREE.Mesh;
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('00ff00');

      // Select
      setState('interaction', 'selectedElementIds', ['n1']);
      (nodeRenderer.elementActors.get('n1') as SphereElementActor)?.update();
      await nextTick();
      group = scene.children.find(
        (c) => c.userData.nodeId === 'n1'
      ) as THREE.Group;
      mesh = group.children[0] as THREE.Mesh;
      expect(
        (mesh.material as THREE.MeshBasicMaterial).color.getHexString()
      ).toBe('0000ff');

      nodeRenderer.dispose();
      dispose();
    });
  });
});
