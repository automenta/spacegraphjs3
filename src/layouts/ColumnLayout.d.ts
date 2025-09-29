import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';
/**
 * ColumnLayout - Arranges nodes in vertical columns
 */
export declare class ColumnLayout implements ILayoutEngine {
    private graph;
    private config;
    init(graph: SpaceGraph): void;
    private arrangeNodes;
    private calculateColumnPositions;
    private isPinned;
    onTick(): void;
    tick(iterations?: number): void;
    resume(): void;
    pause(): void;
    reheat(): void;
    dispose(): void;
}
