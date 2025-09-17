import { produce } from 'solid-js/store';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine } from '../types';

export class RandomLayout implements ILayoutEngine {
  private graph!: SpaceGraph;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.applyLayout();
  }

  private applyLayout(): void {
    const setState = this.graph.setState;
    setState(
      produce((s) => {
        for (const node of s.data.nodes) {
          if (!node.position) {
            node.position = { x: 0, y: 0, z: 0 };
          }
          node.position.x = Math.random() * 200 - 100;
          node.position.y = Math.random() * 200 - 100;
          node.position.z = Math.random() * 200 - 100;
        }
      })
    );
  }

  public dispose(): void {
    // No-op
  }

  public resume(): void {
    // No-op
  }

  public pause(): void {
    // No-op
  }

  public reheat(): void {
    // No-op
  }
}
