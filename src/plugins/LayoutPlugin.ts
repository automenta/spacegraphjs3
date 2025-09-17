import { createEffect, onCleanup } from 'solid-js';
import { produce } from 'solid-js/store';
import { Simulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d';
import { Spec } from '../types';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';

/**
 * A plugin that manages the graph layout using a d3-force-3d simulation.
 */
export class LayoutPlugin implements ISpaceGraphPlugin {
  private graph!: SpaceGraph;
  private simulation!: Simulation<any, any>;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.createSimulation();

    createEffect(() => {
      const layout = this.graph.state.layout;
      if (layout?.type === 'force-directed') {
        this.simulation.alpha(1).restart();
      }
    });

    this.graph.eventManager.on('layout:pin', (nodeIds: string[]) => {
      this.pinNodes(nodeIds);
    });
    this.graph.eventManager.on('layout:unpin', (nodeIds: string[]) => {
      this.unpinNodes(nodeIds);
    });
  }

  private createSimulation() {
    const state = this.graph.state;
    const setState = this.graph.setState;

    this.simulation = new Simulation()
      .numDimensions(3)
      .force(
        'link',
        forceLink()
          .id((d: any) => d.id)
          .links(state.data?.edges ?? [])
      )
      .force('charge', forceManyBody())
      .force('center', forceCenter())
      .stop();

    this.simulation.nodes(state.data?.nodes ?? []);

    // Use a more efficient state update on each tick
    this.simulation.on('tick', () => {
      setState(
        produce((s) => {
          const simNodes = this.simulation.nodes();
          for (let i = 0; i < simNodes.length; i++) {
            const simNode = simNodes[i];
            const stateNode = s.data.nodes.find(n => n.id === simNode.id);
            if (stateNode && stateNode.position) {
              stateNode.position.x = simNode.x;
              stateNode.position.y = simNode.y;
              stateNode.position.z = simNode.z;
            }
          }
        })
      );
    });
  }

  public pinNodes(nodeIds: string[]): void {
    this.simulation.nodes().forEach((node: any) => {
      if (nodeIds.includes(node.id)) {
        node.fx = node.x;
        node.fy = node.y;
        node.fz = node.z;
      }
    });
  }

  public unpinNodes(nodeIds: string[]): void {
    this.simulation.nodes().forEach((node: any) => {
      if (nodeIds.includes(node.id)) {
        node.fx = undefined;
        node.fy = undefined;
        node.fz = undefined;
      }
    });
  }

  public resume(): void {
    this.simulation.alpha(1).restart();
  }

  public pause(): void {
    this.simulation.stop();
  }

  public reheat(): void {
    this.simulation.alpha(0.5).restart();
  }

  public dispose(): void {
    this.simulation.stop();
  }
}
