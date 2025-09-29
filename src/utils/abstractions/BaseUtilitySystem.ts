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

  constructor(name: string) {
    this.name = name;
  }

  public init(): void {
    if (this.initialized) {
      console.warn(`${this.name} system is already initialized`);
      return;
    }
    this.onInit();
    this.initialized = true;
  }

  public update(deltaTime: number): void {
    if (!this.initialized) {
      console.warn(`${this.name} system is not initialized`);
      return;
    }
    this.onUpdate(deltaTime);
  }

  public setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled;
    this.onPerformanceModeChanged(enabled);
  }

  public dispose(): void {
    if (!this.initialized) {
      return;
    }
    this.onDispose();
    this.initialized = false;
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

  /**
   * Register a utility system
   */
  public registerSystem(system: IUtilitySystem): void {
    if (this.systems.has(system.getName())) {
      throw new Error(`Utility system ${system.getName()} is already registered`);
    }
    this.systems.set(system.getName(), system);
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
    for (const system of this.systems.values()) {
      system.init();
    }
  }

  /**
   * Update all registered systems
   */
  public updateAll(deltaTime: number): void {
    for (const system of this.systems.values()) {
      system.update(deltaTime);
    }
  }

  /**
   * Set performance mode for all systems
   */
  public setPerformanceModeAll(enabled: boolean): void {
    for (const system of this.systems.values()) {
      system.setPerformanceMode(enabled);
    }
  }

  /**
   * Dispose of all systems
   */
  public disposeAll(): void {
    for (const system of this.systems.values()) {
      system.dispose();
    }
    this.systems.clear();
  }

  /**
   * Start the update loop
   */
  public start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastUpdateTime = performance.now();
    this.updateLoop();
  }

  /**
   * Stop the update loop
   */
  public stop(): void {
    this.running = false;
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