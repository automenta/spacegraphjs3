// src/types.ts
import * as THREE from 'three';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export interface NodeSpec {
  id: string;
  type: string;
  pinning?: { x: number; y: number; z: number } | string;
  data?: Record<string, any>;
  position?: { x: number; y: number; z: number };
  color?: string;
  label?: string;
  groupId?: string; // Reference to the group this node belongs to
}

export interface HtmlNodeSpec extends NodeSpec {
  content?: string;
  className?: string;
}

export interface BoxNodeSpec extends NodeSpec {
  width?: number;    // Box width (default: 1.0)
  height?: number;   // Box height (default: 1.0)
  depth?: number;    // Box depth (default: 1.0)
  rounded?: boolean; // Use rounded box geometry (default: false)
}

/**
 * Interface for custom geometry node specifications
 */
export interface CustomGeometryNodeSpec extends NodeSpec {
  url: string;                    // URL to load the geometry from
  format?: 'gltf' | 'glb' | 'obj' | 'fbx' | 'ply' | 'stl'; // Format of the geometry file
  material?: THREE.MaterialParameters; // Material properties for the geometry
}

/**
 * Interface for text node specifications
 */
export interface TextNodeSpec extends NodeSpec {
  text?: string;                 // Text content to display
  font?: string;                 // Font family (default: 'helvetiker')
  size?: number;                 // Text size (default: 0.5)
  depth?: number;                // Text depth/extrusion (default: 0.1)
  color?: string;                // Text color (default: node color)
  align?: 'left' | 'center' | 'right'; // Text alignment (default: 'center')
  lineHeight?: number;           // Line height for multi-line text (default: 1.2)
  maxWidth?: number;             // Maximum width for text wrapping (default: Infinity)
  bold?: boolean;                // Bold text (default: false)
  italic?: boolean;              // Italic text (default: false)
}

export interface EdgeSpec {
  id: string;
  source: string;
  target: string;
  color?: string;
  width?: number;              // Edge width
  type?: 'straight' | 'curved' | 'dashed'; // Edge type
  label?: string;              // Edge label
  selectable?: boolean;        // Whether edge can be selected
  hoverable?: boolean;         // Whether edge responds to hover
  data?: Record<string, any>;  // Arbitrary user data
  curvature?: number;          // For curved edges (0-1)
  dashSize?: number;           // For dashed edges
  gapSize?: number;            // For dashed edges
}

export interface DataUpdate {
  nodes?: {
    add?: NodeSpec[];
    update?: (DeepPartial<NodeSpec> & { id: string })[];
    remove?: string[];
  };
  edges?: {
    add?: EdgeSpec[];
    update?: (DeepPartial<EdgeSpec> & { id: string })[];
    remove?: string[];
  };
  groups?: {
    add?: GroupSpec[];
    update?: (DeepPartial<GroupSpec> & { id: string })[];
    remove?: string[];
  };
}

export interface SpecUpdate {
  data?: DataUpdate;
  style?: DeepPartial<StyleSpec>;
  layout?: DeepPartial<LayoutSpec>;
  camera?: DeepPartial<CameraSpec>;
  controls?: DeepPartial<ControlsSpec>;
  performance?: DeepPartial<PerformanceSpec>;
  interaction?: DeepPartial<{
    hoveredElementId: string | null;
    selectedElementIds: string[];
  }>;
  hud?: DeepPartial<Spec['hud']>;
}

export interface CameraSpec {
  target: { x: number; y: number; z: number };
  phi: number;
  theta: number;
  distance: number;
}

export interface RotationConstraints {
  minPhi?: number;
  maxPhi?: number;
  minTheta?: number;
  maxTheta?: number;
}

export interface NodeStyle {
  color?: string;
  glow?: {
    color: string;
    strength: number;
  };
}

export interface EdgeStyle {
  color?: string;
  width?: number;
  opacity?: number;
  glow?: {
    color: string;
    strength: number;
  };
  label?: {
    color: string;
    fontSize: number;
    fontFamily: string;
    backgroundColor?: string;
    padding?: number;
  };
}

export type StyleSpec = {
  'node:hover'?: NodeStyle;
  'node:selected'?: NodeStyle;
  'edge:hover'?: EdgeStyle;
  'edge:selected'?: EdgeStyle;
  'edge:source-selected'?: EdgeStyle;  // Style when source node is selected
  'edge:target-selected'?: EdgeStyle;  // Style when target node is selected
  'edge:both-selected'?: EdgeStyle;    // Style when both nodes are selected
};

export interface ForceDirectedLayoutSpec {
  type: 'force-directed';
  charge?: number;
  linkDistance?: number;
  linkStrength?: number;
}

export interface GridLayoutSpec {
  type: 'grid';
  dimensions?: 2 | 3;
  spacing?: number;
  columns?: number;
  rows?: number;
  depth?: number;
  origin?: { x: number; y: number; z: number };
  axisOrder?: ['x' | 'y' | 'z', 'x' | 'y' | 'z', 'x' | 'y' | 'z'];
}

export interface CircleLayoutSpec {
  type: 'circle';
  radius?: number;
  dimensions?: 2 | 3;
  center?: { x: number; y: number; z: number };
  startAngle?: number;
  direction?: 'clockwise' | 'counterclockwise';
  distribution?: 'equal' | 'random';
}

export interface ColumnLayoutSpec {
  type: 'column';
  spacing?: number;
  columns?: number;
  columnSpacing?: number;
  origin?: { x: number; y: number; z: number };
  maxNodesPerColumn?: number;
}

export interface RowLayoutSpec {
  type: 'row';
  spacing?: number;
  rows?: number;
  rowSpacing?: number;
  origin?: { x: number; y: number; z: number };
  maxNodesPerRow?: number;
}

export interface RandomLayoutSpec {
  type: 'random';
  // Random layout doesn't have specific properties
}

export type LayoutSpec = ForceDirectedLayoutSpec | GridLayoutSpec | CircleLayoutSpec | ColumnLayoutSpec | RowLayoutSpec | RandomLayoutSpec;

export interface ControlsSpec {
  keyboard: {
    enabled: boolean;
    panSpeed: number;
    zoomSpeed: number;
    orbitSpeed: number;
  };
}

export interface PerformanceSpec {
  instancingThreshold: number;
  enableLOD?: boolean;
  enableCulling?: boolean;
  enableMemoryManagement?: boolean;
}

import { Store } from 'solid-js/store';
import { BaseElementActor } from './renderers/elementActors/BaseElementActor';
import { SpaceGraph } from './core/SpaceGraph';

export type ElementActorClass = new (
  scene: THREE.Scene,
  elementState: Store<NodeSpec>,
  graphState: Store<Spec>
) => BaseElementActor;

export interface ILayoutEngine {
  init(graph: SpaceGraph): void;

  dispose(): void;

  resume(): void;

  pause(): void;

  reheat(): void;
}

export type LayoutEngineClass = new () => ILayoutEngine;

export type GraphEventMap = {
  'element:click': { target: NodeSpec | EdgeSpec; event: PointerEvent };
  'element:hover:enter': { target: NodeSpec | EdgeSpec };
  'element:hover:leave': { target: NodeSpec | EdgeSpec };
  'element:drag:start': { target: NodeSpec; startPosition: THREE.Vector3 };
  'element:drag:end': { target: NodeSpec; startPosition: THREE.Vector3; endPosition: THREE.Vector3 };
  'background:click': { event: PointerEvent };
  'layout:pin': string[];
  'layout:unpin': string[];
  'edge:click': {
    target: EdgeSpec;
    event: PointerEvent;
    sourceNode: NodeSpec;
    targetNode: NodeSpec;
  };
  'edge:hover:enter': {
    target: EdgeSpec;
    sourceNode: NodeSpec;
    targetNode: NodeSpec;
  };
  'edge:hover:leave': {
    target: EdgeSpec;
    sourceNode: NodeSpec;
    targetNode: NodeSpec;
  };
  'edge:select': {
    target: EdgeSpec;
    sourceNode: NodeSpec;
    targetNode: NodeSpec;
  };
  'edge:multi-select': {
    targets: EdgeSpec[];
    sourceNodes: NodeSpec[];
    targetNodes: NodeSpec[];
  };
  'camera:animation:start': void;
  'camera:animation:end': void;
  'camera:framing:start': void;
  'camera:framing:end': void;
};

/**
 * Utility type for ensuring exhaustive switch statements
 */
export type AssertUnreachable = (x: never) => never;

/**
 * Utility type for making properties required
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Utility type for making properties optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface GroupSpec {
  id: string;
  name?: string;
  nodes: string[]; // IDs of nodes in this group
  position?: { x: number; y: number; z: number }; // Center position of the group
  locked?: boolean; // Whether the group is locked (cannot be modified)
}

export interface Spec {
  data: {
    nodes: NodeSpec[];
    edges: EdgeSpec[];
    groups?: GroupSpec[]; // Add groups to the data structure
  };
  style: StyleSpec;
  layout: LayoutSpec;
  camera: CameraSpec;
  controls: ControlsSpec;
  performance: PerformanceSpec;
  interaction: {
    hoveredElementId: string | null;
    selectedElementIds: string[];
    selectedGroupIds?: string[]; // Track selected groups
  };
  hud?: {
    visible: boolean;
    console?: {
      enabled: boolean;
      history?: string[];
      currentInput?: string;
      output?: Array<{
        type: 'command' | 'result' | 'error' | 'info';
        content: string;
        timestamp: number;
      }>;
    };
    content?: string;
  };
}
