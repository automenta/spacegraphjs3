declare module 'd3-force-3d' {
  export function forceSimulation<N extends SimulationNodeDatum>(
    nodes?: N[]
  ): Simulation<N, undefined>;
  export function forceManyBody<N extends SimulationNodeDatum>(): Force<
    N,
    undefined
  >;
  export function forceCenter<N extends SimulationNodeDatum>(
    x?: number,
    y?: number,
    z?: number
  ): Force<N, undefined>;
  export function forceLink<
    N extends SimulationNodeDatum,
    E extends SimulationLinkDatum<N>,
  >(links?: E[]): Force<N, E>;

  export interface Simulation<
    N extends SimulationNodeDatum,
    E extends SimulationLinkDatum<N> | undefined,
  > {
    restart(): this;
    stop(): this;
    tick(iterations?: number): this;
    nodes(nodes: N[]): this;
    nodes(): N[];
    alpha(alpha: number): this;
    alpha(): number;
    alphaMin(min: number): this;
    alphaMin(): number;
    alphaDecay(decay: number): this;
    alphaDecay(): number;
    alphaTarget(target: number): this;
    alphaTarget(): number;
    velocityDecay(decay: number): this;
    velocityDecay(): number;
    force<F extends Force<N, E>>(name: string, force: F): this;
    force<F extends Force<N, E>>(name: string): F | null;
    force(name: string, force: null): this;
    find(x: number, y: number, radius?: number): N | undefined;
    on(typenames: string, listener: (this: this, ...args: any[]) => void): this;
    on(typenames: string): (this: this, ...args: any[]) => void;
    on(typenames: string, listener: null): this;
  }

  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  }

  export interface SimulationLinkDatum<N extends SimulationNodeDatum> {
    source: string | number | N;
    target: string | number | N;
    index?: number;
  }

  export interface Force<
    N extends SimulationNodeDatum,
    E extends SimulationLinkDatum<N> | undefined,
  > {
    (alpha: number): void;
    initialize?(nodes: N[], random: () => number): void;
    links?(links: E[]): this;
    strength?(strength: any): this;
    distance?(distance: any): this;
    id?(id: (d: N) => string | number): this;
  }
}
