import { createEffect } from 'solid-js';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';

/**
 * A plugin that manages the graph layout by delegating to a layout engine.
 */
export class LayoutPlugin implements ISpaceGraphPlugin {
  public currentLayoutEngine: ILayoutEngine | null = null;
  private graph!: SpaceGraph;

  public init(graph: SpaceGraph): void {
    this.graph = graph;

    createEffect(() => this.updateLayoutEngine());
  }

  public updateLayoutEngine(): void {
    const layoutType = this.graph.state.layout?.type;
    if (this.currentLayoutEngine) {
      this.currentLayoutEngine.dispose();
      this.currentLayoutEngine = null;
    }

    const LayoutEngineClass =
      SpaceGraph.getLayoutEngineRegistry().get(layoutType);

    if (LayoutEngineClass) {
      this.currentLayoutEngine = new LayoutEngineClass();
      this.currentLayoutEngine.init(this.graph);
    }
  }

  public resume(): void {
    this.currentLayoutEngine?.resume();
  }

  public pause(): void {
    this.currentLayoutEngine?.pause();
  }

  public reheat(): void {
    this.currentLayoutEngine?.reheat();
  }

  public dispose(): void {
    this.currentLayoutEngine?.dispose();
  }
}
