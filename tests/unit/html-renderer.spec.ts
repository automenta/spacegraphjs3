import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Spec, HtmlNodeSpec } from '../../src/types';
import { createTestGraph, nextTick } from './test-utils';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

describe('HTMLRenderer', () => {
  it('should create, update, and remove HTML objects based on state', async () => {
    const initialHtmlNode: HtmlNodeSpec = {
      id: 'html1',
      type: 'html',
      position: { x: 1, y: 2, z: 3 },
      content: '<h1>Test</h1>',
      className: 'test-class',
    };
    const spec: Spec = {
      data: { nodes: [initialHtmlNode], edges: [] },
    } as any;
    const { graph, cleanup } = createTestGraph(spec);
    const cssScene = graph.renderingManager['cssScene'] as THREE.Scene;

    await nextTick();

    expect(cssScene.children.length).toBe(1);
    const htmlObject = cssScene.children[0] as CSS3DObject;
    expect(htmlObject.position).toEqual(new THREE.Vector3(1, 2, 3));
    expect(htmlObject.element.innerHTML).toBe('<h1>Test</h1>');

    graph.update({
      data: {
        nodes: {
          update: [
            {
              id: 'html1',
              position: { x: 10, y: 20, z: 30 },
              content: '<h2>Updated</h2>',
            },
          ],
        },
      },
    });

    await nextTick();

    expect(htmlObject.position).toEqual(new THREE.Vector3(10, 20, 30));
    expect(htmlObject.element.innerHTML).toBe('<h2>Updated</h2>');

    graph.update({ data: { nodes: { remove: ['html1'] } } });

    await nextTick();

    expect(cssScene.children.length).toBe(0);

    cleanup();
  });
});
