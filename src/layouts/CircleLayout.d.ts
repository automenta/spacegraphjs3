import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';
/**
 * CircleLayout - Arranges nodes in a circular or spherical pattern
 */
export declare class CircleLayout implements ILayoutEngine {
    private graph;
    private config;
    init(graph: SpaceGraph): void;
    private arrangeNodes;
    private calculateCirclePositions;
    private isPinned;
    onTick(): void;
    tick(iterations?: number): void;
    resume(): void;
    pause(): void;
    reheat(): void;
    dispose(): void;
}
