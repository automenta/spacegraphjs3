import {
  Force,
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from 'd3-force-3d';
import { produce } from 'solid-js/store';
import { createEffect } from 'solid-js';
import { SpaceGraph } from '../core/SpaceGraph';
import { EdgeSpec, ILayoutEngine, NodeSpec } from '../types';

type D3Node = NodeSpec & SimulationNodeDatum;
type D3Link = SimulationLinkDatum<D3Node>;

export class D3ForceLayout implements ILayoutEngine {
  public simulation!: Simulation<D3Node, D3Link>;
  private graph!: SpaceGraph;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.createSimulation();

    createEffect(() => {
      // Create copies of nodes to avoid direct mutation of store objects
      const nodesCopy = (this.graph.state.data?.nodes ?? []).map((node) => ({
        ...node,
        x: node.position?.x ?? 0,
        y: node.position?.y ?? 0,
        z: node.position?.z ?? 0,
      } as D3Node));
      this.simulation.nodes(nodesCopy as D3Node[]);
      // this.reheat(); // Do not start the simulation automatically on init
    });

    createEffect(() => {
      const nodes = this.graph.state.data?.nodes ?? [];
      const edges = this.graph.state.data?.edges ?? [];
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Create copies of edges to avoid direct mutation of store objects
      const links = edges.map((e) => {
        const sourceNode = nodeMap.get(e.source);
        const targetNode = nodeMap.get(e.target);
        if (!sourceNode || !targetNode) return null;
        return {
          source: {
            ...sourceNode,
            x: sourceNode.position?.x ?? 0,
            y: sourceNode.position?.y ?? 0,
            z: sourceNode.position?.z ?? 0,
          } as D3Node,
          target: {
            ...targetNode,
            x: targetNode.position?.x ?? 0,
            y: targetNode.position?.y ?? 0,
            z: targetNode.position?.z ?? 0,
          } as D3Node,
        };
      }).filter(Boolean) as D3Link[];

      const linkForce = this.simulation.force('link');
      if (linkForce && 'links' in linkForce) {
        (linkForce as Force<D3Node, D3Link>).links!(links);
        // this.reheat(); // Do not start the simulation automatically on init
      }
    });
  }

  public onTick(): void {
    const setState = (fn: (prevState: any) => any) => {
      this.graph.updateStateWithProducer(fn);
    };
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

  private createSimulation() {
    // Create copies of nodes to avoid direct mutation of store objects
    const nodesCopy = (this.graph.state.data?.nodes ?? []).map((node) => ({
      ...node,
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
      z: node.position?.z ?? 0,
    } as D3Node));

    this.simulation = forceSimulation<D3Node, D3Link>(nodesCopy as D3Node[])
      .numDimensions(3)
      .force(
        'link',
        forceLink<D3Node, D3Link>()
      )
      .force('charge', forceManyBody())
      .force('center', forceCenter())
      .stop();

    this.simulation.on('tick', this.onTick.bind(this));
  }
}
