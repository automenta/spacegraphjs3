declare module 'd3-force-3d' {
  import { SimulationNodeDatum as D3SimulationNodeDatum, SimulationLinkDatum as D3SimulationLinkDatum } from 'd3-force';

  export interface SimulationNodeDatum extends D3SimulationNodeDatum {
    x: number;
    y: number;
    z: number;
  }

  export interface SimulationLinkDatum<N extends SimulationNodeDatum> extends D3SimulationLinkDatum<N> {}

  export interface Force<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>
  > {
    (alpha: number): void;
    initialize?(nodes: N[], random?: () => number): void;
    links?(links: L[]): this;
    id?(id: (d: N) => string): this;
  }

  export interface Simulation<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>
  > {
    restart(): this;
    stop(): this;
    tick(iterations?: number): this;
    nodes(nodes: N[]): this;
    nodes(): N[];
    alpha(alpha: number): this;
    alphaMin(min: number): this;
    alphaDecay(decay: number): this;
    alphaTarget(target: number): this;
    velocityDecay(decay: number): this;
    force(name: string): Force<N, L> | undefined;
    force(name: string, force: Force<N, L> | null): this;
    find(x: number, y: number, z?: number, radius?: number): N | undefined;
    on(typenames: string, listener?: (...args: any[]) => void): this;
    numDimensions(dimensions: number): this;
  }

  export function forceLink<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>
  >(links?: L[]): Force<N, L>;

  export function forceManyBody<N extends SimulationNodeDatum>(): Force<N, any>;
  export function forceCenter<N extends SimulationNodeDatum>(x?: number, y?: number, z?: number): Force<N, any>;
  export function Simulation<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>
  >(nodes?: N[]): Simulation<N, L>;
}
