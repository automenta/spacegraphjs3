import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';
/**
 * A plugin that manages the graph layout by delegating to a layout engine.
 */
export declare class LayoutPlugin implements ISpaceGraphPlugin {
    currentLayoutEngine: ILayoutEngine | null;
    private graph;
    init(graph: SpaceGraph): void;
    updateLayoutEngine(): void;
    resume(): void;
    pause(): void;
    reheat(): void;
    dispose(): void;
}
