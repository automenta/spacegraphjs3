import { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3-force-3d';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine, NodeSpec } from '../types';
type D3Node = NodeSpec & SimulationNodeDatum;
type D3Link = SimulationLinkDatum<D3Node>;
export declare class D3ForceLayout implements ILayoutEngine {
    simulation: Simulation<D3Node, D3Link>;
    private graph;
    init(graph: SpaceGraph): void;
    onTick(): void;
    tick(iterations?: number): void;
    resume(): void;
    pause(): void;
    reheat(): void;
    dispose(): void;
    private createSimulation;
}
export {};
