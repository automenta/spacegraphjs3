import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { ElementActorClass, NodeSpec, Spec } from '../types';
import { IRenderer } from './IRenderer';
import { BaseElementActor } from './elementActors/BaseElementActor';
import { HtmlNodeElementActor } from './elementActors/HtmlNodeElementActor';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { HTMLRenderer } from './HTMLRenderer';

/**
 * Manages the rendering of all nodes in the graph using ElementActors.
 * It instantiates the correct actor based on the node's type and orchestrates their lifecycle.
 */
export class NodeRenderer implements IRenderer {
  public elementActors: Map<string, BaseElementActor> = new Map();
  private readonly scene: THREE.Scene;
  private readonly css3DScene: THREE.Scene | null = null;
  private readonly state: Store<Spec>;
  private elementActorRegistry: Map<string, ElementActorClass>;
  private disposeEffect?: () => void;

  constructor(
    scene: THREE.Scene,
    css3DScene: THREE.Scene | null,
    state: Store<Spec>,
    elementActorRegistry: Map<string, ElementActorClass>
  ) {
    this.scene = scene;
    this.css3DScene = css3DScene;
    this.state = state;
    this.elementActorRegistry = elementActorRegistry;

    this.init();
  }

  public updateNodes() {
    const nodes = this.state.data?.nodes || [];
    const currentNodeIds = new Set(nodes.map((n) => n.id));

    // Add new actors for new nodes.
    nodes.forEach((node, index) => {
      if (!this.elementActors.has(node.id)) {
        // Pass the state proxy by index for performance
        this.addElementActor(node, this.state.data!.nodes![index]);
      }
    });

    // Remove actors for nodes that no longer exist.
    for (const nodeId of this.elementActors.keys()) {
      if (!currentNodeIds.has(nodeId)) {
        this.removeElementActor(nodeId);
      }
    }
  }

  public getRaycastableObjects(): THREE.Object3D[] {
    const raycastableObjects: THREE.Object3D[] = [];
    for (const actor of this.elementActors.values()) {
      const obj = actor.getRaycastableObject();
      if (obj) {
        raycastableObjects.push(obj);
      }
    }
    return raycastableObjects;
  }

  public getNodeIdFromIntersection(
    intersection: THREE.Intersection
  ): string | null {
    // Retrieve the nodeId stored in the mesh's userData.
    return intersection.object.userData.nodeId ?? null;
  }

  public dispose(): void {
    // Create a copy of the keys to avoid issues with modifying the map while iterating.
    const nodeIds = Array.from(this.elementActors.keys());
    for (const nodeId of nodeIds) {
      this.removeElementActor(nodeId);
    }
  }

  // --- IRenderer Implementation ---

  private init() {
    createEffect(() => this.updateNodes());
  }

  private addElementActor(node: NodeSpec, elementStateProxy: Store<NodeSpec>) {
    const ActorClass = this.elementActorRegistry.get(node.type);
    if (!ActorClass) {
      console.warn(
        `No ElementActor registered for type: ${node.type}. Skipping node ${node.id}.`
      );
      return;
    }

    const actor = new ActorClass(this.scene, elementStateProxy, this.state);
    actor.init();
    this.elementActors.set(node.id, actor);
    
    // For HTML nodes, we need to add them to the CSS3D scene
    if (node.type === 'html' && actor instanceof HtmlNodeElementActor) {
      const css3DObject = actor.getRaycastableObject() as CSS3DObject;
      if (css3DObject && this.css3DScene) {
        this.css3DScene.add(css3DObject);
      }
    }
  }

  private removeElementActor(nodeId: string) {
    console.log(`NodeRenderer: Removing actor for node ${nodeId}`);
    const actor = this.elementActors.get(nodeId);
    if (actor) {
      // For HTML nodes, we need to remove them from the CSS3D scene
      if (actor instanceof HtmlNodeElementActor) {
        const css3DObject = actor.getRaycastableObject() as CSS3DObject;
        if (css3DObject && this.css3DScene) {
          this.css3DScene.remove(css3DObject);
        }
      }
      
      actor.dispose();
      this.elementActors.delete(nodeId);
    }
  }
}
