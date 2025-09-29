import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';
export interface GridLayoutSpec {
    type: 'grid';
    dimensions: 2 | 3;
    spacing: number;
    columns?: number;
    rows?: number;
    depth?: number;
    origin: {
        x: number;
        y: number;
        z: number;
    };
    axisOrder?: ['x' | 'y' | 'z', 'x' | 'y' | 'z', 'x' | 'y' | 'z'];
}
/**
 * GridLayout - Arranges nodes in a 2D or 3D grid pattern
 */
export declare class GridLayout implements ILayoutEngine {
    private graph;
    private config;
    init(graph: SpaceGraph): void;
    private arrangeNodes;
    private calculateGridPositions;
    private isPinned;
    onTick(): void;
    tick(iterations?: number): void;
    resume(): void;
    pause(): void;
    reheat(): void;
    dispose(): void;
}
