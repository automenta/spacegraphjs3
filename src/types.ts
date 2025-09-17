// src/types.ts

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
}

export interface HtmlNodeSpec extends NodeSpec {
  content?: string;
  className?: string;
}

export interface EdgeSpec {
  id: string;
  source: string;
  target: string;
  color?: string;
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
}

export interface CameraSpec {
  target: { x: number; y: number; z: number };
  phi: number;
  theta: number;
  distance: number;
}

export interface NodeStyle {
  color?: string;
  glow?: {
    color: string;
    strength: number;
  };
}

export type StyleSpec = {
  'node:hover'?: NodeStyle;
  'node:selected'?: NodeStyle;
};

export interface ForceDirectedLayoutSpec {
  type: 'force-directed';
  charge?: number;
  linkDistance?: number;
  linkStrength?: number;
}

export interface RandomLayoutSpec {
  type: 'random';
}

export type LayoutSpec = ForceDirectedLayoutSpec | RandomLayoutSpec;

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
  'background:click': { event: PointerEvent };
  'layout:pin': string[];
  'layout:unpin': string[];
};

export interface Spec {
  data: {
    nodes: NodeSpec[];
    edges: EdgeSpec[];
  };
  style: StyleSpec;
  layout: LayoutSpec;
  camera: CameraSpec;
  controls: ControlsSpec;
  performance: PerformanceSpec;
  interaction: {
    hoveredElementId: string | null;
    selectedElementIds: string[];
  };
}
