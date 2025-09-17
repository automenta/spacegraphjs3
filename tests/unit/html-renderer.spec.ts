import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createStore } from 'solid-js/store';
import { HtmlNodeSpec, Spec } from '../../src';
import { HTMLRenderer } from '../../src/renderers/HTMLRenderer';
import { nextTick } from './test-utils';
import { createRoot } from 'solid-js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

describe('HTMLRenderer', () => {
  it('should create, update, and remove HTML objects based on state', async () => {
    await createRoot(async (dispose) => {
      const cssScene = new THREE.Scene();
      const initialHtmlNode: HtmlNodeSpec = {
        id: 'html1',
        type: 'html',
        position: { x: 1, y: 2, z: 3 },
        content: '<h1>Test</h1>',
        className: 'test-class',
      };
      const [state, setState] = createStore<Spec>({
        data: { nodes: [initialHtmlNode], edges: [] },
      } as Spec);

      const htmlRenderer = new HTMLRenderer(cssScene, state);
      htmlRenderer.updateHTMLNodes();
      await nextTick();

      expect(cssScene.children.length).toBe(1);
      const htmlObject = cssScene.children[0] as CSS3DObject;
      expect(htmlObject.position).toEqual(new THREE.Vector3(1, 2, 3));
      expect(htmlObject.element.innerHTML).toBe('<h1>Test</h1>');

      setState('data', 'nodes', (n) => n.id === 'html1', {
        position: { x: 10, y: 20, z: 30 },
        content: '<h2>Updated</h2>',
      });
      htmlRenderer.updateHTMLNodes();
      await nextTick();

      expect(htmlObject.position).toEqual(new THREE.Vector3(10, 20, 30));
      expect(htmlObject.element.innerHTML).toBe('<h2>Updated</h2>');

      setState('data', 'nodes', (n) => n.filter((node) => node.id !== 'html1'));
      htmlRenderer.updateHTMLNodes();
      await nextTick();

      expect(cssScene.children.length).toBe(0);

      htmlRenderer.dispose();
      dispose();
    });
  });
});
