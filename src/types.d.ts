export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};
export interface Element {
    id: string;
    type: string;
    pinning?: {
        x: number;
        y: number;
        z: number;
    } | string;
    data?: Record<string, any>;
    position?: {
        x: number;
        y: number;
        z: number;
    };
    color?: string;
}
export interface HtmlElement extends Element {
    content?: string;
    className?: string;
}
export interface Edge {
    id: string;
    source: string;
    target: string;
    color?: string;
}
export interface SpecUpdate {
    data?: {
        nodes?: (DeepPartial<Element> & {
            id: string;
        })[];
        edges?: (DeepPartial<Edge> & {
            id: string;
        })[];
    };
    style?: DeepPartial<StyleSpec>;
    layout?: DeepPartial<LayoutSpec>;
    camera?: DeepPartial<CameraSpec>;
    interaction?: DeepPartial<{
        hoveredElementId: string | null;
        selectedElementIds: string[];
    }>;
}
export interface CameraSpec {
    target: {
        x: number;
        y: number;
        z: number;
    };
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
export type LayoutSpec = ForceDirectedLayoutSpec;
export interface Spec {
    data: {
        nodes: Element[];
        edges: Edge[];
    };
    style: StyleSpec;
    layout: LayoutSpec;
    camera: CameraSpec;
    interaction: {
        hoveredElementId: string | null;
        selectedElementIds: string[];
    };
}
