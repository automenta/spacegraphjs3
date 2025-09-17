import { Simulation, forceLink, forceManyBody, forceCenter, SimulationNodeDatum } from 'd3-force-3d';
import { produce } from 'solid-js/store';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine, NodeSpec, EdgeSpec } from '../types';

type D3Node = NodeSpec & SimulationNodeDatum;
type D3Link = EdgeSpec;

export class D3ForceLayout implements ILayoutEngine {
  private graph!: SpaceGraph;
  private simulation!: Simulation<D3Node, D3Link>;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.createSimulation();
  }

  private createSimulation() {
    const state = this.graph.state;
    const setState = this.graph.setState;

    this.simulation = new Simulation<D3Node, D3Link>()
      .numDimensions(3)
      .force(
        'link',
        forceLink<D3Node, D3Link>()
          .id((d) => d.id)
          .links(state.data?.edges ?? [])
      )
      .force('charge', forceManyBody())
      .force('center', forceCenter())
      .stop();

    this.simulation.nodes((state.data?.nodes ?? []) as D3Node[]);

    this.simulation.on('tick', () => {
      setState(
        produce((s) => {
          const simNodes = this.simulation.nodes();
          for (let i = 0; i < simNodes.length; i++) {
            const simNode = simNodes[i];
            const stateNode = s.data.nodes.find((n) => n.id === simNode.id);
            if (stateNode && stateNode.position) {
              stateNode.position.x = simNode.x ?? 0;
              stateNode.position.y = simNode.y ?? 0;
              stateNode.position.z = simNode.z ?? 0;
            }
          }
        })
      );
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
