import { createEffect } from 'solid-js';
import { produce } from 'solid-js/store';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';

export class RandomLayout implements ILayoutEngine {
  private graph!: SpaceGraph;

  public init(graph: SpaceGraph): void {
    this.graph = graph;

    // Set initial random positions for all nodes
    this.setRandomPositions();

    // Update positions when nodes are added
    createEffect(() => {
      this.setRandomPositions();
    });
  }

  public onTick(): void {
    // Random layout doesn't need continuous updates
  }

  public tick(iterations = 1): void {
    // Random layout doesn't need continuous updates
  }

  public resume(): void {
    // Random layout doesn't need to be resumed
  }

  public pause(): void {
    // Random layout doesn't need to be paused
  }

  public reheat(): void {
    // Random layout doesn't need reheating
  }

  public dispose(): void {
    // Nothing to dispose
  }

  private setRandomPositions(): void {
    const setState = (fn: (prevState: any) => any) => {
      this.graph.updateStateWithProducer(fn);
    };
    const nodes = this.graph.state.data?.nodes ?? [];

    // Only update if there are nodes without positions
    const needsPosition = nodes.some((node) => !node.position);

    if (needsPosition) {
      setState(
        produce((s) => {
          for (let i = 0; i < s.data.nodes.length; i++) {
            const node = s.data.nodes[i];
            if (!node.position) {
              s.data.nodes[i] = {
                ...node,
                position: {
                  x: (Math.random() - 0.5) * 20,
                  y: (Math.random() - 0.5) * 20,
                  z: (Math.random() - 0.5) * 20,
                },
              };
            }
          }
        })
      );
    }
  }
}
