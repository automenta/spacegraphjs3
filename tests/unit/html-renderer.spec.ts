import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { createState } from '../../src/createState';
import { HTMLRenderer } from '../../src/HTMLRenderer';
import { Spec, HtmlElement, SpecUpdate, DeepPartial } from '../../src/types';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('HTMLRenderer', () => {
  it('should create, update, and remove HTML objects based on state', async () => {
    await createRoot(async (dispose) => {
      const cssScene = new THREE.Scene();
      const initialHtmlNode: HtmlElement = {
        id: 'html1',
        type: 'html',
        position: { x: 1, y: 2, z: 3 },
        content: '<h1>Test</h1>',
        className: 'test-class',
      };
      const spec: Spec = {
        data: { nodes: [initialHtmlNode], edges: [] },
      };
      const { state, updateState } = createState(spec);
      const htmlRenderer = new HTMLRenderer(cssScene, state);

      await nextTick();

      expect(cssScene.children.length).toBe(1);
      const htmlObject = cssScene.children[0] as CSS3DObject;
      expect(htmlObject.position).toEqual(new THREE.Vector3(1, 2, 3));
      expect(htmlObject.element.innerHTML).toBe('<h1>Test</h1>');

      const updateSpec: SpecUpdate = {
        data: {
          nodes: [
            {
              id: 'html1',
              position: { x: 10, y: 20, z: 30 },
              content: '<h2>Updated</h2>',
            } as DeepPartial<HtmlElement> & { id: string },
          ],
        },
      };
      updateState(updateSpec);

      await nextTick();

      expect(htmlObject.position).toEqual(new THREE.Vector3(10, 20, 30));
      expect(htmlObject.element.innerHTML).toBe('<h2>Updated</h2>');

      updateState({ data: { nodes: [{ id: 'html1', delete: true } as any] } });

      await nextTick();

      expect(cssScene.children.length).toBe(0);

      htmlRenderer.dispose();
      dispose();
    });
  });
});
