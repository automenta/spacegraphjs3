import * as THREE from 'three';
import { createEffect, onCleanup } from 'solid-js';
import { Store } from 'solid-js/store';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { Spec } from './types';

export class HTMLRenderer {
  private cssScene: THREE.Scene;
  private state: Store<Spec>;
  private htmlObjects: Map<string, CSS3DObject> = new Map();

  constructor(cssScene: THREE.Scene, state: Store<Spec>) {
    this.cssScene = cssScene;
    this.state = state;

    createEffect(() => {
      // Depend on nodes for reactivity in tests
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.state.data?.nodes;
      this.updateHTMLNodes();
    });

    onCleanup(() => this.dispose());
  }

  public updateHTMLNodes() {
    const htmlNodes = (this.state.data?.nodes || []).filter(
      (node) => node.type === 'html'
    );

    // Remove old objects
    const currentNodeIds = new Set(htmlNodes.map((n) => n.id));
    for (const [id, object] of this.htmlObjects.entries()) {
      if (!currentNodeIds.has(id)) {
        this.cssScene.remove(object);
        this.htmlObjects.delete(id);
      }
    }

    // Add/update objects
    for (const node of htmlNodes) {
      let object = this.htmlObjects.get(node.id);

      if (!object) {
        // Create new element and object
        const element = document.createElement('div');
        element.innerHTML = node.content || '';
        element.className = node.className || 'spacegraph-html-node';
        object = new CSS3DObject(element);
        this.htmlObjects.set(node.id, object);
        this.cssScene.add(object);
      } else {
        // Update existing element content if it has changed
        if (object.element.innerHTML !== (node.content || '')) {
          object.element.innerHTML = node.content || '';
        }
        if (object.element.className !== (node.className || 'spacegraph-html-node')) {
          object.element.className = node.className || 'spacegraph-html-node';
        }
      }

      // Always update position
      if (node.position) {
        object.position.set(node.position.x, node.position.y, node.position.z);
      }
    }
  }

  public dispose() {
    for (const object of this.htmlObjects.values()) {
      this.cssScene.remove(object);
    }
    this.htmlObjects.clear();
  }
}
