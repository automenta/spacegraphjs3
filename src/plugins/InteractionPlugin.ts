import { Gesture } from '@use-gesture/vanilla';
import * as THREE from 'three';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraphCore } from '../core/SpaceGraphCore';
import { InteractionLogic } from '../InteractionLogic';
import { DragState, HoverState, WheelState } from '../types/use-gesture';
import { EdgeSpec, GroupSpec, NodeSpec } from '../types';
import { ContextMenuManager } from '../utils/ContextMenuManager';
import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * A plugin that handles user interactions with the graph, such as clicking, dragging, and hovering.
 */
export class InteractionPlugin implements ISpaceGraphPlugin {
  readonly id = 'interaction-plugin';
  readonly name = 'Interaction Plugin';
  readonly version = '1.0.0';
  readonly description =
    'Handles user interactions with the graph, such as clicking, dragging, and hovering.';

  private graph!: SpaceGraphCore;
  private gesture: Gesture | null = null;
  private dragPlane!: THREE.Plane;
  private draggedElementId: string | null = null;
  private draggedGroupId: string | null = null; // For group dragging
  private hoveredEdgeId: string | null = null;
  private selectedEdgeIds: string[] = [];
  private edgeEditHandles: Map<string, THREE.Object3D[]> = new Map();
  private boundOnClick!: (event: PointerEvent) => void;
  private boundOnContextMenu!: (event: PointerEvent) => void;
  private rendererEl!: HTMLElement;
  private dragStartPosition: THREE.Vector3 | null = null;
  private isDragging: boolean = false;
  private dragIndicator: THREE.Mesh | null = null;
  private snapToGrid: boolean = false;
  private gridSize: number = 1.0;
  private contextMenuManager: ContextMenuManager = new ContextMenuManager();
  private groupVisualizations: Map<string, THREE.Group> = new Map(); // Visual representations of groups
  private errorHandler: ErrorHandler = ErrorHandler.getInstance();

  public init(graph: SpaceGraphCore): void {
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
      {
        drag: {
          filterTaps: true,
          preventDefault: true,
          pointer: { capture: true },
          eventOptions: { passive: false },
        },
        hover: {
          enabled: true,
        },
        wheel: {
          preventDefault: true,
          eventOptions: { passive: false },
        },
      }
    );

    this.boundOnClick = this.onClick.bind(this) as unknown as (
      event: PointerEvent
    ) => void;
    this.boundOnContextMenu = this.onContextMenu.bind(this) as unknown as (
      event: PointerEvent
    ) => void;
    this.rendererEl.addEventListener(
      'click',
      this.boundOnClick as EventListener,
      { passive: false }
    );
    this.rendererEl.addEventListener(
      'contextmenu',
      this.boundOnContextMenu as EventListener,
      { passive: false }
    );

    this.graph.events.on('element:click', ({ target, event }) => {
      // Only handle node and edge clicks, not groups
      if (!('position' in target) && !('source' in target)) return;

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

  /**
   * Create a visual indicator for node dragging
   * @param position - The position to create the indicator at
   */
  private createDragIndicator(position: THREE.Vector3): void {
    // Remove existing indicator if any
    if (this.dragIndicator) {
      try {
        this.graph.render.getScene()?.remove(this.dragIndicator);
      } catch (e) {
        // Ignore errors in case scene is not available
        this.errorHandler.handleWarning(
          'InteractionPlugin',
          'Scene not available for drag indicator removal',
          e
        );
      }
    }

    // Create a ring geometry to indicate dragging
    const geometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    this.dragIndicator = new THREE.Mesh(geometry, material);
    this.dragIndicator.position.copy(position);
    this.dragIndicator.rotation.x = Math.PI / 2; // Orient to face camera

    // Add to scene if available
    try {
      this.graph.render.getScene()?.add(this.dragIndicator);
    } catch (e) {
      // Ignore errors in case scene is not available (e.g., in tests)
      this.errorHandler.handleWarning(
        'InteractionPlugin',
        'Scene not available for drag indicator addition',
        e
      );
    }
  }

  /**
   * Update the drag indicator position
   * @param position - The new position for the indicator
   */
  private updateDragIndicator(position: THREE.Vector3): void {
    if (this.dragIndicator) {
      this.dragIndicator.position.copy(position);
    }
  }

  /**
   * Remove the drag indicator
   */
  private removeDragIndicator(): void {
    if (this.dragIndicator) {
      try {
        this.graph.render.getScene()?.remove(this.dragIndicator);
      } catch (e) {
        // Ignore errors in case scene is not available
        this.errorHandler.handleWarning(
          'InteractionPlugin',
          'Scene not available for drag indicator removal',
          e
        );
      }
      this.dragIndicator = null;
    }
  }

  /**
   * Move an entire group of nodes
   * @param groupId - The ID of the group to move
   * @param vx - The x coordinate of the drag
   * @param vy - The y coordinate of the drag
   * @param camera - The camera object
   */
  private moveGroup(
    groupId: string,
    vx: number,
    vy: number,
    camera: THREE.PerspectiveCamera
  ): void {
    // Get the group
    const group = this.graph.dataManager.getGroup(groupId);
    if (!group) return;

    // Get all nodes in the group
    const nodesInGroup = group.nodes
      .map((nodeId) => this.graph.dataManager.getNode(nodeId))
      .filter((node) => node !== undefined) as NodeSpec[];

    if (nodesInGroup.length === 0) return;

    // Calculate the center of the group
    const center = new THREE.Vector3();
    nodesInGroup.forEach((node) => {
      if (node.position) {
        center.add(
          new THREE.Vector3(node.position.x, node.position.y, node.position.z)
        );
      }
    });
    center.divideScalar(nodesInGroup.length);

    // Create a drag plane at the group center
    const normal = camera.position.clone().normalize();
    this.dragPlane.setFromNormalAndCoplanarPoint(normal, center);

    // Handle the drag for all nodes in the group
    InteractionLogic.handleNodeDrag(
      vx,
      vy,
      nodesInGroup[0].id, // Use first node ID as reference for the drag logic
      this.dragPlane,
      this.graph.render.getRendererDomElement(),
      camera,
      (spec) => {
        // Apply the same movement to all nodes in the group
        if (spec.data?.nodes?.update) {
          const updates = spec.data.nodes.update.flatMap((update) => {
            // For each updated node, create updates for all nodes in the group
            return nodesInGroup.map((node) => {
              // Calculate the offset from the reference node
              const referenceNode = nodesInGroup[0];
              if (referenceNode.position && node.position) {
                const offsetX =
                  (update.position?.x || referenceNode.position.x) -
                  referenceNode.position.x;
                const offsetY =
                  (update.position?.y || referenceNode.position.y) -
                  referenceNode.position.y;
                const offsetZ =
                  (update.position?.z || referenceNode.position.z) -
                  referenceNode.position.z;

                return {
                  id: node.id,
                  position: {
                    x: node.position.x + offsetX,
                    y: node.position.y + offsetY,
                    z: node.position.z + offsetZ,
                  },
                };
              }
              return {
                id: node.id,
                position: node.position,
              };
            });
          });

          this.graph.update({
            data: {
              nodes: {
                update: updates,
              },
            },
          });
        }
      }
    );

    // Update group visualization
    this.updateGroupVisualization(groupId);
  }

  /**
   * Create a visual representation of a group
   * @param groupId - The ID of the group to visualize
   */
  private createGroupVisualization(groupId: string): void {
    // Remove existing visualization if any
    this.removeGroupVisualization(groupId);

    // Get the group
    const group = this.graph.dataManager.getGroup(groupId);
    if (!group) return;

    // Get all nodes in the group
    const nodesInGroup = group.nodes
      .map((nodeId) => this.graph.dataManager.getNode(nodeId))
      .filter((node) => node !== undefined) as NodeSpec[];

    if (nodesInGroup.length === 0) return;

    // Calculate bounding box of the group
    const bbox = new THREE.Box3();
    nodesInGroup.forEach((node) => {
      if (node.position) {
        const pos = new THREE.Vector3(
          node.position.x,
          node.position.y,
          node.position.z
        );
        bbox.expandByPoint(pos);
      }
    });

    // Create a wireframe box to represent the group
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());

    const geometry = new THREE.BoxGeometry(size.x + 2, size.y + 2, size.z + 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    const groupVisualization = new THREE.Group();
    const box = new THREE.Mesh(geometry, material);
    groupVisualization.add(box);
    groupVisualization.position.copy(center);
    groupVisualization.userData = { groupId, isGroupVisualization: true };

    // Add to scene
    try {
      this.graph.render.getScene()?.add(groupVisualization);
      this.groupVisualizations.set(groupId, groupVisualization);
    } catch (e) {
      // Ignore errors in case scene is not available
      this.errorHandler.handleWarning(
        'InteractionPlugin',
        'Scene not available for group visualization addition',
        e
      );
    }
  }

  /**
   * Update the visual representation of a group
   * @param groupId - The ID of the group to update
   */
  private updateGroupVisualization(groupId: string): void {
    // Remove existing visualization
    this.removeGroupVisualization(groupId);

    // Create new visualization
    this.createGroupVisualization(groupId);
  }

  /**
   * Remove the visual representation of a group
   * @param groupId - The ID of the group to remove visualization for
   */
  private removeGroupVisualization(groupId: string): void {
    const visualization = this.groupVisualizations.get(groupId);
    if (visualization) {
      try {
        this.graph.render.getScene()?.remove(visualization);
      } catch (e) {
        // Ignore errors in case scene is not available
        this.errorHandler.handleWarning(
          'InteractionPlugin',
          'Scene not available for group visualization removal',
          e
        );
      }
      this.groupVisualizations.delete(groupId);
    }
  }

  /**
   * Clear all group visualizations
   */
  private clearAllGroupVisualizations(): void {
    for (const groupId of this.groupVisualizations.keys()) {
      this.removeGroupVisualization(groupId);
    }
  }

  /**
   * Create a new group from selected nodes
   * @param name - The name of the group
   */
  public createGroup(name?: string): void {
    const selectedNodeIds =
      this.graph.state.interaction?.selectedElementIds ?? [];
    if (selectedNodeIds.length === 0) return;

    // Filter to only include node IDs (not edge IDs)
    const nodeIds = selectedNodeIds.filter((id) => {
      const element = this.graph.dataManager.getElement(id);
      return element && 'position' in element;
    });

    if (nodeIds.length === 0) return;

    // Create a new group
    const groupId = `group-${Date.now()}`;
    const group: GroupSpec = {
      id: groupId,
      name: name || `Group ${groupId}`,
      nodes: nodeIds,
    };

    // Update the graph state
    this.graph.update({
      data: {
        groups: {
          add: [group],
        },
        nodes: {
          update: nodeIds.map((id) => ({
            id,
            groupId,
          })),
        },
      },
    });

    // Create visualization for the group
    this.createGroupVisualization(groupId);
  }

  /**
   * Add nodes to an existing group
   * @param groupId - The ID of the group to add nodes to
   */
  public addNodesToGroup(groupId: string): void {
    const selectedNodeIds =
      this.graph.state.interaction?.selectedElementIds ?? [];
    if (selectedNodeIds.length === 0) return;

    // Filter to only include node IDs (not edge IDs)
    const nodeIds = selectedNodeIds.filter((id) => {
      const element = this.graph.dataManager.getElement(id);
      return element && 'position' in element;
    });

    if (nodeIds.length === 0) return;

    // Update the graph state
    this.graph.update({
      data: {
        groups: {
          update: [
            {
              id: groupId,
              nodes: [
                ...(this.graph.state.data.groups?.find((g) => g.id === groupId)
                  ?.nodes || []),
                ...nodeIds,
              ],
            },
          ],
        },
        nodes: {
          update: nodeIds.map((id) => ({
            id,
            groupId,
          })),
        },
      },
    });

    // Update visualization for the group
    this.updateGroupVisualization(groupId);
  }

  /**
   * Remove nodes from a group
   * @param groupId - The ID of the group to remove nodes from
   * @param nodeIds - The IDs of the nodes to remove
   */
  public removeNodesFromGroup(groupId: string, nodeIds: string[]): void {
    // Update the graph state
    const currentGroup = this.graph.state.data.groups?.find(
      (g) => g.id === groupId
    );
    if (!currentGroup) return;

    const updatedNodes = currentGroup.nodes.filter(
      (id) => !nodeIds.includes(id)
    );

    this.graph.update({
      data: {
        groups: {
          update: [
            {
              id: groupId,
              nodes: updatedNodes,
            },
          ],
        },
        nodes: {
          update: nodeIds.map((id) => ({
            id,
            groupId: undefined,
          })),
        },
      },
    });

    // Update visualization for the group
    this.updateGroupVisualization(groupId);
  }

  /**
   * Dissolve a group (remove the group but keep the nodes)
   * @param groupId - The ID of the group to dissolve
   */
  public dissolveGroup(groupId: string): void {
    const group = this.graph.state.data.groups?.find((g) => g.id === groupId);
    if (!group) return;

    // Remove the group and clear groupId from all nodes
    this.graph.update({
      data: {
        groups: {
          remove: [groupId],
        },
        nodes: {
          update: group.nodes.map((id) => ({
            id,
            groupId: undefined,
          })),
        },
      },
    });

    // Remove visualization for the group
    this.removeGroupVisualization(groupId);
  }

  /**
   * Enable or disable snap-to-grid functionality
   * @param enabled - Whether to enable snapping
   * @param gridSize - The size of the grid cells
   */
  public setSnapToGrid(enabled: boolean, gridSize: number = 1.0): void {
    this.snapToGrid = enabled;
    this.gridSize = gridSize;
  }

  /**
   * Snap a position to the grid
   * @param position - The position to snap
   * @returns The snapped position
   */
  private snapPosition(position: THREE.Vector3): THREE.Vector3 {
    if (!this.snapToGrid) return position;

    return new THREE.Vector3(
      Math.round(position.x / this.gridSize) * this.gridSize,
      Math.round(position.y / this.gridSize) * this.gridSize,
      Math.round(position.z / this.gridSize) * this.gridSize
    );
  }

  public dispose(): void {
    if (this.gesture) {
      this.gesture.destroy();
    }
    this.rendererEl.removeEventListener(
      'click',
      this.boundOnClick as EventListener
    );
    this.rendererEl.removeEventListener(
      'contextmenu',
      this.boundOnContextMenu as EventListener
    );
    this.contextMenuManager.hideContextMenu();
    this.clearAllEdgeEditHandles();
    this.clearAllGroupVisualizations();
  }

  private getIntersectedElement(event: MouseEvent | PointerEvent) {
    const renderer = this.graph.render.getRenderer();
    const camera = this.graph.render.getCamera();
    const nodeRenderer = this.graph.render.getNodeRenderer();
    const edgeRenderer = this.graph.render.getEdgeRenderer();

    if (!nodeRenderer) {
      return null;
    }

    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);

    // Increase raycaster precision for better intersection detection
    raycaster.params.Line!.threshold = 0.1;
    raycaster.params.Points!.threshold = 0.1;

    // First check for edge edit handles (they might be closer)
    if (edgeRenderer) {
      const handleIntersects = raycaster.intersectObjects(
        edgeRenderer.getEdgeEditHandles(),
        true // Changed to true for recursive intersection
      );

      if (handleIntersects.length > 0) {
        const handle = handleIntersects[0].object;
        const edgeId = handle.userData.edgeId;
        const edge = this.graph.dataManager.getEdge(edgeId);
        if (edge) {
          const sourceNode = this.graph.dataManager.getNode(edge.source);
          const targetNode = this.graph.dataManager.getNode(edge.target);

          if (sourceNode && targetNode) {
            return {
              type: 'edge-handle',
              edge,
              sourceNode,
              targetNode,
              handle,
            };
          }
        }
      }

      // Then check for edge intersections
      const edgeIntersects = raycaster.intersectObjects(
        edgeRenderer.getRaycastableObjects(),
        true // Changed to true for recursive intersection
      );

      const topEdgeHit = edgeIntersects.find(
        (hit) => hit.object.userData.edgeId && hit.object.userData.isHitArea
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
      const intersects = raycaster.intersectObject(object, true); // Changed to true for recursive intersection
      if (intersects.length > 0) {
        allIntersects.push(...intersects);
      }
    }

    if (allIntersects.length > 0) {
      allIntersects.sort((a, b) => a.distance - b.distance);
      // Try each intersection until we find a valid element
      for (const intersection of allIntersects) {
        const elementId = nodeRenderer.getNodeIdFromIntersection(intersection);
        if (elementId) {
          const element = this.graph.dataManager.getElement(elementId);
          if (element) {
            return { type: 'node', element };
          }
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
      // console.log('Starting drag operation');
      const intersected = this.getIntersectedElement(event as PointerEvent);

      if (
        intersected &&
        intersected.type === 'node' &&
        intersected.element &&
        'position' in intersected.element &&
        intersected.element.position
      ) {
        // console.log('Starting drag on node:', intersected.element.id);
        this.draggedElementId = intersected.element.id;
        this.isDragging = true;
        // Store the initial position for visual feedback
        this.dragStartPosition = new THREE.Vector3(
          intersected.element.position.x,
          intersected.element.position.y,
          intersected.element.position.z
        );
        // Project the drag plane
        const normal = camera.position.clone().normalize();
        this.dragPlane.setFromNormalAndCoplanarPoint(
          normal,
          this.dragStartPosition
        );

        // Emit drag start event for visual feedback
        // Only emit event for nodes and edges, not groups
        if (
          ('position' in intersected.element &&
            'type' in intersected.element) ||
          ('source' in intersected.element && 'target' in intersected.element)
        ) {
          this.graph.events.emit('element:drag:start', {
            target: intersected.element as NodeSpec,
            startPosition: this.dragStartPosition.clone(),
          });
        }
      } else if (intersected && intersected.type === 'edge-handle') {
        // Handle edge editing
        // console.log('Starting drag on edge handle:', intersected.edge!.id);
        this.draggedElementId = intersected.edge!.id;
        this.isDragging = true;
        // Store the initial position for visual feedback
        this.dragStartPosition = intersected.handle!.position.clone();
        // Project the drag plane
        const normal = camera.position.clone().normalize();
        this.dragPlane.setFromNormalAndCoplanarPoint(
          normal,
          this.dragStartPosition
        );
      } else {
        // console.log('No intersected element found for drag start');
      }
    }

    if (this.draggedElementId) {
      // Handle node dragging with visual feedback
      const element = this.graph.dataManager.getElement(this.draggedElementId);
      if (element && 'position' in element) {
        // console.log('Dragging node:', this.draggedElementId);
        // Check if this node belongs to a group
        const node = element as NodeSpec;
        if (node.groupId) {
          // Move the entire group
          // console.log('Moving group:', node.groupId);
          this.moveGroup(node.groupId, vx, vy, camera);
        } else {
          // Move individual node
          // Create/update drag indicator
          if (!this.dragIndicator) {
            this.createDragIndicator(
              new THREE.Vector3(
                element.position?.x || 0,
                element.position?.y || 0,
                element.position?.z || 0
              )
            );
          }

          // Handle the drag
          // console.log('Calling InteractionLogic.handleNodeDrag');
          InteractionLogic.handleNodeDrag(
            vx,
            vy,
            this.draggedElementId,
            this.dragPlane,
            this.graph.render.getRendererDomElement(),
            camera,
            (spec) => {
              // console.log('Updating node position with spec:', spec);
              // If snap-to-grid is enabled, modify the position
              if (this.snapToGrid && spec.data?.nodes?.update) {
                const updates = spec.data.nodes.update.map((update) => {
                  if (update.id === this.draggedElementId && update.position) {
                    const snappedPosition = this.snapPosition(
                      new THREE.Vector3(
                        update.position.x,
                        update.position.y,
                        update.position.z
                      )
                    );
                    return {
                      ...update,
                      position: {
                        x: snappedPosition.x,
                        y: snappedPosition.y,
                        z: snappedPosition.z,
                      },
                    };
                  }
                  return update;
                });

                this.graph.update({
                  data: {
                    nodes: {
                      update: updates,
                    },
                  },
                });
              } else {
                this.graph.update(spec);
              }
            }
          );

          // Update drag indicator position
          if (this.dragIndicator) {
            const updatedElement = this.graph.dataManager.getElement(
              this.draggedElementId
            );
            if (updatedElement && 'position' in updatedElement) {
              const newPosition = new THREE.Vector3(
                updatedElement.position?.x || 0,
                updatedElement.position?.y || 0,
                updatedElement.position?.z || 0
              );
              this.updateDragIndicator(newPosition);
            }
          }
        }
      } else {
        // Handle edge editing
        // console.log('Dragging edge:', this.draggedElementId);
        const edge = this.graph.dataManager.getEdge(this.draggedElementId);
        if (edge && edge.type === 'curved') {
          // Calculate new position based on drag
          const worldPosition = new THREE.Vector3();
          const mouse = new THREE.Vector2(
            (vx / this.graph.render.getRendererDomElement().clientWidth) * 2 -
              1,
            -(vy / this.graph.render.getRendererDomElement().clientHeight) * 2 +
              1
          );

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);

          // Find intersection with drag plane
          raycaster.ray.intersectPlane(this.dragPlane, worldPosition);

          // Update edge curvature based on handle position
          const sourceNode = this.graph.dataManager.getNode(edge.source);
          const targetNode = this.graph.dataManager.getNode(edge.target);

          if (sourceNode && targetNode) {
            const sourcePos = new THREE.Vector3(
              sourceNode.position?.x || 0,
              sourceNode.position?.y || 0,
              sourceNode.position?.z || 0
            );

            const targetPos = new THREE.Vector3(
              targetNode.position?.x || 0,
              targetNode.position?.y || 0,
              targetNode.position?.z || 0
            );

            // Calculate new curvature based on handle position
            const midPoint = new THREE.Vector3().lerpVectors(
              sourcePos,
              targetPos,
              0.5
            );
            const direction = new THREE.Vector3()
              .subVectors(targetPos, sourcePos)
              .normalize();
            const perpendicular = new THREE.Vector3(
              -direction.z,
              0,
              direction.x
            ).normalize();
            const distance = sourcePos.distanceTo(targetPos);
            const offset = new THREE.Vector3().subVectors(
              worldPosition,
              midPoint
            );
            const curvature = offset.dot(perpendicular) / (distance * 0.5);

            // Update edge with new curvature
            this.graph.update({
              data: {
                edges: {
                  update: [
                    {
                      id: edge.id,
                      curvature: Math.max(0, Math.min(1, curvature)), // Clamp between 0 and 1
                    },
                  ],
                },
              },
            });
          }
        }
      }
    } else {
      // Panning
      // console.log('Panning');
      InteractionLogic.handlePan(
        mx,
        my,
        this.graph.state,
        (spec) => this.graph.update(spec),
        camera
      );
    }

    if (last) {
      // console.log('Ending drag operation');
      if (this.draggedElementId && this.dragStartPosition) {
        const element = this.graph.dataManager.getElement(
          this.draggedElementId
        );
        if (element && 'position' in element) {
          // Emit drag end event for visual feedback
          this.graph.events.emit('element:drag:end', {
            target: element as NodeSpec,
            startPosition: this.dragStartPosition.clone(),
            endPosition: new THREE.Vector3(
              (element as NodeSpec).position?.x || 0,
              (element as NodeSpec).position?.y || 0,
              (element as NodeSpec).position?.z || 0
            ),
          });
        }
      }
      // Remove drag indicator
      this.removeDragIndicator();
      this.draggedElementId = null;
      this.isDragging = false;
      this.dragStartPosition = null;
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
    if (
      intersected &&
      (intersected.type === 'edge' || intersected.type === 'edge-handle')
    ) {
      const edgeId = intersected.edge!.id;

      // Handle edge hover enter
      if (
        this.hoveredEdgeId !== edgeId &&
        intersected.edge &&
        intersected.sourceNode &&
        intersected.targetNode
      ) {
        // Handle edge hover leave for previous edge
        if (this.hoveredEdgeId) {
          const prevEdge = this.graph.dataManager.getEdge(this.hoveredEdgeId);
          if (prevEdge) {
            const sourceNode = this.graph.dataManager.getNode(prevEdge.source);
            const targetNode = this.graph.dataManager.getNode(prevEdge.target);

            if (sourceNode && targetNode) {
              this.graph.render
                .getEdgeRenderer()
                ?.setEdgeHover(this.hoveredEdgeId, false);
              this.graph.events.emit('edge:hover:leave', {
                target: prevEdge,
                sourceNode,
                targetNode,
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
          targetNode: intersected.targetNode,
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
            this.graph.render
              .getEdgeRenderer()
              ?.setEdgeHover(this.hoveredEdgeId, false);
            this.graph.events.emit('edge:hover:leave', {
              target: prevEdge,
              sourceNode,
              targetNode,
            });
          }
        }
        this.hoveredEdgeId = null;
      }

      // Handle node hover
      const element =
        intersected && intersected.type === 'node' ? intersected.element : null;

      if (element) {
        if (currentHoveredId !== element.id) {
          this.graph.update({
            interaction: { hoveredElementId: element.id },
          });
          this.graph.events.emit('element:hover:enter', {
            target: element as NodeSpec | EdgeSpec,
          });
        }
      } else if (currentHoveredId) {
        const oldElement = this.graph.dataManager.getElement(currentHoveredId);
        this.graph.update({ interaction: { hoveredElementId: null } });
        if (oldElement)
          this.graph.events.emit('element:hover:leave', {
            target: oldElement as NodeSpec | EdgeSpec,
          });
      }
    }
  }

  private onClick(event: PointerEvent) {
    const intersected = this.getIntersectedElement(event);

    if (intersected) {
      if (
        (intersected.type === 'edge' || intersected.type === 'edge-handle') &&
        intersected.edge &&
        intersected.sourceNode &&
        intersected.targetNode
      ) {
        // Handle edge click
        this.handleEdgeClick(
          intersected.edge,
          intersected.sourceNode,
          intersected.targetNode,
          event
        );
      } else if (intersected.type === 'node' && intersected.element) {
        // Handle node click
        this.graph.events.emit('element:click', {
          target: intersected.element as NodeSpec | EdgeSpec,
          event,
        });
      } else {
        this.graph.events.emit('background:click', { event });
      }
    } else {
      this.graph.events.emit('background:click', { event });
    }
  }

  private onContextMenu(event: PointerEvent) {
    event.preventDefault();
    const intersected = this.getIntersectedElement(event);

    if (
      intersected &&
      (intersected.type === 'edge' || intersected.type === 'edge-handle') &&
      intersected.edge &&
      intersected.sourceNode &&
      intersected.targetNode
    ) {
      // Handle edge context menu
      this.showEdgeContextMenu(
        event.clientX,
        event.clientY,
        intersected.edge,
        intersected.sourceNode,
        intersected.targetNode
      );
    } else if (
      intersected &&
      intersected.type === 'node' &&
      intersected.element
    ) {
      // Handle node context menu
      this.showNodeContextMenu(
        event.clientX,
        event.clientY,
        intersected.element as NodeSpec
      );
    } else {
      // Handle background context menu
      this.showBackgroundContextMenu(event.clientX, event.clientY);
    }
  }

  private showEdgeContextMenu(
    x: number,
    y: number,
    edge: EdgeSpec,
    sourceNode: NodeSpec,
    targetNode: NodeSpec
  ) {
    this.contextMenuManager.showEdgeContextMenu(
      x,
      y,
      edge,
      sourceNode,
      targetNode,
      {
        selectEdge: (edgeId) => this.selectEdge(edgeId),
        deleteEdge: (edgeId) => this.deleteEdge(edgeId),
        editEdgeLabel: (edgeId) => this.editEdgeLabel(edgeId),
        reverseEdgeDirection: (edgeId) => this.reverseEdgeDirection(edgeId),
        highlightPath: (edgeId) => this.highlightPath(edgeId),
        editEdgePath: (edgeId) => this.editEdgePath(edgeId),
      }
    );
  }

  private showNodeContextMenu(x: number, y: number, node: NodeSpec) {
    this.contextMenuManager.showNodeContextMenu(x, y, node, {
      selectNode: (nodeId) => this.selectNode(nodeId),
      deleteNode: (nodeId) => this.deleteNode(nodeId),
      editNodeLabel: (nodeId) => this.editNodeLabel(nodeId),
      addNodeConnection: (nodeId) => this.addNodeConnection(nodeId),
      createGroup: () => this.createGroup(),
      addToGroup: (nodeId) => this.addToGroup(nodeId),
    });
  }

  private showBackgroundContextMenu(x: number, y: number) {
    this.contextMenuManager.showBackgroundContextMenu(x, y, {
      addNodeAtPosition: (x, y) => this.addNodeAtPosition(x, y),
      selectAll: () => this.selectAll(),
      clearAllSelections: () => this.clearAllSelections(),
      resetView: () => this.resetView(),
    });
  }

  private hideContextMenu() {
    this.contextMenuManager.hideContextMenu();
  }

  private selectNode(nodeId: string) {
    const currentSelection =
      this.graph.state.interaction?.selectedElementIds ?? [];
    if (!currentSelection.includes(nodeId)) {
      this.graph.update({
        interaction: { selectedElementIds: [...currentSelection, nodeId] },
      });
    }
  }

  private deleteNode(nodeId: string) {
    // Update graph state to remove node
    this.graph.update({
      data: {
        nodes: {
          remove: [nodeId],
        },
      },
    });
  }

  private editNodeLabel(nodeId: string) {
    // For now, we'll just emit an event that can be handled by other components
    // Emit a standard event that's supported
    // For now, we'll just log to console as there's no specific event for this
    // console.log('Edit node label requested for node:', nodeId);
    // Intentionally unused parameter
    void nodeId;
  }

  private addNodeConnection(nodeId: string) {
    // For now, we'll just emit an event that can be handled by other components
    // Emit a standard event that's supported
    // For now, we'll just log to console as there's no specific event for this
    // console.log('Add connection requested for node:', nodeId);
    // Intentionally unused parameter
    void nodeId;
  }

  private findShortestPath(nodeId: string) {
    // For now, we'll just emit an event that can be handled by other components
    // Emit a standard event that's supported
    // For now, we'll just log to console as there's no specific event for this
    // console.log('Find shortest path requested for node:', nodeId);
    // Intentionally unused parameter
    void nodeId;
  }

  private addToGroup(nodeId: string) {
    // Get all available groups
    const groups = this.graph.state.data.groups || [];

    if (groups.length === 0) {
      // No groups exist, create a new one
      this.createGroup(`Group ${groups.length + 1}`);
      return;
    }

    // For now, we'll just add to the first group as an example
    // In a real implementation, this would show a dialog to select a group
    const firstGroupId = groups[0].id;
    this.addNodesToGroup(firstGroupId);
    // Intentionally unused parameter
    void nodeId;
  }

  private deleteEdge(edgeId: string) {
    // Update graph state to remove edge
    this.graph.update({
      data: {
        edges: {
          remove: [edgeId],
        },
      },
    });
  }

  private editEdgeLabel(edgeId: string) {
    // For now, we'll just emit an event that can be handled by other components
    // Emit a standard event that's supported
    // For now, we'll just log to console as there's no specific event for this
    // console.log('Edit edge label requested for edge:', edgeId);
    // Intentionally unused parameter
    void edgeId;
  }

  private reverseEdgeDirection(edgeId: string) {
    const edge = this.graph.dataManager.getEdge(edgeId);
    if (edge) {
      // Update edge with reversed source/target
      this.graph.update({
        data: {
          edges: {
            update: [
              {
                id: edgeId,
                source: edge.target,
                target: edge.source,
              },
            ],
          },
        },
      });
    }
  }

  private highlightPath(edgeId: string) {
    // For now, we'll just emit an event that can be handled by other components
    // Emit a standard event that's supported
    // For now, we'll just log to console as there's no specific event for this
    // console.log('Highlight path requested for edge:', edgeId);
    // Intentionally unused parameter
    void edgeId;
  }

  private addNodeAtPosition(x: number, y: number) {
    // Convert screen coordinates to world coordinates
    const camera = this.graph.render.getCamera();
    const renderer = this.graph.render.getRenderer();
    const rect = renderer.domElement.getBoundingClientRect();

    const mouse = new THREE.Vector2();
    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Create a plane at y=0 to intersect with
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Emit event for adding node at position
    // Emit a standard event that's supported
    // For now, we'll just log to console as there's no specific event for this
    // console.log('Add node at position requested at:', { x, y });
  }

  private selectAll() {
    // Get all node IDs from the current state
    const allNodeIds = this.graph.state.data.nodes.map((node) => node.id);
    this.graph.update({
      interaction: { selectedElementIds: allNodeIds },
    });
  }

  private clearAllSelections() {
    this.clearAllEdgeSelections();
    this.graph.update({
      interaction: { selectedElementIds: [] },
    });
  }

  private resetView() {
    this.graph.update({
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: Math.PI / 4,
        theta: Math.PI / 4,
        distance: 50,
      },
    });
  }

  private handleEdgeClick(
    edge: EdgeSpec,
    sourceNode: NodeSpec,
    targetNode: NodeSpec,
    event: PointerEvent
  ): void {
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
      targetNode,
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
            targetNode,
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

  private editEdgePath(edgeId: string) {
    // Toggle edge editing mode
    const edge = this.graph.dataManager.getEdge(edgeId);
    if (edge && edge.type === 'curved') {
      const edgeRenderer = this.graph.render.getEdgeRenderer();
      if (edgeRenderer) {
        // Check if edge is already in editing mode
        const isEditing = this.selectedEdgeIds.includes(edgeId);

        if (isEditing) {
          // Exit editing mode
          edgeRenderer.setEdgeEditing(edgeId, false);
        } else {
          // Enter editing mode
          edgeRenderer.setEdgeEditing(edgeId, true);
        }
      }
    }
  }

  private showEdgeEditHandles(edgeId: string) {
    const edge = this.graph.dataManager.getEdge(edgeId);
    if (!edge || edge.type !== 'curved') return;

    // Clear any existing handles
    this.clearEdgeEditHandles(edgeId);

    const sourceNode = this.graph.dataManager.getNode(edge.source);
    const targetNode = this.graph.dataManager.getNode(edge.target);

    if (!sourceNode || !targetNode) return;

    const scene = this.graph.render.getScene();
    if (!scene) return;

    const handles: THREE.Object3D[] = [];

    // Create control points for editing the curve
    const sourcePos = new THREE.Vector3(
      sourceNode.position?.x || 0,
      sourceNode.position?.y || 0,
      sourceNode.position?.z || 0
    );

    const targetPos = new THREE.Vector3(
      targetNode.position?.x || 0,
      targetNode.position?.y || 0,
      targetNode.position?.z || 0
    );

    // Create a handle at the midpoint of the curve
    const midPoint = new THREE.Vector3().lerpVectors(sourcePos, targetPos, 0.5);

    // Adjust position based on current curvature
    if (edge.curvature) {
      const direction = new THREE.Vector3()
        .subVectors(targetPos, sourcePos)
        .normalize();
      const perpendicular = new THREE.Vector3(
        -direction.z,
        0,
        direction.x
      ).normalize();
      midPoint.add(
        perpendicular.multiplyScalar(
          edge.curvature * sourcePos.distanceTo(targetPos) * 0.5
        )
      );
    }

    const handleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const handleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.copy(midPoint);
    handle.userData = { edgeId, type: 'curveHandle' };

    scene.add(handle);
    handles.push(handle);

    // Store handles for this edge
    this.edgeEditHandles.set(edgeId, handles);
  }

  private clearEdgeEditHandles(edgeId: string) {
    const handles = this.edgeEditHandles.get(edgeId);
    if (handles) {
      const scene = this.graph.render.getScene();
      if (scene) {
        handles.forEach((handle) => {
          scene.remove(handle);
        });
      }
      this.edgeEditHandles.delete(edgeId);
    }
  }

  private clearAllEdgeEditHandles() {
    for (const edgeId of this.edgeEditHandles.keys()) {
      this.clearEdgeEditHandles(edgeId);
    }
    this.edgeEditHandles.clear();
  }
}
