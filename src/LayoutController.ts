import { createEffect, onCleanup } from 'solid-js';
import { Store } from 'solid-js/store';
import { forceSimulation, forceManyBody, forceCenter, forceLink } from 'd3-force-3d';
import { Spec, Element } from './types';

interface Node extends Element, d3.SimulationNodeDatum {}

export class LayoutController {
  private state: Store<Spec>;
  private updateState: (spec: Partial<Spec>) => void;
  private simulation: d3.Simulation<Node, d3.SimulationLinkDatum<Node>> | null = null;

  constructor(state: Store<Spec>, updateState: (spec: Partial<Spec>) => void) {
    this.state = state;
    this.updateState = updateState;

    createEffect(() => {
      const layoutType = this.state.layout?.type;
      const nodes = this.state.data?.nodes || [];

      if (layoutType === 'force-directed') {
        this.initForceSimulation(nodes as Node[]);
      } else {
        this.stopSimulation();
      }
    });

    onCleanup(() => {
      this.stopSimulation();
    });
  }

  private initForceSimulation(nodes: Node[]) {
    this.stopSimulation(); // Ensure any existing simulation is stopped

    // Use the reactive nodes directly from the state
    const reactiveNodes = this.state.data?.nodes as Node[] || [];

    this.simulation = forceSimulation<Node, d3.SimulationLinkDatum<Node>>(nodes)
      .force('charge', forceManyBody().strength(-30))
      .force('center', forceCenter())
      .force('link', forceLink<Node, d3.SimulationLinkDatum<Node>>().id((d: Node) => d.id).distance(50))
      .on('tick', () => {
        // Directly update the position properties of the reactive nodes using updateState with produce
        this.updateState(s => {
          if (s.data?.nodes) {
            for (const node of nodes) {
              const reactiveNode = s.data.nodes.find(n => n.id === node.id);
              if (reactiveNode && reactiveNode.position && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
                reactiveNode.position.x = node.x;
                reactiveNode.position.y = node.y;
                reactiveNode.position.z = node.z;
              }
            }
          }
        });
      });

    // Add links if they exist in the spec
    if (this.state.data?.edges) {
      this.simulation.force('link', forceLink<Node, d3.SimulationLinkDatum<Node>>(this.state.data.edges).id((d: Node) => d.id).distance(50));
    }

    this.simulation.alphaTarget(0.3).restart(); // Start or restart the simulation with a target alpha
  }

  private stopSimulation() {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
  }

  public resume() {
    if (this.simulation) {
      this.simulation.alphaTarget(0.3).restart();
    }
  }

  public pause() {
    if (this.simulation) {
      this.simulation.alphaTarget(0);
    }
  }

  public reheat() {
    if (this.simulation) {
      this.simulation.alpha(1).restart();
    }
  }

  public dispose() {
    this.stopSimulation();
  }
}
