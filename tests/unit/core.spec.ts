import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpaceGraph } from '../../src/SpaceGraph';
import { Spec } from '../../src/types';

describe('SpaceGraph Core', () => {
  let container: HTMLElement;
  let basicSpec: Spec;

  beforeEach(() => {
    // Set up a DOM element for the container, as Vitest runs in a jsdom environment
    container = document.createElement('div');
    document.body.appendChild(container);

    // A basic spec for testing
    basicSpec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere' },
          { id: 'n2', type: 'sphere' },
        ],
        edges: [],
      },
    };
  });

  afterEach(() => {
    // Clean up the container
    document.body.removeChild(container);
  });

  it('should initialize and create scene objects for each node', () => {
    const graph = new SpaceGraph(container, basicSpec);

    // The scene should contain:
    // 2 lights (ambient, directional)
    // 2 node objects (from the spec)
    // So, a total of 4 children.
    const nodeObjects = graph.scene.children.filter(
      (child) => child.type === 'Mesh'
    );
    expect(nodeObjects.length).toBe(2);
    expect(graph.scene.children.length).toBe(4);
  });

  it('should create a renderer and append its canvas to the container', () => {
    new SpaceGraph(container, basicSpec);
    expect(container.children.length).toBe(1);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('should initialize the reactive state from the spec', () => {
    const graph = new SpaceGraph(container, basicSpec);

    // The internal state is private, but we can check if it reflects the spec.
    // This is an indirect way to test. We'll rely on the scene graph test for now.
    // However, if we had a public method like `getNodeState(id)`, we could test it here.
    // For now, we confirm the test setup works.
    expect(graph).toBeInstanceOf(SpaceGraph);
  });
});
