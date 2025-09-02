export interface Element {
  id: string;
  type: string;
  pinning?: { x: number; y: number; z: number } | string;
  data?: Record<string, any>;
  [key: string]: any; // For initial reactive properties like color, label, etc.
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export interface Spec {
  data: {
    nodes: Element[];
    edges: Edge[];
  };
  style?: Record<string, any>; // Simplified for now
  layout?: {
    type: string;
    [key: string]: any;
  };
  camera?: Record<string, any>;
  controls?: Record<string, any>;
}
