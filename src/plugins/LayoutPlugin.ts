import { createEffect } from 'solid-js';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraphCore } from '../core/SpaceGraphCore';
import { ILayoutEngine } from '../types';

/**
 * A plugin that manages the graph layout by delegating to a layout engine.
 */
export class LayoutPlugin implements ISpaceGraphPlugin {
  readonly id = 'layout-plugin';
  readonly name = 'Layout Plugin';
  readonly version = '1.0.0';
  readonly description =
    'Manages the graph layout by delegating to a layout engine.';

  public currentLayoutEngine: ILayoutEngine | null = null;
  private graph!: SpaceGraphCore;

  public init(graph: SpaceGraphCore): void {
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
      SpaceGraphCore.getLayoutEngineRegistry().get(layoutType);

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
