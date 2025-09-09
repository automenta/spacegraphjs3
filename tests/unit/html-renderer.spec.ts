import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { createState } from '../../src/createState';
import { HTMLRenderer } from '../../src/HTMLRenderer';
import { Spec, GraphElement, HtmlElement, SpecUpdate, DeepPartial } from '../../src/types';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

describe('HTMLRenderer', () => {
  let cssScene: THREE.Scene;
  let state: ReturnType<typeof createState>['state'];
  let updateState: ReturnType<typeof createState>['updateState'];
  let dispose: () => void;
  const initialSphereNode: GraphElement = { id: 'sphere1', type: 'sphere', position: { x: 4, y: 5, z: 6 } };
  const initialHtmlNode: HtmlElement = {
    id: 'html1',
    type: 'html',
    position: { x: 1, y: 2, z: 3 },
    content: '<h1>Test</h1>',
    className: 'test-class',
  };


  beforeEach(() => {
    cssScene = new THREE.Scene();
    createRoot((_dispose) => {
        const spec: Spec = {
            data: {
              nodes: [initialHtmlNode, initialSphereNode],
              edges: [],
            },
            interaction: {
                hoveredElementId: null,
                selectedElementIds: [],
            },
            style: {},
            layout: { type: 'force-directed' },
            camera: {
                target: { x: 0, y: 0, z: 0 },
                phi: 0,
                theta: 0,
                distance: 10,
            }
          };
      const { state: s, updateState: u } = createState(spec);
      state = s;
      updateState = u;
      new HTMLRenderer(cssScene, state);
      dispose = _dispose;
    });
  });

  it('should create, update, and remove HTML objects based on state', async () => {
    await Promise.resolve();
    expect(cssScene.children.length).toBe(1);
    const htmlObject = cssScene.children[0] as CSS3DObject;
    expect(htmlObject).toBeInstanceOf(CSS3DObject);
    expect(htmlObject.position).toEqual(new THREE.Vector3(1, 2, 3));
    expect(htmlObject.element.innerHTML).toBe('<h1>Test</h1>');
    expect(htmlObject.element.className).toBe('test-class');

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
    await Promise.resolve();

    expect(cssScene.children.length).toBe(1);
    expect(htmlObject.position).toEqual(new THREE.Vector3(10, 20, 30));
    expect(htmlObject.element.innerHTML).toBe('<h2>Updated</h2>');

    updateState({ data: { nodes: [ { id: 'html1', delete: true } as any] } });
    await Promise.resolve();
    expect(cssScene.children.length).toBe(0);
    dispose();
  });
});
