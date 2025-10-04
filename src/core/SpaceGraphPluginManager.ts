import { ISpaceGraphPlugin } from './plugin';
import { CameraPlugin } from '../plugins/CameraPlugin';

/**
 * Manages plugins for SpaceGraph
 */
export class SpaceGraphPluginManager {
  private plugins: ISpaceGraphPlugin[] = [];
  public cameraPlugin?: CameraPlugin;

  /**
   * Initialize plugins
   */
  initializePlugins(
    plugins: ISpaceGraphPlugin[],
    spaceGraphInstance: any
  ): void {
    // Validate plugins array
    if (!Array.isArray(plugins)) {
      throw new Error(
        'Plugins must be an array of ISpaceGraphPlugin instances.\n' +
          '💡 Pass an empty array [] or an array of plugin instances'
      );
    }

    this.plugins = plugins;
    const initializedPlugins: string[] = [];
    const failedPlugins: Array<{ plugin: ISpaceGraphPlugin; error: Error }> =
      [];

    for (let i = 0; i < this.plugins.length; i++) {
      const plugin = this.plugins[i];

      // Validate plugin structure
      if (!plugin || typeof plugin !== 'object') {
        const error = new Error(
          `Plugin at index ${i} is not a valid object.\n` +
            '💡 Plugins must implement the ISpaceGraphPlugin interface'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (!plugin.id || typeof plugin.id !== 'string') {
        const error = new Error(
          `Plugin at index ${i} is missing a valid id property.\n` +
            '💡 Plugin id must be a non-empty string'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (!plugin.name || typeof plugin.name !== 'string') {
        const error = new Error(
          `Plugin "${plugin.id}" is missing a valid name property.\n` +
            '💡 Plugin name must be a non-empty string'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (!plugin.version || typeof plugin.version !== 'string') {
        const error = new Error(
          `Plugin "${plugin.id}" is missing a valid version property.\n` +
            '💡 Plugin version must be a non-empty string'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      if (typeof plugin.init !== 'function') {
        const error = new Error(
          `Plugin "${plugin.id}" is missing the required init() method.\n` +
            '💡 Plugins must implement the ISpaceGraphPlugin interface'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      // Check for duplicate plugin IDs
      if (initializedPlugins.includes(plugin.id)) {
        const error = new Error(
          `Duplicate plugin ID "${plugin.id}".\n` +
            '💡 Each plugin must have a unique id'
        );
        failedPlugins.push({ plugin, error });
        continue;
      }

      try {
        plugin.init(spaceGraphInstance);
        initializedPlugins.push(plugin.id);

        if (plugin instanceof CameraPlugin) {
          this.cameraPlugin = plugin;
        }

        // Log successful initialization in development mode
        if (SpaceGraphPluginManager.isDevelopmentMode()) {
          console.log(
            `✅ Plugin "${plugin.id}" (${plugin.name} v${plugin.version}) initialized successfully`
          );
        }
      } catch (error) {
        const initError = new Error(
          `Failed to initialize plugin "${plugin.id}" (${plugin.name} v${plugin.version}).\n` +
            `💡 Error: ${(error as Error).message}\n` +
            '💡 Check plugin dependencies and configuration'
        );
        failedPlugins.push({ plugin, error: initError });
      }
    }

    // If any plugins failed to initialize, throw an error with details
    if (failedPlugins.length > 0) {
      const errorMessages = failedPlugins
        .map(({ error }, index) => {
          return `${index + 1}. ${error.message}`;
        })
        .join('\n\n');

      throw new Error(
        `Failed to initialize ${failedPlugins.length} out of ${plugins.length} plugins:\n\n${errorMessages}\n\n` +
          `✅ ${initializedPlugins.length} plugins initialized successfully: ${initializedPlugins.join(', ')}`
      );
    }
  }

  /**
   * Get all plugins
   */
  getPlugins(): ISpaceGraphPlugin[] {
    return this.plugins;
  }

  /**
   * Get camera plugin
   */
  getCameraPlugin(): CameraPlugin | undefined {
    return this.cameraPlugin;
  }

  /**
   * Notify plugins of state updates
   */
  notifyStateUpdate(spec: any): void {
    for (const plugin of this.plugins) {
      if (plugin.onStateUpdate) {
        try {
          plugin.onStateUpdate(spec);
        } catch (error) {
          console.warn(
            `Plugin ${plugin.id} failed to handle state update, continuing without it:`,
            error
          );
          // Continue with other plugins rather than failing completely
        }
      }
    }
  }

  /**
   * Dispose all plugins
   */
  disposePlugins(): void {
    for (const plugin of this.plugins) {
      if (plugin.dispose) {
        plugin.dispose();
      }
    }
  }

  /**
   * Checks if we're running in development mode
   */
  private static isDevelopmentMode(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }
}