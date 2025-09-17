import {
  forceSimulation,
  Simulation,
  forceLink,
  forceManyBody,
  forceCenter,
  SimulationNodeDatum,
  Force,
} from 'd3-force-3d';
import { produce } from 'solid-js/store';
import { createEffect } from 'solid-js';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine, NodeSpec, EdgeSpec } from '../types';

type D3Node = NodeSpec & SimulationNodeDatum;
type D3Link = EdgeSpec;

export class D3ForceLayout implements ILayoutEngine {
  private graph!: SpaceGraph;
  public simulation!: Simulation<D3Node, D3Link>;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.createSimulation();

    createEffect(() => {
      // Create copies of nodes to avoid direct mutation of store objects
      const nodesCopy = (this.graph.state.data?.nodes ?? []).map(node => ({ ...node }));
      this.simulation.nodes(nodesCopy as D3Node[]);
      this.reheat();
    });

    createEffect(() => {
      const nodes = this.graph.state.data?.nodes ?? [];
      const edges = this.graph.state.data?.edges ?? [];
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Create copies of edges to avoid direct mutation of store objects
      const links = edges.map((e) => ({
        ...e,
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
      }));

      const linkForce = this.simulation.force('link');
      if (linkForce && 'links' in linkForce) {
        (linkForce as Force<D3Node, D3Link>).links!(links as any);
        this.reheat();
      }
    });
  }

  private createSimulation() {
    // Create copies of nodes to avoid direct mutation of store objects
    const nodesCopy = (this.graph.state.data?.nodes ?? []).map(node => ({ ...node }));

    this.simulation = forceSimulation<D3Node, D3Link>(nodesCopy as D3Node[])
      .numDimensions(3)
      .force(
        'link',
        forceLink<D3Node, D3Link>().id((d) => d.id),
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
        // Create new node objects instead of mutating existing ones
        const updatedNodes = [...s.data.nodes];
        for (let i = 0; i < simNodes.length; i++) {
          const simNode = simNodes[i];
          const nodeIndex = updatedNodes.findIndex((n) => n.id === simNode.id);
          if (nodeIndex !== -1 && updatedNodes[nodeIndex].position) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: {
                x: simNode.x ?? 0,
                y: simNode.y ?? 0,
                z: simNode.z ?? 0,
              },
            };
          }
        }
        s.data.nodes = updatedNodes;
      }),
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