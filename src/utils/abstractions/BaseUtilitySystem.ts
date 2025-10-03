import { Logger } from '../Logger';

/**
 * Base abstraction for all utility systems
 * Provides common interface and lifecycle management
 */

export interface IUtilitySystem {
  /**
   * Initialize the utility system
   */
  init(): void;

  /**
   * Update the utility system
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime: number): void;

  /**
   * Set performance mode
   * @param enabled - Whether to enable performance mode
   */
  setPerformanceMode(enabled: boolean): void;

  /**
   * Dispose of all resources
   */
  dispose(): void;

  /**
   * Check if the system is initialized
   */
  isInitialized(): boolean;

  /**
   * Get the system name
   */
  getName(): string;
}

/**
 * Base class for all utility systems
 * Provides common functionality and lifecycle management
 */
export abstract class BaseUtilitySystem implements IUtilitySystem {
  protected initialized = false;
  protected performanceMode = false;
  protected readonly name: string;
  protected readonly logger: Logger;

  constructor(name: string) {
    this.name = name;
    this.logger = Logger.getInstance();
  }

  public init(): void {
    if (this.initialized) {
      this.logger.warn(this.name, `${this.name} system is already initialized`);
      return;
    }
    try {
      this.onInit();
      this.initialized = true;
      this.logger.info(
        this.name,
        `${this.name} system initialized successfully`
      );
    } catch (error) {
      this.logger.error(
        this.name,
        `Failed to initialize ${this.name} system`,
        error
      );
      throw error;
    }
  }

  public update(deltaTime: number): void {
    if (!this.initialized) {
      this.logger.warn(this.name, `${this.name} system is not initialized`);
      return;
    }

    try {
      this.onUpdate(deltaTime);
    } catch (error) {
      this.logger.error(this.name, `Error updating ${this.name} system`, error);
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }

  public setPerformanceMode(enabled: boolean): void {
    try {
      this.performanceMode = enabled;
      this.onPerformanceModeChanged(enabled);
      this.logger.info(
        this.name,
        `Performance mode ${enabled ? 'enabled' : 'disabled'} for ${this.name} system`
      );
    } catch (error) {
      this.logger.error(
        this.name,
        `Error setting performance mode for ${this.name} system`,
        error
      );
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }

  public dispose(): void {
    if (!this.initialized) {
      return;
    }

    try {
      this.onDispose();
      this.logger.info(this.name, `${this.name} system disposed successfully`);
    } catch (error) {
      this.logger.error(
        this.name,
        `Error disposing ${this.name} system`,
        error
      );
      // Continue with cleanup even if onDispose fails
    } finally {
      this.initialized = false;
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getName(): string {
    return this.name;
  }

  /**
   * Called when the system is initialized
   * Override this method in subclasses
   */
  protected abstract onInit(): void;

  /**
   * Called when the system is updated
   * Override this method in subclasses
   */
  protected abstract onUpdate(deltaTime: number): void;

  /**
   * Called when performance mode is changed
   * Override this method in subclasses
   */
  protected abstract onPerformanceModeChanged(enabled: boolean): void;

  /**
   * Called when the system is disposed
   * Override this method in subclasses
   */
  protected abstract onDispose(): void;
}

/**
 * Utility system manager that coordinates multiple utility systems
 */
export class UtilitySystemManager {
  private systems: Map<string, IUtilitySystem> = new Map();
  private updateInterval = 16; // ~60 FPS
  private lastUpdateTime = 0;
  private running = false;
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Register a utility system
   */
  public registerSystem(system: IUtilitySystem): void {
    if (this.systems.has(system.getName())) {
      const error = new Error(
        `Utility system ${system.getName()} is already registered`
      );
      this.logger.error('UtilitySystemManager', 'Registration failed', error);
      throw error;
    }
    this.systems.set(system.getName(), system);
    this.logger.info(
      'UtilitySystemManager',
      `Registered system: ${system.getName()}`
    );
  }

  /**
   * Get a utility system by name
   */
  public getSystem(name: string): IUtilitySystem | undefined {
    return this.systems.get(name);
  }

  /**
   * Initialize all registered systems
   */
  public initAll(): void {
    this.logger.info('UtilitySystemManager', 'Initializing all systems');
    const errors: Error[] = [];

    for (const system of this.systems.values()) {
      try {
        system.init();
      } catch (error) {
        this.logger.error(
          'UtilitySystemManager',
          `Failed to initialize system: ${system.getName()}`,
          error
        );
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      const error = new Error(
        `Failed to initialize ${errors.length} systems. Check logs for details.`
      );
      this.logger.error(
        'UtilitySystemManager',
        'Initialization completed with errors',
        error
      );
      throw error;
    }

    this.logger.info(
      'UtilitySystemManager',
      'All systems initialized successfully'
    );
  }

  /**
   * Update all registered systems
   */
  public updateAll(deltaTime: number): void {
    const errors: Error[] = [];

    for (const system of this.systems.values()) {
      try {
        system.update(deltaTime);
      } catch (error) {
        this.logger.error(
          'UtilitySystemManager',
          `Error updating system: ${system.getName()}`,
          error
        );
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      const error = new Error(
        `Errors occurred while updating ${errors.length} systems. Check logs for details.`
      );
      this.logger.error(
        'UtilitySystemManager',
        'Update completed with errors',
        error
      );
      // Don't throw here as we want to continue updating other systems
    }
  }

  /**
   * Set performance mode for all systems
   */
  public setPerformanceModeAll(enabled: boolean): void {
    this.logger.info(
      'UtilitySystemManager',
      `Setting performance mode to ${enabled} for all systems`
    );
    const errors: Error[] = [];

    for (const system of this.systems.values()) {
      try {
        system.setPerformanceMode(enabled);
      } catch (error) {
        this.logger.error(
          'UtilitySystemManager',
          `Error setting performance mode for system: ${system.getName()}`,
          error
        );
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      const error = new Error(
        `Errors occurred while setting performance mode for ${errors.length} systems. Check logs for details.`
      );
      this.logger.error(
        'UtilitySystemManager',
        'Performance mode update completed with errors',
        error
      );
      // Don't throw here as we want to continue updating other systems
    }
  }

  /**
   * Dispose of all systems
   */
  public disposeAll(): void {
    this.logger.info('UtilitySystemManager', 'Disposing all systems');
    const errors: Error[] = [];

    for (const system of this.systems.values()) {
      try {
        system.dispose();
      } catch (error) {
        this.logger.error(
          'UtilitySystemManager',
          `Error disposing system: ${system.getName()}`,
          error
        );
        errors.push(error as Error);
      }
    }

    this.systems.clear();

    if (errors.length > 0) {
      const error = new Error(
        `Errors occurred while disposing ${errors.length} systems. Check logs for details.`
      );
      this.logger.error(
        'UtilitySystemManager',
        'Disposal completed with errors',
        error
      );
      // Don't throw here as we've already cleared the systems map
    }

    this.logger.info('UtilitySystemManager', 'All systems disposed');
  }

  /**
   * Start the update loop
   */
  public start(): void {
    if (this.running) {
      this.logger.warn(
        'UtilitySystemManager',
        'Update loop is already running'
      );
      return;
    }
    this.running = true;
    this.lastUpdateTime = performance.now();
    this.logger.info('UtilitySystemManager', 'Starting update loop');
    this.updateLoop();
  }

  /**
   * Stop the update loop
   */
  public stop(): void {
    if (!this.running) {
      this.logger.warn('UtilitySystemManager', 'Update loop is not running');
      return;
    }
    this.running = false;
    this.logger.info('UtilitySystemManager', 'Stopped update loop');
  }

  /**
   * Update loop that calls updateAll at regular intervals
   */
  private updateLoop(): void {
    if (!this.running) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    if (deltaTime >= this.updateInterval) {
      this.updateAll(deltaTime);
      this.lastUpdateTime = currentTime;
    }

    requestAnimationFrame(() => this.updateLoop());
  }

  /**
   * Get all system names
   */
  public getSystemNames(): string[] {
    return Array.from(this.systems.keys());
  }

  /**
   * Check if a system is registered
   */
  public hasSystem(name: string): boolean {
    return this.systems.has(name);
  }
}

/**
 * Factory for creating utility system instances
 */
export interface IUtilitySystemFactory {
  createSystem(config?: any): IUtilitySystem;
  getSystemType(): string;
}
