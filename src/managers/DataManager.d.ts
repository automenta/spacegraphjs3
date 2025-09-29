import { SpaceGraph } from '../core/SpaceGraph';
import { EdgeSpec, NodeSpec } from '../types';
/**
 * Manages the data part of the state, providing efficient access to nodes and edges.
 */
export declare class DataManager {
    private graph;
    private nodes;
    private edges;
    constructor(graph: SpaceGraph);
    /**
     * Retrieves a node by its ID.
     * @param id - The unique identifier of the node.
     * @returns The node's reactive state proxy, or undefined if not found.
     */
    getNode(id: string): NodeSpec | undefined;
    /**
     * Retrieves an edge by its ID.
     * @param id - The unique identifier of the edge.
     * @returns The edge's reactive state proxy, or undefined if not found.
     */
    getEdge(id: string): EdgeSpec | undefined;
    /**
     * Retrieves a node or edge by its ID.
     * @param id - The unique identifier of the element.
     * @returns The element's reactive state proxy, or undefined if not found.
     */
    getElement(id: string): NodeSpec | EdgeSpec | undefined;
    dispose(): void;
}
