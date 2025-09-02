// src/types.ts

export interface Element {
  id: string;
  type: string;
  pinning?: { x: number; y: number; z: number } | string;
  data?: Record<string, any>;
  [key: string]: any;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export interface CameraSpec {
  target: { x: number; y: number; z: number };
  phi: number;
  theta: number;
  distance: number;
  [key:string]: any;
}

export interface Spec {
  data?: {
    nodes?: Element[];
    edges?: Edge[];
  };
  style?: { [key: string]: any; };
  layout?: {
    type?: string;
    [key: string]: any;
  };
  camera?: CameraSpec;
  controls?: { [key: string]: any; };
  interaction: { // Made non-optional
    hoveredElementId: string | null;
    selectedElementIds: string[];
  };
}
