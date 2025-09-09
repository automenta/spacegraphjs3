import { createRoot } from 'solid-js';
import { Store, produce } from 'solid-js/store';
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  Simulation,
  SimulationNodeDatum,
} from 'd3-force-3d';
import { Spec, GraphElement, Edge } from './types';

// Extend the d3-force Node type to include our GraphElement properties
interface Node extends GraphElement, SimulationNodeDatum {}

export class LayoutController {
  private setState: (fn: (prevState: Spec) => Spec) => void;
  private simulation: Simulation<Node, Edge> | null = null;
  public ready: Promise<void>;
  private resolveReady!: () => void;
  private emit: (eventName: string, ...args: any[]) => void;
  private paused = false;
  private disposeEffect?: () => void;
  private state: Store<Spec>;

  constructor(
    state: Store<Spec>,
    setState: (fn: (prevState: Spec) => Spec) => void,
    emit: (eventName: string, ...args: any[]) => void
  ) {
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.state = state;
    this.setState = setState;
    this.emit = emit;
  }

  public init() {
    this.disposeEffect = createRoot((dispose) => {
      const layoutType = this.state.layout?.type ?? 'force-directed';
      if (layoutType === 'force-directed') {
        this.initForceSimulation();
      } else {
        this.stopSimulation();
      }
      return dispose;
    });
  }

  /**
   * Initialize the d3-force simulation.
   */
  private initForceSimulation() {
    this.stopSimulation();

    // IMPORTANT: Deep copy nodes and edges to prevent d3 from mutating the reactive state directly.
    const simNodes: Node[] = JSON.parse(JSON.stringify(this.state.data?.nodes || []));
    const simEdges: Edge[] = JSON.parse(JSON.stringify(this.state.data?.edges || []));

    // Initialize positions for d3 if they don't exist.
    simNodes.forEach((node) => {
      node.x = node.position?.x ?? 0;
      node.y = node.position?.y ?? 0;
      node.z = node.position?.z ?? 0;
    });

    const layoutSpec = (this.state.layout || {}) as import('./types').ForceDirectedLayoutSpec;
    const charge = layoutSpec.charge ?? -50;
    const linkDistance = layoutSpec.linkDistance ?? 50;
    const linkStrength = layoutSpec.linkStrength ?? 1;

    this.simulation = forceSimulation<Node, Edge>(simNodes)
      .force('charge', forceManyBody<Node>().strength(charge))
      .force('center', forceCenter<Node>())
      .force(
        'link',
        forceLink<Node, Edge>(simEdges)
          .id((d: Node) => d.id)
          .distance(linkDistance)
          .strength(linkStrength)
      )
      .on('tick', () => {
        if (this.paused) return;
        // On each tick, update the positions using the setState function
        this.setState(
          produce((s) => {
            const stateNodeMap = new Map(s.data!.nodes!.map(n => [n.id, n]));
            this.simulation?.nodes().forEach((simNode) => {
              const stateNode = stateNodeMap.get(simNode.id);
              if (stateNode) {
                if (!stateNode.position) stateNode.position = { x: 0, y: 0, z: 0 };
                stateNode.position.x = simNode.x!;
                stateNode.position.y = simNode.y!;
                stateNode.position.z = simNode.z!;
              }
            });
          })
        );
        this.emit('layout:tick');
      })
      .on('end', () => {
        this.emit('layout:stabilize');
      });

    this.simulation.alpha(1).restart();
    if (import.meta.env.MODE === 'test') {
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

  public unpinNodes(nodeIds: string[]) {
    if (!this.simulation) return;
    this.simulation.nodes().forEach((node) => {
      if (nodeIds.includes(node.id)) {
        node.fx = null;
        node.fy = null;
        node.fz = null;
      }
    });
    this.reheat();
  }

  public dispose() {
    if (this.disposeEffect) {
      this.disposeEffect();
    }
    this.stopSimulation();
  }

  public tick(iterations = 1) {
    if (this.simulation && !this.paused) {
      for (let i = 0; i < iterations; i++) {
        this.simulation.tick();
      }
      this.emit('layout:tick');
    }
  }
}
