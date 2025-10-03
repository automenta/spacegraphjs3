import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine, NodeSpec } from '../types';
import { produce } from 'solid-js/store';

/**
 * Abstract base class for all layout engines.
 * Provides common functionality and enforces a consistent interface.
 */
export abstract class BaseLayoutEngine implements ILayoutEngine {
  protected graph!: SpaceGraph;
  protected isInitialized: boolean = false;
  protected isPaused: boolean = false;

  /**
   * Initialize the layout engine with the graph instance.
   * @param graph - The SpaceGraph instance
   */
  public init(graph: SpaceGraph): void {
    if (this.isInitialized) {
      console.warn('Layout engine is already initialized');
      return;
    }

    this.graph = graph;
    this.isInitialized = true;
    this.setupLayout();
  }

  /**
   * Dispose of the layout engine and clean up resources.
   */
  public dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    this.cleanupLayout();
    this.isInitialized = false;
  }

  /**
   * Resume the layout engine if it was paused.
   */
  public resume(): void {
    if (!this.isInitialized) {
      throw new Error('Layout engine must be initialized before resuming');
    }

    this.isPaused = false;
    this.onResume();
  }

  /**
   * Pause the layout engine.
   */
  public pause(): void {
    if (!this.isInitialized) {
      throw new Error('Layout engine must be initialized before pausing');
    }

    this.isPaused = true;
    this.onPause();
  }

  /**
   * Reheat the layout simulation (for force-directed layouts).
   */
  public reheat(): void {
    if (!this.isInitialized) {
      throw new Error('Layout engine must be initialized before reheating');
    }

    this.onReheat();
  }

  /**
   * Perform layout calculations for a specified number of iterations.
   * @param iterations - Number of iterations to perform
   */
  public abstract tick(iterations?: number): void;

  /**
   * Check if a node is pinned and should not be moved by the layout.
   * @param node - The node to check
   * @returns True if the node is pinned, false otherwise
   */
  protected isPinned(node: NodeSpec): boolean {
    // A node is considered pinned if it has a pinning property defined
    return node.pinning !== undefined;
  }

  /**
   * Helper method to update node positions using the reactive state system.
   * @param positions - Map of node IDs to new positions
   */
  protected updateNodePositions(positions: Map<string, { x: number; y: number; z: number }>): void {
    this.graph.updateStateWithProducer(
      produce((s) => {
        const updatedNodes = [...s.data.nodes];
        for (const [nodeId, position] of positions.entries()) {
          const nodeIndex = updatedNodes.findIndex((n) => n.id === nodeId);
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { ...position },
            };
          }
        }
        s.data.nodes = updatedNodes;
      })
    );
  }

  /**
   * Helper method to arrange nodes using calculated positions.
   * Handles both pinned and non-pinned nodes automatically.
   * @param calculatePositions - Function that takes node count and returns positions array
   */
  protected arrangeNodesWithPositions(
    calculatePositions: (count: number) => Array<{ x: number; y: number; z: number }>
  ): void {
    const nodes = this.graph.state.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const nonPinnedNodes = nodes.filter(node => !this.isPinned(node));
    const positions = calculatePositions(nonPinnedNodes.length);

    // Update node positions using the reactive state update mechanism
    this.graph.updateStateWithProducer(
      produce((s) => {
        const updatedNodes = [...s.data.nodes];
        let positionIndex = 0;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const nodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
          if (nodeIndex !== -1) {
            if (this.isPinned(node)) {
              // For pinned nodes, use the pinning position if available
              if (node.pinning && typeof node.pinning === 'object') {
                updatedNodes[nodeIndex] = {
                  ...updatedNodes[nodeIndex],
                  position: { ...node.pinning },
                };
              }
            } else {
              // For non-pinned nodes, use calculated positions
              updatedNodes[nodeIndex] = {
                ...updatedNodes[nodeIndex],
                position: positions[positionIndex],
              };
              positionIndex++;
            }
          }
        }
        s.data.nodes = updatedNodes;
      })
    );
  }

  /**
   * Setup the layout engine (called during initialization).
   * Override this method in subclasses to perform layout-specific setup.
   */
  protected setupLayout(): void {
    // Default implementation does nothing
  }

  /**
   * Cleanup the layout engine (called during disposal).
   * Override this method in subclasses to perform layout-specific cleanup.
   */
  protected cleanupLayout(): void {
    // Default implementation does nothing
  }

  /**
   * Called when the layout engine is resumed.
   * Override this method in subclasses to handle resume logic.
   */
  protected onResume(): void {
    // Default implementation does nothing
  }

  /**
   * Called when the layout engine is paused.
   * Override this method in subclasses to handle pause logic.
   */
  protected onPause(): void {
    // Default implementation does nothing
  }

  /**
   * Called when the layout engine is reheated.
   * Override this method in subclasses to handle reheat logic.
   */
  protected onReheat(): void {
    // Default implementation does nothing
  }
}
