// src/types.ts

export interface Element {
  id: string;
  type: string;
  pinning?: { x: number; y: number; z: number } | string;
  data?: Record<string, any>;
  position?: { x: number; y: number; z: number; };
  color?: string;
  delete?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  delete?: boolean;
}

export interface CameraSpec {
  target: { x: number; y: number; z: number };
  phi: number;
  theta: number;
  distance: number;
}

export interface NodeStyle {
  color?: string;
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

export type LayoutSpec = ForceDirectedLayoutSpec; // Add more layout types here in the future

export interface Spec {
  data?: {
    nodes?: Element[];
    edges?: Edge[];
  };
  style?: StyleSpec;
  layout?: LayoutSpec;
  camera?: CameraSpec;
  interaction: {
    // Made non-optional
    hoveredElementId: string | null;
    selectedElementIds: string[];
  };
}
