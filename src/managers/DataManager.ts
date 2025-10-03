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
  private validationWarningsShown = new Set<string>();

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

      // Validate data integrity after all data is loaded
      this.validateDataIntegrity();
    });
  }

  /**
   * Validates data integrity and shows warnings for broken references
   */
  private validateDataIntegrity(): void {
    const nodes = Array.from(this.nodes.values());
    const edges = Array.from(this.edges.values());
    const groups = Array.from(this.groups.values());

    const nodeIds = new Set(nodes.map((node) => node.id));
    const groupIds = new Set(groups.map((group) => group.id));

    // Check edge references
    edges.forEach((edge) => {
      if (edge.source && !nodeIds.has(edge.source)) {
        this.showValidationWarning(
          `edge-${edge.id}-source-missing`,
          `Edge "${edge.id}" references non-existent source node "${edge.source}".\n` +
            '⚠️  This edge will not be rendered correctly.\n' +
            '💡 Ensure the source node exists or remove this edge'
        );
      }

      if (edge.target && !nodeIds.has(edge.target)) {
        this.showValidationWarning(
          `edge-${edge.id}-target-missing`,
          `Edge "${edge.id}" references non-existent target node "${edge.target}".\n` +
            '⚠️  This edge will not be rendered correctly.\n' +
            '💡 Ensure the target node exists or remove this edge'
        );
      }
    });

    // Check group node references
    groups.forEach((group) => {
      (group.nodes || []).forEach((nodeId) => {
        if (!nodeIds.has(nodeId)) {
          this.showValidationWarning(
            `group-${group.id}-node-${nodeId}-missing`,
            `Group "${group.id}" references non-existent node "${nodeId}".\n` +
              '⚠️  This may cause issues with group operations.\n' +
              '💡 Ensure all node ids in the group exist or remove them from the group'
          );
        }
      });
    });

    // Check node group references
    nodes.forEach((node) => {
      if (node.groupId && !groupIds.has(node.groupId)) {
        this.showValidationWarning(
          `node-${node.id}-group-missing`,
          `Node "${node.id}" references non-existent group "${node.groupId}".\n` +
            '⚠️  Group-based operations may not work correctly.\n' +
            '💡 Ensure the group exists or remove the groupId reference'
        );
      }

      // Check pinning group references
      if (typeof node.pinning === 'string' && !groupIds.has(node.pinning)) {
        this.showValidationWarning(
          `node-${node.id}-pinning-group-missing`,
          `Node "${node.id}" pinning references non-existent group "${node.pinning}".\n` +
            '⚠️  Node pinning may not work correctly.\n' +
            '💡 Ensure the group exists or use position coordinates for pinning'
        );
      }
    });

    // Check for duplicate IDs
    this.checkForDuplicateIds(nodes, edges, groups);
  }

  /**
   * Checks for duplicate IDs across nodes, edges, and groups
   */
  private checkForDuplicateIds(
    nodes: NodeSpec[],
    edges: EdgeSpec[],
    groups: GroupSpec[]
  ): void {
    const allIds = new Map<string, string>();

    // Check nodes
    nodes.forEach((node) => {
      if (allIds.has(node.id)) {
        this.showValidationWarning(
          `duplicate-id-${node.id}`,
          `Duplicate ID "${node.id}" found in nodes.\n` +
            '⚠️  This will cause conflicts and unpredictable behavior.\n' +
            '💡 Ensure all element IDs are unique across nodes, edges, and groups'
        );
      } else {
        allIds.set(node.id, 'node');
      }
    });

    // Check edges
    edges.forEach((edge) => {
      if (allIds.has(edge.id)) {
        const existingType = allIds.get(edge.id);
        this.showValidationWarning(
          `duplicate-id-${edge.id}`,
          `Duplicate ID "${edge.id}" found in edges (also exists as ${existingType}).\n` +
            '⚠️  This will cause conflicts and unpredictable behavior.\n' +
            '💡 Ensure all element IDs are unique across nodes, edges, and groups'
        );
      } else {
        allIds.set(edge.id, 'edge');
      }
    });

    // Check groups
    groups.forEach((group) => {
      if (allIds.has(group.id)) {
        const existingType = allIds.get(group.id);
        this.showValidationWarning(
          `duplicate-id-${group.id}`,
          `Duplicate ID "${group.id}" found in groups (also exists as ${existingType}).\n` +
            '⚠️  This will cause conflicts and unpredictable behavior.\n' +
            '💡 Ensure all element IDs are unique across nodes, edges, and groups'
        );
      } else {
        allIds.set(group.id, 'group');
      }
    });
  }

  /**
   * Shows a validation warning, but only once per warning type
   */
  private showValidationWarning(warningId: string, message: string): void {
    if (this.validationWarningsShown.has(warningId)) return;

    this.validationWarningsShown.add(warningId);
    console.warn(`🔗 Data Validation Warning [${warningId}]:\n${message}`);
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
    this.validationWarningsShown.clear();
  }
}
