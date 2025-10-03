import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine, NodeSpec } from '../types';

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
