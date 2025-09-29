import { createEffect } from 'solid-js';
import { SpaceGraph } from '../core/SpaceGraph';
import { EdgeSpec, GroupSpec, NodeSpec } from '../types';

/**
 * Manages the data part of the state, providing efficient access to nodes, edges, and groups.
 */
export class DataManager {
  private graph: SpaceGraph;
  private nodes: Map<string, NodeSpec> = new Map();
  private edges: Map<string, EdgeSpec> = new Map();
  private groups: Map<string, GroupSpec> = new Map();

  constructor(graph: SpaceGraph) {
    this.graph = graph;

    createEffect(() => {
      this.nodes.clear();
      const nodes = this.graph.state.data?.nodes ?? [];
      for (const node of nodes) {
        this.nodes.set(node.id, node);
      }
    });

    createEffect(() => {
      this.edges.clear();
      const edges = this.graph.state.data?.edges ?? [];
      for (const edge of edges) {
        this.edges.set(edge.id, edge);
      }
    });

    createEffect(() => {
      this.groups.clear();
      const groups = this.graph.state.data?.groups ?? [];
      for (const group of groups) {
        this.groups.set(group.id, group);
      }
    });
  }

  /**
   * Retrieves a node by its ID.
   * @param id - The unique identifier of the node.
   * @returns The node's reactive state proxy, or undefined if not found.
   */
  public getNode(id: string): NodeSpec | undefined {
    return this.nodes.get(id);
  }

  /**
   * Retrieves an edge by its ID.
   * @param id - The unique identifier of the edge.
   * @returns The edge's reactive state proxy, or undefined if not found.
   */
  public getEdge(id: string): EdgeSpec | undefined {
    return this.edges.get(id);
  }

  /**
   * Retrieves a group by its ID.
   * @param id - The unique identifier of the group.
   * @returns The group's reactive state proxy, or undefined if not found.
   */
  public getGroup(id: string): GroupSpec | undefined {
    return this.groups.get(id);
  }

  /**
   * Retrieves a node, edge, or group by its ID.
   * @param id - The unique identifier of the element.
   * @returns The element's reactive state proxy, or undefined if not found.
   */
  public getElement(id: string): NodeSpec | EdgeSpec | GroupSpec | undefined {
    return this.getNode(id) || this.getEdge(id) || this.getGroup(id);
  }

  public dispose(): void {
    this.nodes.clear();
    this.edges.clear();
    this.groups.clear();
  }
}
