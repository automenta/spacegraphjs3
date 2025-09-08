import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { createState } from '../../src/createState';
import { NodeRenderer } from '../../src/renderers/NodeRenderer';
import { SphereElementActor } from '../../src/elementActors/SphereElementActor';
import { Spec } from '../../src/types';

describe('NodeRenderer and SphereElementActor', () => {
  let scene: THREE.Scene;
  let state: ReturnType<typeof createState>['state'];
  let updateState: ReturnType<typeof createState>['updateState'];
  let nodeRenderer: NodeRenderer;
  let dispose: () => void;

  beforeEach(() => {
    scene = new THREE.Scene();
    // No camera added to the scene in the test setup anymore
    createRoot((_dispose) => {
      const { state: s, updateState: u } = createState({
        data: { nodes: [], edges: [] },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      });
      state = s;
      updateState = u;
      nodeRenderer = new NodeRenderer(scene, state);
      dispose = _dispose;
    });
  });

  it('should add and remove sphere nodes based on state changes', async () => {
    expect(scene.children.length).toBe(0); // No objects initially

    updateState({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 }, color: '#ff0000' },
        ],
      },
    });

    expect(scene.children.length).toBe(1); // 1 node
    let mesh = scene.children[0] as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.userData.nodeId).toBe('n1');

    updateState({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 }, color: '#ff0000' },
          { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 }, color: '#00ff00' },
        ],
      },
    });

    expect(scene.children.length).toBe(2); // 2 nodes
    mesh = scene.children.find(c => c.userData.nodeId === 'n2') as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.userData.nodeId).toBe('n2');

    updateState({
      data: {
        nodes: [
          { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 }, color: '#00ff00' },
        ],
      },
    });

    expect(scene.children.length).toBe(1); // 1 node (n1 removed)
    expect(scene.children.find(c => c.userData.nodeId === 'n1')).toBeUndefined();

    dispose();
  });

  it('should reactively update node position and color', async () => {
    updateState({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 }, color: '#ff0000' },
        ],
      },
    });
    await Promise.resolve(); // Wait for SolidJS effects to flush
    expect(scene.children.length).toBe(1); // 1 node
    let mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    let material = mesh.material as THREE.MeshBasicMaterial;

    expect(mesh.position.x).toBe(0);
    expect(material.color.getHexString()).toBe('ff0000');

    // Update position
    updateState({
      data: {
        nodes: [
          { id: 'n1', position: { x: 10, y: 20, z: 30 } },
        ],
      },
    });
    await Promise.resolve(); // Wait for SolidJS effects to flush
    mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    material = mesh.material as THREE.MeshBasicMaterial;

    expect(mesh.position.x).toBe(10);
    expect(mesh.position.y).toBe(20);
    expect(mesh.position.z).toBe(30);

    // Update color
    updateState({
      data: {
        nodes: [
          { id: 'n1', color: '#0000ff' },
        ],
      },
    });
    await Promise.resolve(); // Wait for SolidJS effects to flush
    mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    material = mesh.material as THREE.MeshBasicMaterial;

    expect(material.color.getHexString()).toBe('0000ff');

    dispose();
  });

  it('should apply hover and selected styles', async () => {
    updateState({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', color: '#ff0000' },
        ],
      },
      style: {
        'node:hover': { color: '#00ff00' }, // Green on hover
        'node:selected': { color: '#0000ff' }, // Blue on select
      },
    });

    let mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    let material = mesh.material as THREE.MeshBasicMaterial;

    // Default color
    expect(material.color.getHexString()).toBe('ff0000');

    // Hover state
    updateState({ interaction: { hoveredElementId: 'n1' } });
    await Promise.resolve(); // Wait for SolidJS effects to flush
    mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    material = mesh.material as THREE.MeshBasicMaterial;
    expect(material.color.getHexString()).toBe('00ff00');

    // Selected state (should override hover)
    updateState({ interaction: { selectedElementIds: ['n1'] } });
    await Promise.resolve(); // Wait for SolidJS effects to flush
    mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    material = mesh.material as THREE.MeshBasicMaterial;
    expect(material.color.getHexString()).toBe('0000ff');

    // Unhover while selected (should remain selected color)
    updateState({ interaction: { hoveredElementId: null } });
    await Promise.resolve(); // Wait for SolidJS effects to flush
    mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    material = mesh.material as THREE.MeshBasicMaterial;
    expect(material.color.getHexString()).toBe('0000ff');

    // Unselect (should revert to default color)
    updateState({ interaction: { selectedElementIds: [] } });
    await Promise.resolve(); // Wait for SolidJS effects to flush
    mesh = scene.children.find(c => c.userData.nodeId === 'n1') as THREE.Mesh;
    material = mesh.material as THREE.MeshBasicMaterial;
    expect(material.color.getHexString()).toBe('ff0000');

    dispose();
  });
});
