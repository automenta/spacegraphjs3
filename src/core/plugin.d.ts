import { SpaceGraph } from './SpaceGraph';
/**
 * Defines the interface for a SpaceGraph plugin.
 * Plugins are used to extend the functionality of the core SpaceGraph library.
 */
export interface ISpaceGraphPlugin {
    /**
     * Initializes the plugin. This method is called by the SpaceGraph constructor.
     * @param graph - The SpaceGraph instance.
     */
    init(graph: SpaceGraph): void;
    /**
     * Disposes of the plugin's resources. This method is called by the SpaceGraph's destroy method.
     */
    dispose?(): void;
}
