import { SpaceGraph } from './SpaceGraph';
import { SpecUpdate } from '../types';

/**
 * Defines the interface for a SpaceGraph plugin.
 * Plugins are used to extend the functionality of the core SpaceGraph library.
 */
export interface ISpaceGraphPlugin {
  /**
   * Unique identifier for the plugin
   */
  readonly id: string;

  /**
   * Human-readable name for the plugin
   */
  readonly name: string;

  /**
   * Version of the plugin
   */
  readonly version: string;

  /**
   * Description of what the plugin does
   */
  readonly description?: string;

  /**
   * Initializes the plugin. This method is called by the SpaceGraph constructor.
   * @param graph - The SpaceGraph instance.
   */
  init(graph: SpaceGraph): void;

  /**
   * Called when the graph state is updated.
   * @param update - The partial state update
   */
  onStateUpdate?(update: SpecUpdate): void;

  /**
   * Called on each animation frame before rendering.
   * @param delta - Time since last frame in seconds
   */
  onPreRender?(delta: number): void;

  /**
   * Called on each animation frame after rendering.
   * @param delta - Time since last frame in seconds
   */
  onPostRender?(delta: number): void;

  /**
   * Disposes of the plugin's resources. This method is called by the SpaceGraph's destroy method.
   */
  dispose?(): void;
}
