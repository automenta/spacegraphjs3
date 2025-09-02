import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createStore, Store } from 'solid-js/store';
import { Spec } from '../../src/types';
import { HTMLRenderer } from '../../src/HTMLRenderer';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

const createMockState = (): Store<Spec> => {
  const [state] = createStore<Spec>({
    data: {
      nodes: [
        {
          id: 'html1',
          type: 'html',
          position: { x: 1, y: 2, z: 3 },
          content: '<h1>Test</h1>',
          className: 'test-class',
        },
        { id: 'sphere1', type: 'sphere', position: { x: 4, y: 5, z: 6 } },
      ],
      edges: [],
    },
  });
  return state;
};

describe('HTMLRenderer', () => {
  it('should create, update, and remove HTML objects based on state', () => {
    const cssScene = new THREE.Scene();
    const state = createMockState();
    const renderer = new HTMLRenderer(cssScene, state);

    // Initial update
    renderer.updateHTMLNodes();

    // Verify creation
    expect(cssScene.children.length).toBe(1);
    const htmlObject = cssScene.children[0] as CSS3DObject;
    expect(htmlObject).toBeInstanceOf(CSS3DObject);
    expect(htmlObject.position).toEqual(new THREE.Vector3(1, 2, 3));
    expect(htmlObject.element.innerHTML).toBe('<h1>Test</h1>');
    expect(htmlObject.element.className).toBe('test-class');

    // Verify update
    const htmlNode = state.data.nodes.find((n) => n.id === 'html1');
    htmlNode.position = { x: 10, y: 20, z: 30 };
    htmlNode.content = '<h2>Updated</h2>';
    renderer.updateHTMLNodes();

    expect(cssScene.children.length).toBe(1);
    expect(htmlObject.position).toEqual(new THREE.Vector3(10, 20, 30));
    expect(htmlObject.element.innerHTML).toBe('<h2>Updated</h2>');

    // Verify removal
    state.data.nodes = state.data.nodes.filter((n) => n.id !== 'html1');
    renderer.updateHTMLNodes();
    expect(cssScene.children.length).toBe(0);
  });
});
