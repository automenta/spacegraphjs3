import { createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { HtmlNodeSpec, Spec } from '../types';

export class HTMLRenderer {
  private cssScene: THREE.Scene;
  private state: Store<Spec>;
  private htmlObjects: Map<string, CSS3DObject> = new Map();
  private disposeEffect?: () => void;

  constructor(cssScene: THREE.Scene, state: Store<Spec>) {
    this.cssScene = cssScene;
    this.state = state;

    createEffect(() => {
      // This effect will run whenever the nodes array changes.
      this.updateHTMLNodes();
    });
  }

  public updateHTMLNodes(htmlNodes?: HtmlNodeSpec[]) {
    // If htmlNodes are not passed, get them from the state.
    // This supports both reactive calls (from createEffect) and manual calls (from tests).
    if (!htmlNodes) {
      htmlNodes = (this.state.data?.nodes || []).filter(
        (node): node is HtmlNodeSpec => node.type === 'html'
      );
    }

    // Remove old objects
    const currentNodeIds = new Set(htmlNodes.map((n: HtmlNodeSpec) => n.id));
    for (const [id, object] of this.htmlObjects.entries()) {
      if (!currentNodeIds.has(id)) {
        // Only remove from scene if it's actually a child
        if (object.parent === this.cssScene) {
          this.cssScene.remove(object);
        }
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
        object.userData.nodeId = node.id;
        this.htmlObjects.set(node.id, object);
        this.cssScene.add(object);
      } else {
        // Update existing element content if it has changed
        if (object.element.innerHTML !== (node.content || '')) {
          object.element.innerHTML = node.content || '';
        }
        if (
          object.element.className !==
          (node.className || 'spacegraph-html-node')
        ) {
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
      // Only remove from scene if it's actually a child
      if (object.parent === this.cssScene) {
        this.cssScene.remove(object);
      }
    }
    this.htmlObjects.clear();
  }
}
