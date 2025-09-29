import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import { EdgeSpec, NodeSpec, Spec, EdgeStyle } from '../types';
import { expandHex } from '../utils/color';
import { EdgeLabel } from './EdgeLabel';
import { safeDisposeObject, safeDisposeGeometry, safeDisposeMaterial } from '../utils/threeUtils';

export class EdgeRenderer {
  private scene: THREE.Scene;
  private state: Store<Spec>;
  private lineObjects: Map<string, THREE.Line> = new Map();
  private hitAreaObjects: Map<string, THREE.Line> = new Map(); // For interaction
  private labelObjects: Map<string, EdgeLabel> = new Map();
  private edgeStates: Map<string, { hovered: boolean; selected: boolean }> = new Map();
  private edgeGeometries: Map<string, THREE.BufferGeometry> = new Map(); // Cache for edge geometries
  private edgePositions: Map<string, string> = new Map(); // Cache for edge positions to detect changes
  public lineSegments: THREE.LineSegments;
  private lineSegmentGeometry: THREE.BufferGeometry;
  private lineSegmentMaterial: THREE.LineBasicMaterial;
  private disposeEffect?: () => void;

  constructor(scene: THREE.Scene, state: Store<Spec>) {
    this.scene = scene;
    this.state = state;

    // Initialize line segments for compatibility with tests
    this.lineSegmentGeometry = new THREE.BufferGeometry();
    this.lineSegmentMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    this.lineSegments = new THREE.LineSegments(this.lineSegmentGeometry, this.lineSegmentMaterial);
    this.scene.add(this.lineSegments);

    this.disposeEffect = createEffect(() => {
      this.updateEdges().catch(error => {
        console.warn('Failed to update edges:', error);
      });
    }) as unknown as () => void;
    
    // Create another effect to update edges when interaction state changes
    createEffect(() => {
      // This will trigger when interaction state changes
      const selectedElements = this.state.interaction.selectedElementIds;
      const hoveredElement = this.state.interaction.hoveredElementId;
      
      // Update all edges to reflect potential style changes based on node selection
      this.updateEdges().catch(error => {
        console.warn('Failed to update edges on interaction change:', error);
      });
    });
  }

  public async updateEdges(
    nodes: NodeSpec[] = this.state.data.nodes,
    edges: EdgeSpec[] = this.state.data.edges
  ) {
    if (!nodes || !edges) {
      // Clear all edges if no data
      this.clearAllEdges();
      return;
    }

    const currentEdgeIds = new Set(edges.map(e => e.id));
    
    // Remove old edges
    for (const [id] of this.lineObjects.entries()) {
      if (!currentEdgeIds.has(id)) {
        this.removeEdge(id);
      }
    }

    // Add/update edges
    const updatePromises = edges.map(edge => this.updateEdge(edge, nodes));
    await Promise.all(updatePromises);

    // Update lineSegments for compatibility with tests
    this.updateLineSegments(nodes, edges);
  }

  private updateEdge(edge: EdgeSpec, nodes: NodeSpec[]): void {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;

    // Get edge state
    const edgeState = this.edgeStates.get(edge.id) || { hovered: false, selected: false };
    
    // Create a key representing the current edge positions and type
    const sourcePos = sourceNode.position || { x: 0, y: 0, z: 0 };
    const targetPos = targetNode.position || { x: 0, y: 0, z: 0 };
    const positionKey = `${sourcePos.x},${sourcePos.y},${sourcePos.z}|${targetPos.x},${targetPos.y},${targetPos.z}|${edge.type || 'straight'}|${edge.curvature || 0}|${edge.dashSize || 0}|${edge.gapSize || 0}`;
    
    // Check if we need to recreate the geometry
    let geometry = this.edgeGeometries.get(edge.id);
    const cachedPosition = this.edgePositions.get(edge.id);
    
    if (!geometry || cachedPosition !== positionKey) {
      // Dispose of old geometry if it exists
      if (geometry) {
        safeDisposeGeometry(geometry);
      }
      
      // Calculate new edge geometry
      geometry = this.createEdgeGeometry(edge, sourceNode, targetNode);
      this.edgeGeometries.set(edge.id, geometry);
      this.edgePositions.set(edge.id, positionKey);
    }
    
    // Create or update visual line
    if (!this.lineObjects.has(edge.id)) {
      this.createEdge(edge, geometry, edgeState);
    } else {
      this.updateEdgeVisuals(edge, geometry, edgeState);
    }

    // Create or update hit area for interaction
    this.updateEdgeHitArea(edge, geometry, sourceNode, targetNode);
    
    // Create or update label
    if (edge.label) {
      // We need to handle the async nature of label creation
      this.updateEdgeLabel(edge, sourceNode, targetNode).catch(error => {
        console.warn(`Failed to update edge label for edge ${edge.id}:`, error);
      });
    }
  }

  private createEdgeGeometry(edge: EdgeSpec, sourceNode: NodeSpec, targetNode: NodeSpec): THREE.BufferGeometry {
    const sourcePos = sourceNode.position || { x: 0, y: 0, z: 0 };
    const targetPos = targetNode.position || { x: 0, y: 0, z: 0 };
    
    switch (edge.type) {
      case 'curved':
        return this.createCurvedEdgeGeometry(sourcePos, targetPos, edge.curvature || 0.3);
      case 'dashed':
        return this.createDashedEdgeGeometry(sourcePos, targetPos, edge.dashSize || 0.5, edge.gapSize || 0.3);
      default:
        return this.createStraightEdgeGeometry(sourcePos, targetPos);
    }
  }

  private createStraightEdgeGeometry(source: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      source.x, source.y, source.z,
      target.x, target.y, target.z
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }

  private createCurvedEdgeGeometry(source: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }, curvature: number): THREE.BufferGeometry {
    const midPoint = new THREE.Vector3().addVectors(
      new THREE.Vector3(source.x, source.y, source.z),
      new THREE.Vector3(target.x, target.y, target.z)
    ).multiplyScalar(0.5);
    
    const direction = new THREE.Vector3().subVectors(
      new THREE.Vector3(target.x, target.y, target.z),
      new THREE.Vector3(source.x, source.y, source.z)
    ).normalize();
    
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    
    const curvePoint = midPoint.clone().add(
      perpendicular.multiplyScalar(curvature * new THREE.Vector3(source.x, source.y, source.z).distanceTo(new THREE.Vector3(target.x, target.y, target.z)) * 0.5)
    );
    
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(source.x, source.y, source.z),
      curvePoint,
      new THREE.Vector3(target.x, target.y, target.z)
    );
    
    return new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
  }

  private createDashedEdgeGeometry(source: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }, dashSize: number, gapSize: number): THREE.BufferGeometry {
    // For simplicity, we'll create a straight dashed line using a series of segments
    const start = new THREE.Vector3(source.x, source.y, source.z);
    const end = new THREE.Vector3(target.x, target.y, target.z);
    const distance = start.distanceTo(end);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    
    const positions: number[] = [];
    let currentPos = start.clone();
    let isDash = true;
    
    while (currentPos.distanceTo(start) < distance) {
      const segmentLength = isDash ? dashSize : gapSize;
      const nextPos = currentPos.clone().add(direction.clone().multiplyScalar(segmentLength));
      
      // Make sure we don't go past the end
      if (nextPos.distanceTo(start) > distance) {
        nextPos.copy(end);
      }
      
      if (isDash) {
        positions.push(currentPos.x, currentPos.y, currentPos.z);
        positions.push(nextPos.x, nextPos.y, nextPos.z);
      }
      
      currentPos.copy(nextPos);
      isDash = !isDash;
      
      if (currentPos.equals(end)) break;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    return geometry;
  }

  private createEdge(edge: EdgeSpec, geometry: THREE.BufferGeometry, state: { hovered: boolean; selected: boolean }): void {
    const material = this.createEdgeMaterial(edge, state);
    const line = new THREE.Line(geometry, material);
    line.userData.edgeId = edge.id;
    this.lineObjects.set(edge.id, line);
    this.scene.add(line);
  }

  private createEdgeMaterial(edge: EdgeSpec, state: { hovered: boolean; selected: boolean }): THREE.Material {
    const baseColor = edge.color || '#aaaaaa';
    let finalColor = new THREE.Color(baseColor);
    let opacity = 0.5;
    let width = edge.width || 2;

    // Check if source and target nodes are selected
    const sourceNode = this.state.data.nodes.find(n => n.id === edge.source);
    const targetNode = this.state.data.nodes.find(n => n.id === edge.target);
    const isSourceSelected = sourceNode && this.state.interaction?.selectedElementIds?.includes(sourceNode.id);
    const isTargetSelected = targetNode && this.state.interaction?.selectedElementIds?.includes(targetNode.id);

    // Apply styling based on state priority
    if (state.selected) {
      // Highest priority: edge is directly selected
      const selectedStyle = this.state.style['edge:selected'];
      if (selectedStyle) {
        this.applyEdgeStyle(finalColor, width, opacity, selectedStyle);
      }
    } else if (isSourceSelected && isTargetSelected) {
      // Both nodes selected
      const bothSelectedStyle = this.state.style['edge:both-selected'];
      if (bothSelectedStyle) {
        this.applyEdgeStyle(finalColor, width, opacity, bothSelectedStyle);
      } else {
        // Fall back to individual node styles
        const sourceSelectedStyle = this.state.style['edge:source-selected'];
        const targetSelectedStyle = this.state.style['edge:target-selected'];
        if (sourceSelectedStyle) {
          this.applyEdgeStyle(finalColor, width, opacity, sourceSelectedStyle);
        }
        if (targetSelectedStyle) {
          this.applyEdgeStyle(finalColor, width, opacity, targetSelectedStyle);
        }
      }
    } else if (isSourceSelected) {
      // Source node selected
      const sourceSelectedStyle = this.state.style['edge:source-selected'];
      if (sourceSelectedStyle) {
        this.applyEdgeStyle(finalColor, width, opacity, sourceSelectedStyle);
      }
    } else if (isTargetSelected) {
      // Target node selected
      const targetSelectedStyle = this.state.style['edge:target-selected'];
      if (targetSelectedStyle) {
        this.applyEdgeStyle(finalColor, width, opacity, targetSelectedStyle);
      }
    } else if (state.hovered) {
      // Hovered but not selected
      const hoverStyle = this.state.style['edge:hover'];
      if (hoverStyle) {
        this.applyEdgeStyle(finalColor, width, opacity, hoverStyle);
      }
    }

    return new THREE.LineBasicMaterial({
      color: finalColor,
      opacity: opacity,
      transparent: opacity < 1.0,
    });
  }

  private applyEdgeStyle(finalColor: THREE.Color, width: number, opacity: number, style: EdgeStyle): void {
    if (style.color) finalColor.set(style.color);
    if (style.width) width = style.width;
    if (style.opacity) opacity = style.opacity;
  }

  private updateEdgeVisuals(edge: EdgeSpec, geometry: THREE.BufferGeometry, state: { hovered: boolean; selected: boolean }): void {
    const line = this.lineObjects.get(edge.id);
    if (!line) return;

    // Update geometry
    safeDisposeGeometry(line.geometry);
    line.geometry = geometry;

    // Update material
    const material = this.createEdgeMaterial(edge, state);
    safeDisposeMaterial(line.material);
    line.material = material;
  }

  private updateEdgeHitArea(edge: EdgeSpec, geometry: THREE.BufferGeometry, sourceNode: NodeSpec, targetNode: NodeSpec): void {
    // Create a thicker invisible line for easier interaction
    const hitAreaWidth = Math.max(edge.width || 2, 8); // Minimum 8px hit area
    
    const hitMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.0, // Invisible
    });

    if (!this.hitAreaObjects.has(edge.id)) {
      const hitLine = new THREE.Line(geometry.clone(), hitMaterial);
      hitLine.userData.edgeId = edge.id;
      hitLine.userData.isHitArea = true;
      this.hitAreaObjects.set(edge.id, hitLine);
      this.scene.add(hitLine);
    } else {
      const hitLine = this.hitAreaObjects.get(edge.id)!;
      safeDisposeGeometry(hitLine.geometry);
      hitLine.geometry = geometry.clone();
    }
  }

  private async updateEdgeLabel(edge: EdgeSpec, sourceNode: NodeSpec, targetNode: NodeSpec): Promise<void> {
    // Create or update edge label
    if (!this.labelObjects.has(edge.id)) {
      const label = new EdgeLabel(this.scene, edge, sourceNode, targetNode);
      await label.init();
      this.labelObjects.set(edge.id, label);
    }
    
    const label = this.labelObjects.get(edge.id);
    if (label) {
      // Position the label
      label.positionLabel();
      
      // Update style based on edge state
      const edgeState = this.edgeStates.get(edge.id) || { hovered: false, selected: false };
      label.updateStyle(edgeState.hovered, edgeState.selected);
    }
  }

  public setEdgeHover(edgeId: string, hovered: boolean): void {
    const edgeState = this.edgeStates.get(edgeId) || { hovered: false, selected: false };
    edgeState.hovered = hovered;
    this.edgeStates.set(edgeId, edgeState);
    
    // Update visuals
    const edge = this.state.data.edges.find(e => e.id === edgeId);
    if (edge) {
      const sourceNode = this.state.data.nodes.find(n => n.id === edge.source);
      const targetNode = this.state.data.nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const geometry = this.createEdgeGeometry(edge, sourceNode, targetNode);
        this.updateEdgeVisuals(edge, geometry, edgeState);
      }
    }
  }

  public setEdgeSelected(edgeId: string, selected: boolean): void {
    const edgeState = this.edgeStates.get(edgeId) || { hovered: false, selected: false };
    edgeState.selected = selected;
    this.edgeStates.set(edgeId, edgeState);
    
    // Update visuals
    const edge = this.state.data.edges.find(e => e.id === edgeId);
    if (edge) {
      const sourceNode = this.state.data.nodes.find(n => n.id === edge.source);
      const targetNode = this.state.data.nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const geometry = this.createEdgeGeometry(edge, sourceNode, targetNode);
        this.updateEdgeVisuals(edge, geometry, edgeState);
      }
    }
  }

  public getEdgeObject(edgeId: string): THREE.Line | undefined {
    return this.lineObjects.get(edgeId);
  }
  
  public getRaycastableObjects(): THREE.Object3D[] {
    // Return all hit area objects for raycasting
    return Array.from(this.hitAreaObjects.values());
  }

  private removeEdge(edgeId: string): void {
    // Remove visual line
    const line = this.lineObjects.get(edgeId);
    if (line) {
      safeDisposeObject(line);
      this.lineObjects.delete(edgeId);
    }

    // Remove hit area
    const hitLine = this.hitAreaObjects.get(edgeId);
    if (hitLine) {
      // Don't dispose geometry here since it's cached and shared
      if (hitLine.parent === this.scene) {
        this.scene.remove(hitLine);
      }
      if (hitLine.material) {
        safeDisposeMaterial(hitLine.material);
      }
      this.hitAreaObjects.delete(edgeId);
    }

    // Remove label
    const label = this.labelObjects.get(edgeId);
    if (label) {
      try {
        label.dispose();
      } catch (error) {
        // Ignore errors during cleanup
        console.warn(`Failed to dispose label for edge ${edgeId}:`, error);
      }
      this.labelObjects.delete(edgeId);
    }

    // Remove cached geometry
    const geometry = this.edgeGeometries.get(edgeId);
    if (geometry) {
      safeDisposeGeometry(geometry);
      this.edgeGeometries.delete(edgeId);
      this.edgePositions.delete(edgeId);
    }

    // Remove state
    this.edgeStates.delete(edgeId);
  }

  private clearAllEdges(): void {
    // Remove all edges
    for (const edgeId of this.lineObjects.keys()) {
      try {
        this.removeEdge(edgeId);
      } catch (error) {
        // Ignore errors during cleanup
        console.warn(`Failed to remove edge ${edgeId}:`, error);
      }
    }
    
    // Clear geometry caches
    for (const geometry of this.edgeGeometries.values()) {
      safeDisposeGeometry(geometry);
    }
    this.edgeGeometries.clear();
    this.edgePositions.clear();
  }

  public dispose(): void {
    this.clearAllEdges();
    if (this.disposeEffect) {
      this.disposeEffect();
    }
    
    // Clean up cached geometries
    for (const geometry of this.edgeGeometries.values()) {
      safeDisposeGeometry(geometry);
    }
    this.edgeGeometries.clear();
    this.edgePositions.clear();
    
    // Clean up lineSegments
    try {
      if (this.lineSegments.parent === this.scene) {
        this.scene.remove(this.lineSegments);
      }
      safeDisposeGeometry(this.lineSegmentGeometry);
      safeDisposeMaterial(this.lineSegmentMaterial);
    } catch (error) {
      // Ignore errors during cleanup
      console.warn('Failed to dispose lineSegments:', error);
    }
  }

  private updateLineSegments(nodes: NodeSpec[], edges: EdgeSpec[]): void {
    // Collect all positions for the line segments
    const positions: number[] = [];
    
    for (const edge of edges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const sourcePos = sourceNode.position || { x: 0, y: 0, z: 0 };
        const targetPos = targetNode.position || { x: 0, y: 0, z: 0 };
        
        positions.push(sourcePos.x, sourcePos.y, sourcePos.z);
        positions.push(targetPos.x, targetPos.y, targetPos.z);
      }
    }
    
    // Update the geometry
    const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    this.lineSegmentGeometry.setAttribute('position', positionAttribute);
    
    // Update colors if needed
    if (edges.some(e => e.color)) {
      const colors: number[] = [];
      for (const edge of edges) {
        const color = new THREE.Color(edge.color || '#aaaaaa');
        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b); // Same color for both vertices
      }
      const colorAttribute = new THREE.Float32BufferAttribute(colors, 3);
      this.lineSegmentGeometry.setAttribute('color', colorAttribute);
      this.lineSegmentMaterial.vertexColors = true;
    } else {
      this.lineSegmentGeometry.deleteAttribute('color');
      this.lineSegmentMaterial.vertexColors = false;
    }
    
    // Update the bounding sphere and box for efficient rendering
    this.lineSegmentGeometry.computeBoundingSphere();
    this.lineSegmentGeometry.computeBoundingBox();
  }
}