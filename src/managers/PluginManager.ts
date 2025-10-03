import { ISpaceGraphPlugin } from '../core/plugin';
import { ErrorHandler } from '../utils/ErrorHandler';
import { SpaceGraph } from '../core/SpaceGraph';

/**
 * Manages the initialization, execution, and lifecycle of SpaceGraph plugins
 */
export class PluginManager {
  private plugins: ISpaceGraphPlugin[] = [];
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Validates and initializes all plugins
   * @param plugins - Array of plugins to initialize
   * @param graph - The SpaceGraph instance
   * @returns Object with initialization results
   */
  async initializePlugins(
    plugins: ISpaceGraphPlugin[],
    graph: SpaceGraph
  ): Promise<{
    initialized: ISpaceGraphPlugin[];
    failed: Array<{ plugin: ISpaceGraphPlugin; error: Error }>;
  }> {
    this.validatePluginArray(plugins);

    const initializedPlugins: ISpaceGraphPlugin[] = [];
    const failedPlugins: Array<{ plugin: ISpaceGraphPlugin; error: Error }> = [];

    for (const plugin of plugins) {
      try {
        this.validatePlugin(plugin);
        await this.initializePlugin(plugin, graph);
        initializedPlugins.push(plugin);
        this.logPluginInitialization(plugin, true);
      } catch (error) {
        const initError = this.createPluginError(plugin, error as Error);
        failedPlugins.push({ plugin, error: initError });
        this.logPluginInitialization(plugin, false, initError);
      }
    }

    this.plugins = initializedPlugins;

    if (failedPlugins.length > 0) {
      throw this.createInitializationError(failedPlugins, initializedPlugins);
    }

    return { initialized: initializedPlugins, failed: failedPlugins };
  }

  /**
   * Executes a method on all plugins with error handling
   * @param methodName - The method to execute
   * @param args - Arguments to pass to the method
   */
  async executeOnAllPlugins<T extends any[]>(
    methodName: string,
    ...args: T
  ): Promise<void> {
    const promises = this.plugins.map(async (plugin) => {
      if (typeof (plugin as any)[methodName] === 'function') {
        await this.errorHandler.executePluginMethod(
          plugin.id,
          methodName,
          () => (plugin as any)[methodName](...args)
        );
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Disposes all plugins safely
   */
  async disposeAllPlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.dispose) {
        this.errorHandler.safeDispose(`Plugin:${plugin.id}`, plugin);
      }
    }
    this.plugins = [];
  }

  /**
   * Gets all registered plugins
   */
  getPlugins(): ISpaceGraphPlugin[] {
    return [...this.plugins];
  }

  /**
   * Finds a plugin by ID
   */
  getPluginById(id: string): ISpaceGraphPlugin | undefined {
    return this.plugins.find(plugin => plugin.id === id);
  }

  private validatePluginArray(plugins: ISpaceGraphPlugin[]): void {
    if (!Array.isArray(plugins)) {
      throw new Error(
        'Plugins must be an array of ISpaceGraphPlugin instances.\n' +
        '💡 Pass an empty array [] or an array of plugin instances'
      );
    }
  }

  private validatePlugin(plugin: ISpaceGraphPlugin): void {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error(
        'Plugin is not a valid object.\n' +
        '💡 Plugins must implement the ISpaceGraphPlugin interface'
      );
    }

    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new Error(
        'Plugin is missing a valid id property.\n' +
        '💡 Plugin id must be a non-empty string'
      );
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error(
        `Plugin "${plugin.id}" is missing a valid name property.\n` +
        '💡 Plugin name must be a non-empty string'
      );
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error(
        `Plugin "${plugin.id}" is missing a valid version property.\n` +
        '💡 Plugin version must be a non-empty string'
      );
    }

    if (typeof plugin.init !== 'function') {
      throw new Error(
        `Plugin "${plugin.id}" is missing the required init() method.\n` +
        '💡 Plugins must implement the ISpaceGraphPlugin interface'
      );
    }

    // Check for duplicate plugin IDs
    if (this.plugins.some(p => p.id === plugin.id)) {
      throw new Error(
        `Duplicate plugin ID "${plugin.id}".\n` +
        '💡 Each plugin must have a unique id'
      );
    }
  }

  private async initializePlugin(
    plugin: ISpaceGraphPlugin,
    graph: SpaceGraph
  ): Promise<void> {
    await plugin.init(graph);
  }

  private createPluginError(plugin: ISpaceGraphPlugin, error: Error): Error {
    return new Error(
      `Failed to initialize plugin "${plugin.id}" (${plugin.name} v${plugin.version}).\n` +
      `💡 Error: ${error.message}\n` +
      '💡 Check plugin dependencies and configuration'
    );
  }

  private logPluginInitialization(
    plugin: ISpaceGraphPlugin,
    success: boolean,
    error?: Error
  ): void {
    if (SpaceGraph.isDevelopmentMode()) {
      if (success) {
        console.log(
          `✅ Plugin "${plugin.id}" (${plugin.name} v${plugin.version}) initialized successfully`
        );
      } else if (error) {
        console.error(
          `❌ Plugin "${plugin.id}" initialization failed:`,
          error.message
        );
      }
    }
  }

  private createInitializationError(
    failedPlugins: Array<{ plugin: ISpaceGraphPlugin; error: Error }>,
    initializedPlugins: ISpaceGraphPlugin[]
  ): Error {
    const errorMessages = failedPlugins
      .map(({ error }, index) => `${index + 1}. ${error.message}`)
      .join('\n\n');

    return new Error(
      `Failed to initialize ${failedPlugins.length} out of ${failedPlugins.length + initializedPlugins.length} plugins:\n\n${errorMessages}\n\n` +
      `✅ ${initializedPlugins.length} plugins initialized successfully: ${initializedPlugins.map(p => p.id).join(', ')}`
    );
  }
}