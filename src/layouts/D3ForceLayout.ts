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
import { SpaceGraph as _SpaceGraph } from '../core/SpaceGraph';
import { EdgeSpec, NodeSpec } from '../types';
import { BaseLayoutEngine } from './BaseLayoutEngine';

type D3Node = NodeSpec & SimulationNodeDatum;
type D3Link = SimulationLinkDatum<D3Node>;

export class D3ForceLayout extends BaseLayoutEngine {
  public simulation!: Simulation<D3Node, D3Link>;
  private lastNodeCount: number = 0;
  private lastEdgeCount: number = 0;

  protected setupLayout(): void {
    this.createSimulation();

    createEffect(() => {
      const nodes = this.graph.state.data?.nodes ?? [];
      // Only update if node count has changed significantly
      if (Math.abs(nodes.length - this.lastNodeCount) > 5) {
        this.updateNodes(nodes);
        this.lastNodeCount = nodes.length;
      }
    });

    createEffect(() => {
      const edges = this.graph.state.data?.edges ?? [];
      // Only update if edge count has changed significantly
      if (Math.abs(edges.length - this.lastEdgeCount) > 5) {
        this.updateLinks(edges);
        this.lastEdgeCount = edges.length;
      }
    });
  }

  private updateNodes(nodes: NodeSpec[]): void {
    // Create a map of existing nodes for quick lookup
    const existingNodeMap = new Map<string, D3Node>();
    this.simulation.nodes().forEach(node => {
      existingNodeMap.set(node.id, node);
    });

    // Update or create nodes
    const updatedNodes: D3Node[] = nodes.map(node => {
      let d3Node = existingNodeMap.get(node.id);
      if (!d3Node) {
        // Create new D3Node
        d3Node = {
          ...node,
          x: node.position?.x ?? 0,
          y: node.position?.y ?? 0,
          z: node.position?.z ?? 0,
        } as D3Node;
      } else {
        // Update existing node position
        d3Node.x = node.position?.x ?? d3Node.x ?? 0;
        d3Node.y = node.position?.y ?? d3Node.y ?? 0;
        d3Node.z = node.position?.z ?? d3Node.z ?? 0;
      }
      return d3Node;
    });

    this.simulation.nodes(updatedNodes);
  }

  private updateLinks(edges: EdgeSpec[]): void {
    const nodes = this.graph.state.data?.nodes ?? [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Create a map of existing links for quick lookup
    const existingLinkMap = new Map<string, D3Link>();
    const linkForce = this.simulation.force('link');
    if (linkForce && 'links' in linkForce) {
      const currentLinks = (linkForce as any).links() || [];
      currentLinks.forEach((link: any) => {
        // Handle both indexed and object forms of source/target
        const sourceId = typeof link.source === 'number' ?
          this.simulation.nodes()[link.source]?.id :
          link.source?.id;
        const targetId = typeof link.target === 'number' ?
          this.simulation.nodes()[link.target]?.id :
          link.target?.id;
        
        if (sourceId && targetId) {
          const linkId = `${sourceId}-${targetId}`;
          existingLinkMap.set(linkId, link);
        }
      });
    }

    // Update or create links
    const updatedLinks: D3Link[] = [];
    edges.forEach(edge => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      if (!sourceNode || !targetNode) return;

      const linkId = `${edge.source}-${edge.target}`;
      let d3Link = existingLinkMap.get(linkId);
      
      if (!d3Link) {
        // Create new D3Link
        d3Link = {
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
        } as D3Link;
      }
      
      updatedLinks.push(d3Link);
    });

    if (linkForce && 'links' in linkForce) {
      (linkForce as Force<D3Node, D3Link>).links!(updatedLinks);
    }
  }

  public onTick(): void {
    const setState = (fn: (prevState: any) => any) => {
      this.graph.updateStateWithProducer(fn);
    };
    
    // Batch updates to reduce re-renders
    setState(
      produce((s) => {
        const simNodes = this.simulation.nodes();
        // Create a map for faster lookup
        const nodeUpdates = new Map<string, { x: number; y: number; z: number }>();
        for (let i = 0; i < simNodes.length; i++) {
          const simNode = simNodes[i];
          nodeUpdates.set(simNode.id, {
            x: simNode.x ?? 0,
            y: simNode.y ?? 0,
            z: simNode.z ?? 0,
          });
        }

        // Apply updates in batch
        const updatedNodes = s.data.nodes.map((node: NodeSpec) => {
          const update = nodeUpdates.get(node.id);
          if (update) {
            return {
              ...node,
              position: update
            };
          }
          return node;
        });

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

  protected onResume(): void {
    this.simulation.alpha(1).restart();
  }

  protected onPause(): void {
    this.simulation.stop();
  }

  protected onReheat(): void {
    this.simulation.alpha(0.5).restart();
  }

  protected cleanupLayout(): void {
    this.simulation.stop();
  }

  private createSimulation() {
    const nodes = this.graph.state.data?.nodes ?? [];
    const nodesCopy = nodes.map((node) => ({
      ...node,
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
      z: node.position?.z ?? 0,
    } as D3Node));

    this.simulation = forceSimulation<D3Node, D3Link>(nodesCopy)
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
