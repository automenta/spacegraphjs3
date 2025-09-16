import * as THREE from 'three';
import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { Spec, GraphElement } from '../types';
import { IRenderer } from '../IRenderer';
import { BaseElementActor } from '../elementActors/BaseElementActor';
import { SphereElementActor } from '../elementActors/SphereElementActor';

// Define a type for the ElementActor constructor
type ElementActorConstructor = new (
  scene: THREE.Scene,
  elementState: Store<GraphElement>,
  graphState: Store<Spec>
) => BaseElementActor;

/**
 * Manages the rendering of all nodes in the graph using ElementActors.
 * It instantiates the correct actor based on the node's type and orchestrates their lifecycle.
 */
export class NodeRenderer implements IRenderer {
  private scene: THREE.Scene;
  private state: Store<Spec>;
  private elementActors: Map<string, BaseElementActor> = new Map();
  private static registeredElementTypes: Map<string, ElementActorConstructor> =
    new Map();
  private disposeEffect?: () => void;

  constructor(scene: THREE.Scene, state: Store<Spec>) {
    this.scene = scene;
    this.state = state;

    this.disposeEffect = createRoot((dispose) => {
      this.init();
      return dispose;
    });
  }

  /**
   * Registers a new element type with its corresponding ElementActor class.
   * This allows for extending SpaceGraph with custom node rendering.
   * @param typeName - The name of the element type (e.g., 'sphere', 'html').
   * @param ActorClass - The ElementActor class responsible for rendering this type.
   */
  public static registerType(
    typeName: string,
    ActorClass: ElementActorConstructor
  ) {
    NodeRenderer.registeredElementTypes.set(typeName, ActorClass);
  }

  private init() {
    console.log('NodeRenderer: init');
    // Register default types
    NodeRenderer.registerType('sphere', SphereElementActor);

    createEffect(() => {
      console.log('NodeRenderer: createEffect triggered');
      const nodes = this.state.data?.nodes || [];
      console.log(`NodeRenderer: Processing ${nodes.length} nodes`);
      const currentNodeIds = new Set(nodes.map((n) => n.id));

      // Add new actors for new nodes.
      for (const node of nodes) {
        if (!this.elementActors.has(node.id)) {
          this.addElementActor(node);
        }
      }

      // Remove actors for nodes that no longer exist.
      for (const nodeId of this.elementActors.keys()) {
        if (!currentNodeIds.has(nodeId)) {
          this.removeElementActor(nodeId);
        }
      }
    });
  }

  private addElementActor(node: GraphElement) {
    console.log(`NodeRenderer: Adding actor for node ${node.id}`);
    const ActorClass = NodeRenderer.registeredElementTypes.get(node.type);
    if (!ActorClass) {
      console.warn(
        `No ElementActor registered for type: ${node.type}. Skipping node ${node.id}.`
      );
      return;
    }

    // Create a reactive proxy for the individual node state
    // This allows the actor to react to changes in its own elementState
    const elementStateProxy = this.state.data!.nodes!.find(
      (n) => n.id === node.id
    )!;

    const actor = new ActorClass(
      this.scene,
      elementStateProxy as Store<GraphElement>,
      this.state
    );
    actor.init();
    this.elementActors.set(node.id, actor);
  }

  private removeElementActor(nodeId: string) {
    console.log(`NodeRenderer: Removing actor for node ${nodeId}`);
    const actor = this.elementActors.get(nodeId);
    if (actor) {
      actor.dispose();
      this.elementActors.delete(nodeId);
    }
  }

  // --- IRenderer Implementation ---

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
    if (this.disposeEffect) {
      this.disposeEffect();
    }
    // Create a copy of the keys to avoid issues with modifying the map while iterating.
    const nodeIds = Array.from(this.elementActors.keys());
    for (const nodeId of nodeIds) {
      this.removeElementActor(nodeId);
    }
  }
}
