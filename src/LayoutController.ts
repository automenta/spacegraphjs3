import { onCleanup } from 'solid-js';
import { Store } from 'solid-js/store';
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  Simulation,
} from 'd3-force-3d';
import { Spec, Element, Edge } from './types';

// Extend the d3-force Node type to include our Element properties
interface Node extends Element, d3.SimulationNodeDatum {}

export class LayoutController {
  private state: Store<Spec>;
  private simulation: Simulation<Node, Edge> | null = null;
  public ready: Promise<void>;
  private resolveReady: () => void;
  private emit: (eventName: string, ...args: any[]) => void;
  private originalNodes: Node[] = [];
  private paused = false;

  constructor(
    state: Store<Spec>,
    emit: (eventName: string, ...args: any[]) => void
  ) {
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.state = state;
    this.emit = emit;

    onCleanup(() => this.stopSimulation());
  }

  public init() {
    const layoutType = this.state.layout?.type;
    if (layoutType === 'force-directed') {
      this.initForceSimulation();
    } else {
      this.stopSimulation();
    }
  }

  /**
   * Initialize the d3-force simulation.
   */
  private initForceSimulation() {
    this.stopSimulation();

    this.originalNodes = (this.state.data?.nodes || []) as Node[];
    // Create a deep copy of the edges for the simulation to avoid proxy issues.
    const edges: Edge[] = JSON.parse(JSON.stringify(this.state.data?.edges || []));

    // Create a deep copy of the nodes for the simulation to avoid proxy issues.
    const simNodes: Node[] = JSON.parse(JSON.stringify(this.originalNodes));

    // Initialize positions for d3.
    simNodes.forEach((node) => {
      node.x = node.position?.x ?? 0;
      node.y = node.position?.y ?? 0;
      node.z = node.position?.z ?? 0;
    });

    const layoutSpec = this.state.layout as import('./types').ForceDirectedLayoutSpec;
    const charge = layoutSpec.charge ?? -50;
    const linkDistance = layoutSpec.linkDistance ?? 50;
    const linkStrength = layoutSpec.linkStrength ?? 1;

    this.simulation = forceSimulation<Node, Edge>(simNodes)
      .force('charge', forceManyBody().strength(charge))
      .force('center', forceCenter())
      .force(
        'link',
        forceLink<Node, Edge>(edges)
          .id((d: Node) => d.id)
          .distance(linkDistance)
          .strength(linkStrength)
      )
      .on('tick', () => {
        // On each tick, update the positions of the original reactive nodes.
        this.simulation?.nodes().forEach((simNode, i) => {
          const originalNode = this.originalNodes[i];
          if (originalNode?.position) {
            originalNode.position.x = simNode.x!;
            originalNode.position.y = simNode.y!;
            originalNode.position.z = simNode.z!;
          }
        });
        this.emit('layout:tick');
      })
      .on('end', () => {
        this.emit('layout:stabilize');
      });

    this.simulation.alpha(1).restart();
    // In the test environment, we stop the simulation immediately
    // so we can manually tick it.
    if (process.env.NODE_ENV === 'production') {
      this.simulation.stop();
    }
    this.emit('layout:start');
    this.resolveReady();
  }

  private stopSimulation() {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
  }

  public resume() {
    this.paused = false;
    if (this.simulation) this.simulation.alphaTarget(0.3).restart();
  }

  public pause() {
    this.paused = true;
    if (this.simulation) this.simulation.alphaTarget(0);
  }

  public reheat() {
    if (this.simulation) this.simulation.alpha(1).restart();
  }

  /**
   * Pins nodes in the layout simulation, fixing their position.
   * @param nodeIds - An array of node IDs to pin.
   */
  public pinNodes(nodeIds: string[]) {
    if (!this.simulation) return;
    this.simulation.nodes().forEach((node) => {
      if (nodeIds.includes(node.id)) {
        node.fx = node.x;
        node.fy = node.y;
        node.fz = node.z;
      }
    });
  }

  /**
   * Unpins nodes in the layout simulation, allowing them to move freely.
   * @param nodeIds - An array of node IDs to unpin.
   */
  public unpinNodes(nodeIds: string[]) {
    if (!this.simulation) return;
    this.simulation.nodes().forEach((node) => {
      if (nodeIds.includes(node.id)) {
        node.fx = null;
        node.fy = null;
        node.fz = null;
      }
    });
    // Reheat the simulation slightly to incorporate the unpinned node
    this.reheat();
  }

  public dispose() {
    this.stopSimulation();
  }

  public tick(iterations = 1) {
    if (this.simulation && !this.paused) {
      for (let i = 0; i < iterations; i++) {
        this.simulation.tick();
      }
      // Manually update positions for tests
      this.simulation.nodes().forEach((simNode, i) => {
        const originalNode = this.originalNodes[i];
        if (originalNode?.position) {
          originalNode.position.x = simNode.x!;
          originalNode.position.y = simNode.y!;
          originalNode.position.z = simNode.z!;
        }
      });
      this.emit('layout:tick');
    }
  }
}
