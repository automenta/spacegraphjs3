import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpaceGraph } from '../../src/SpaceGraph';
import { Spec } from '../../src/types';
import { Color, Mesh, SphereGeometry, BoxGeometry } from 'three';

// Mock the WebGLRenderer to avoid errors in a Node.js environment
vi.mock('three', async (importOriginal) => {
  const three = await importOriginal();
  return {
    ...three,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    })),
  };
});

// Helper to get all meshes from the scene
const getMeshes = (graph: SpaceGraph) => {
  return graph.scene.children.filter(
    (child) => child instanceof Mesh
  ) as Mesh[];
};

// Helper to yield to the event loop and allow microtasks to run
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('SpaceGraph Core and Reactivity', () => {
  let container: HTMLElement;
  let basicSpec: Spec;
  let graph: SpaceGraph | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    basicSpec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', color: '#ff0000' },
          { id: 'n2', type: 'sphere', color: '#00ff00' },
        ],
        edges: [],
      },
    };
  });

  afterEach(() => {
    if (graph) {
      graph.destroy();
      graph = null;
    }
    document.body.removeChild(container);
  });

  it('should initialize and create scene objects for each node', async () => {
    graph = new SpaceGraph(container, basicSpec);
    await tick(); // Wait for effects

    const meshes = getMeshes(graph);
    expect(meshes.length).toBe(2);
    expect(graph.scene.children.length).toBe(4); // 2 meshes + 2 lights
  });

  it('should add a node reactively via update()', async () => {
    graph = new SpaceGraph(container, basicSpec);
    await tick();
    expect(getMeshes(graph).length).toBe(2);

    graph.update({
      data: {
        nodes: [
          ...basicSpec.data.nodes,
          { id: 'n3', type: 'box', color: '#0000ff' },
        ],
      },
    });

    await tick();

    const meshes = getMeshes(graph);
    expect(meshes.length).toBe(3);
  });

  it('should remove a node reactively via update()', async () => {
    graph = new SpaceGraph(container, basicSpec);
    await tick();
    expect(getMeshes(graph).length).toBe(2);

    graph.update({
      data: {
        nodes: [basicSpec.data.nodes[0]], // Only n1 remains
      },
    });

    await tick();

    const meshes = getMeshes(graph);
    expect(meshes.length).toBe(1);
  });

  it('should update a node property reactively via update()', async () => {
    graph = new SpaceGraph(container, basicSpec);
    await tick();

    const initialMeshes = getMeshes(graph);
    const node1Material = initialMeshes[0].material as THREE.MeshStandardMaterial;
    expect(node1Material.color).toEqual(new Color('#ff0000'));

    // Use Solid's store merging capability by only providing the changed property
    graph.update({
      data: {
        nodes: [{ id: 'n1', color: '#ffff00' }],
      },
    });

    await tick();

    const updatedMeshes = getMeshes(graph);
    const updatedMaterial = updatedMeshes[0].material as THREE.MeshStandardMaterial;
    expect(updatedMaterial.color).toEqual(new Color('#ffff00'));
  });

  it('should change a node geometry type reactively', async () => {
    graph = new SpaceGraph(container, basicSpec);
    await tick();

    const initialMeshes = getMeshes(graph);
    expect(initialMeshes[0].geometry).toBeInstanceOf(SphereGeometry);

    graph.update({
      data: {
        nodes: [{ id: 'n1', type: 'box' }],
      },
    });

    await tick();

    const updatedMeshes = getMeshes(graph);
    expect(updatedMeshes[0].geometry).toBeInstanceOf(BoxGeometry);
  });
});
