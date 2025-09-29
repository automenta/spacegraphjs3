import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';
/**
 * RowLayout - Arranges nodes in horizontal rows
 */
export declare class RowLayout implements ILayoutEngine {
    private graph;
    private config;
    init(graph: SpaceGraph): void;
    private arrangeNodes;
    private calculateRowPositions;
    private isPinned;
    onTick(): void;
    tick(iterations?: number): void;
    resume(): void;
    pause(): void;
    reheat(): void;
    dispose(): void;
}
