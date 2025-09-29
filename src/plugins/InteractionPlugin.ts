import { Gesture } from '@use-gesture/vanilla';
import * as THREE from 'three';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { InteractionLogic } from '../InteractionLogic';
import { DragState, HoverState, WheelState } from '../types/use-gesture';
import { EdgeSpec, NodeSpec } from '../types';

/**
 * A plugin that handles user interactions with the graph, such as clicking, dragging, and hovering.
 */
export class InteractionPlugin implements ISpaceGraphPlugin {
  private graph!: SpaceGraph;
  private gesture: Gesture | null = null;
  private dragPlane!: THREE.Plane;
  private draggedElementId: string | null = null;
  private hoveredEdgeId: string | null = null;
  private selectedEdgeIds: string[] = [];
  private boundOnClick!: (event: PointerEvent) => void;
  private rendererEl!: HTMLElement;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.rendererEl = this.graph.render.getRendererDomElement();
    this.dragPlane = new THREE.Plane();

    this.gesture = new Gesture(
      this.rendererEl,
      {
        onDrag: (state) => this.onDrag(state as unknown as DragState),
        onHover: (state) => this.onHover(state as unknown as HoverState),
        onWheel: (state) => this.onWheel(state as unknown as WheelState),
      },
      {}
    );

    this.boundOnClick = this.onClick.bind(this) as unknown as (
      event: PointerEvent
    ) => void;
    this.rendererEl.addEventListener('click', this.boundOnClick as EventListener);

    this.graph.events.on('element:click', ({ target, event }) => {
      const isMultiSelect = event.metaKey || event.ctrlKey;
      const currentSelection =
        this.graph.state.interaction?.selectedElementIds ?? [];
      const newSelection = isMultiSelect
        ? currentSelection.includes(target.id)
          ? currentSelection.filter((id) => id !== target.id)
          : [...currentSelection, target.id]
        : [target.id];

      this.graph.update({
        interaction: { selectedElementIds: newSelection },
      });
    });
  }

  public dispose(): void {
    if (this.gesture) {
      this.gesture.destroy();
    }
    this.rendererEl.removeEventListener('click', this.boundOnClick as EventListener);
  }

  private getIntersectedElement(event: MouseEvent | PointerEvent) {
    const renderer = this.graph.render.getRenderer();
    const camera = this.graph.render.getCamera();
    const nodeRenderer = this.graph.render.getNodeRenderer();
    const edgeRenderer = this.graph.render.getEdgeRenderer();

    if (!nodeRenderer) return null;

    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);

    // First check for edge intersections (they might be closer)
    if (edgeRenderer) {
      const edgeIntersects = raycaster.intersectObjects(
        edgeRenderer.getRaycastableObjects(),
        false
      );
      
      const topEdgeHit = edgeIntersects.find(hit =>
        hit.object.userData.edgeId && hit.object.userData.isHitArea
      );
      
      if (topEdgeHit) {
        const edgeId = topEdgeHit.object.userData.edgeId;
        const edge = this.graph.dataManager.getEdge(edgeId);
        if (edge) {
          const sourceNode = this.graph.dataManager.getNode(edge.source);
          const targetNode = this.graph.dataManager.getNode(edge.target);
          
          if (sourceNode && targetNode) {
            return { type: 'edge', edge, sourceNode, targetNode };
          }
        }
      }
    }

    // Then check for node intersections
    const raycastableObjects = nodeRenderer.getRaycastableObjects();
    const allIntersects: THREE.Intersection[] = [];

    for (const object of raycastableObjects) {
      const intersects = raycaster.intersectObject(object);
      if (intersects.length > 0) {
        allIntersects.push(...intersects);
      }
    }

    if (allIntersects.length > 0) {
      allIntersects.sort((a, b) => a.distance - b.distance);
      const closestIntersection = allIntersects[0];
      const elementId =
        nodeRenderer.getNodeIdFromIntersection(closestIntersection);
      if (elementId) {
        const element = this.graph.dataManager.getElement(elementId);
        if (element) {
          return { type: 'node', element };
        }
      }
    }

    return null;
  }

  private onDrag(state: DragState) {
    const {
      event,
      first,
      last,
      movement: [mx, my],
      xy: [vx, vy],
      pinching,
    } = state;
    if (pinching) return;

    const camera = this.graph.render.getCamera();

    if (first) {
      const intersected = this.getIntersectedElement(
        event as PointerEvent
      );
      
      if (intersected && intersected.type === 'node' && intersected.element && 'position' in intersected.element && intersected.element.position) {
        this.draggedElementId = intersected.element.id;
        // Project the drag plane
        const normal = camera.position.clone().normalize();
        this.dragPlane.setFromNormalAndCoplanarPoint(
          normal,
          new THREE.Vector3(
            intersected.element.position.x,
            intersected.element.position.y,
            intersected.element.position.z
          )
        );
      }
    }

    if (this.draggedElementId) {
      InteractionLogic.handleNodeDrag(
        vx,
        vy,
        this.draggedElementId,
        this.dragPlane,
        this.graph.render.getRendererDomElement(),
        camera,
        (spec) => this.graph.update(spec)
      );
    } else {
      // Panning
      InteractionLogic.handlePan(
        mx,
        my,
        this.graph.state,
        (spec) => this.graph.update(spec),
        camera
      );
    }

    if (last) {
      this.draggedElementId = null;
    }
  }

  private onWheel(state: WheelState) {
    const {
      event,
      delta: [, dy],
    } = state;
    event.preventDefault();
    const zoomSpeed = 0.1;
    const direction = dy > 0 ? 'out' : 'in';
    InteractionLogic.handleKeyZoom(
      this.graph.state,
      (spec) => this.graph.update(spec),
      direction,
      zoomSpeed
    );
  }

  private onHover(state: HoverState) {
    if (this.draggedElementId) return; // Don't hover while dragging
    
    const intersected = this.getIntersectedElement(state.event as MouseEvent);
    const currentHoveredId =
      this.graph.state.interaction?.hoveredElementId ?? null;

    // Handle edge hover
    if (intersected && intersected.type === 'edge') {
      const edgeId = intersected.edge!.id;
      
      // Handle edge hover enter
      if (this.hoveredEdgeId !== edgeId && intersected.edge && intersected.sourceNode && intersected.targetNode) {
        // Handle edge hover leave for previous edge
        if (this.hoveredEdgeId) {
          const prevEdge = this.graph.dataManager.getEdge(this.hoveredEdgeId);
          if (prevEdge) {
            const sourceNode = this.graph.dataManager.getNode(prevEdge.source);
            const targetNode = this.graph.dataManager.getNode(prevEdge.target);
            
            if (sourceNode && targetNode) {
              this.graph.render.getEdgeRenderer()?.setEdgeHover(this.hoveredEdgeId, false);
              this.graph.events.emit('edge:hover:leave', {
                target: prevEdge,
                sourceNode,
                targetNode
              });
            }
          }
        }
        
        // Handle edge hover enter for new edge
        this.hoveredEdgeId = edgeId;
        this.graph.render.getEdgeRenderer()?.setEdgeHover(edgeId, true);
        this.graph.events.emit('edge:hover:enter', {
          target: intersected.edge,
          sourceNode: intersected.sourceNode,
          targetNode: intersected.targetNode
        });
      }
    } else {
      // Handle edge hover leave
      if (this.hoveredEdgeId) {
        const prevEdge = this.graph.dataManager.getEdge(this.hoveredEdgeId);
        if (prevEdge) {
          const sourceNode = this.graph.dataManager.getNode(prevEdge.source);
          const targetNode = this.graph.dataManager.getNode(prevEdge.target);
          
          if (sourceNode && targetNode) {
            this.graph.render.getEdgeRenderer()?.setEdgeHover(this.hoveredEdgeId, false);
            this.graph.events.emit('edge:hover:leave', {
              target: prevEdge,
              sourceNode,
              targetNode
            });
          }
        }
        this.hoveredEdgeId = null;
      }
      
      // Handle node hover
      const element = intersected && intersected.type === 'node' ? intersected.element : null;
      
      if (element) {
        if (currentHoveredId !== element.id) {
          this.graph.update({
            interaction: { hoveredElementId: element.id },
          });
          this.graph.events.emit('element:hover:enter', {
            target: element,
          });
        }
      } else if (currentHoveredId) {
        const oldElement = this.graph.dataManager.getElement(currentHoveredId);
        this.graph.update({ interaction: { hoveredElementId: null } });
        if (oldElement)
          this.graph.events.emit('element:hover:leave', {
            target: oldElement,
          });
      }
    }
  }

  private onClick(event: PointerEvent) {
    const intersected = this.getIntersectedElement(event);
    
    if (intersected) {
      if (intersected.type === 'edge' && intersected.edge && intersected.sourceNode && intersected.targetNode) {
        // Handle edge click
        this.handleEdgeClick(intersected.edge, intersected.sourceNode, intersected.targetNode, event);
      } else if (intersected.type === 'node' && intersected.element) {
        // Handle node click
        this.graph.events.emit('element:click', {
          target: intersected.element,
          event,
        });
      } else {
        this.graph.events.emit('background:click', { event });
      }
    } else {
      this.graph.events.emit('background:click', { event });
    }
  }
  
  private handleEdgeClick(edge: EdgeSpec, sourceNode: NodeSpec, targetNode: NodeSpec, event: PointerEvent): void {
    // Handle selection
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      this.toggleEdgeSelection(edge.id);
    } else {
      // Single select - clear other selections
      this.clearAllEdgeSelections();
      this.selectEdge(edge.id);
    }

    // Fire event
    this.graph.events.emit('edge:click', {
      target: edge,
      event,
      sourceNode,
      targetNode
    });
  }
  
  private selectEdge(edgeId: string): void {
    if (!this.selectedEdgeIds.includes(edgeId)) {
      this.selectedEdgeIds.push(edgeId);
      this.graph.render.getEdgeRenderer()?.setEdgeSelected(edgeId, true);
      
      const edge = this.graph.dataManager.getEdge(edgeId);
      if (edge) {
        const sourceNode = this.graph.dataManager.getNode(edge.source);
        const targetNode = this.graph.dataManager.getNode(edge.target);
        
        if (sourceNode && targetNode) {
          this.graph.events.emit('edge:select', {
            target: edge,
            sourceNode,
            targetNode
          });
        }
      }
    }
  }
  
  private toggleEdgeSelection(edgeId: string): void {
    if (this.selectedEdgeIds.includes(edgeId)) {
      this.deselectEdge(edgeId);
    } else {
      this.selectEdge(edgeId);
    }
  }
  
  private deselectEdge(edgeId: string): void {
    const index = this.selectedEdgeIds.indexOf(edgeId);
    if (index > -1) {
      this.selectedEdgeIds.splice(index, 1);
      this.graph.render.getEdgeRenderer()?.setEdgeSelected(edgeId, false);
    }
  }
  
  private clearAllEdgeSelections(): void {
    for (const edgeId of this.selectedEdgeIds) {
      this.graph.render.getEdgeRenderer()?.setEdgeSelected(edgeId, false);
    }
    this.selectedEdgeIds = [];
  }
}
