import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';
export declare class RandomLayout implements ILayoutEngine {
    private graph;
    init(graph: SpaceGraph): void;
    onTick(): void;
    tick(iterations?: number): void;
    resume(): void;
    pause(): void;
    reheat(): void;
    dispose(): void;
    private setRandomPositions;
}
