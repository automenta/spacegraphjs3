import { forceSimulation, Simulation, forceLink, forceManyBody, forceCenter, SimulationNodeDatum, Force } from 'd3-force-3d';
import { produce } from 'solid-js/store';
import { createEffect } from 'solid-js';
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

    createEffect(() => {
      this.simulation.nodes((this.graph.state.data?.nodes ?? []) as D3Node[]);
      this.reheat();
    });

    createEffect(() => {
      const linkForce = this.simulation.force('link');
      if (linkForce && 'links' in linkForce) {
        (linkForce as Force<D3Node, D3Link>).links!((this.graph.state.data?.edges ?? []) as D3Link[]);
        this.reheat();
      }
    });
  }

  private createSimulation() {
    const state = this.graph.state;

    this.simulation = forceSimulation<D3Node, D3Link>((state.data?.nodes ?? []) as D3Node[])
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

    this.simulation.on('tick', this.onTick.bind(this));
  }

  public onTick(): void {
    const setState = this.graph.setState;
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
  }

  public tick(iterations = 1): void {
    for (let i = 0; i < iterations; i++) {
      this.simulation.tick();
    }
    this.onTick();
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
