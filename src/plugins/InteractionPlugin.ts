import { createGesture, Gestures } from '@use-gesture/vanilla';
import * as THREE from 'three';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { InteractionLogic } from '../InteractionLogic';
import { DragState, WheelState, HoverState, ClickState } from '../types/use-gesture';

/**
 * A plugin that handles user interactions with the graph, such as clicking, dragging, and hovering.
 */
export class InteractionPlugin implements ISpaceGraphPlugin {
  private graph!: SpaceGraph;
  private gesture!: Gestures;
  private dragPlane!: THREE.Plane;
  private draggedElementId: string | null = null;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    const rendererEl = this.graph.renderingManager.getRendererDomElement();
    this.dragPlane = new THREE.Plane();

    this.gesture = createGesture({
      onDrag: (state) => this.onDrag(state),
      onHover: (state) => this.onHover(state),
      onClick: (state) => this.onClick(state),
      onWheel: (state) => this.onWheel(state),
    }, {
      target: rendererEl,
      eventOptions: { passive: false },
    });
  }

  private getIntersectedElement(event: MouseEvent | PointerEvent) {
    const renderer = this.graph.renderingManager.getRenderer();
    const camera = this.graph.renderingManager.getCamera();
    const nodeRenderer = this.graph.renderingManager.getNodeRenderer();

    if (!nodeRenderer) return null;

    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(nodeRenderer.getRaycastableObjects(), true);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const elementId = nodeRenderer.getNodeIdFromIntersection(intersects[0]);
      if (elementId) {
        return this.graph.dataManager.getElement(elementId);
      }
    }

    return null;
  }

  private onDrag(state: DragState) {
    const { event, first, last, movement: [mx, my], xy: [vx, vy], pinching } = state;
    if (pinching) return;

    const camera = this.graph.renderingManager.getCamera();

    if (first) {
      const intersectedElement = this.getIntersectedElement(event as PointerEvent);
      if (intersectedElement && 'position' in intersectedElement) {
        this.draggedElementId = intersectedElement.id;
        // Project the drag plane
        const normal = camera.position.clone().normalize();
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(intersectedElement.position.x, intersectedElement.position.y, intersectedElement.position.z));
      }
    }

    if (this.draggedElementId) {
      InteractionLogic.handleNodeDrag(vx, vy, this.draggedElementId, this.dragPlane, this.graph.renderingManager.getRendererDomElement(), camera, this.graph.updateState);
    } else {
      // Panning
      InteractionLogic.handlePan(mx, my, this.graph.state, this.graph.updateState, camera);
    }

    if (last) {
      this.draggedElementId = null;
    }
  }

  private onWheel(state: WheelState) {
    const { event, delta: [, dy] } = state;
    event.preventDefault();
    const zoomSpeed = 0.1;
    const direction = dy > 0 ? 'out' : 'in';
    InteractionLogic.handleKeyZoom(this.graph.state, this.graph.updateState, direction, zoomSpeed);
  }

  private onHover(state: HoverState) {
    if (this.draggedElementId) return; // Don't hover while dragging
    const element = this.getIntersectedElement(state.event as MouseEvent);
    const currentHoveredId = this.graph.state.interaction?.hoveredElementId ?? null;

    if (element) {
      if (currentHoveredId !== element.id) {
        this.graph.updateState({ interaction: { hoveredElementId: element.id } });
        this.graph.eventManager.emit('element:hover:enter', { target: element });
      }
    } else if (currentHoveredId) {
      const oldElement = this.graph.dataManager.getElement(currentHoveredId);
      this.graph.updateState({ interaction: { hoveredElementId: null } });
      if(oldElement) this.graph.eventManager.emit('element:hover:leave', { target: oldElement });
    }
  }

  private onClick(state: ClickState) {
    const element = this.getIntersectedElement(state.event as PointerEvent);
    if (element) {
      this.graph.eventManager.emit('element:click', { target: element });
    } else {
      this.graph.eventManager.emit('background:click', {});
    }
  }

  public dispose(): void {
    this.gesture.destroy();
  }
}
