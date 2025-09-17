import * as THREE from 'three';
import { createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { createState } from './createState';
import { Spec, SpecUpdate } from '../types';
import { RenderingManager } from '../managers/RenderingManager';
import { EventManager } from '../managers/EventManager';
import { DataManager } from '../managers/DataManager';
import { ISpaceGraphPlugin } from './plugin';

/**
 * The main class for creating and managing a SpaceGraph visualization.
 * It orchestrates the renderer, interaction, layout, and other controllers.
 */
export class SpaceGraph {
  private container: HTMLElement;
  /**
   * The reactive state of the graph, powered by a SolidJS store.
   * Direct modifications to this object will trigger updates in the visualization.
   * @public
   */
  public state!: Store<Spec>;
  public updateState!: (spec: SpecUpdate) => void;
  public setState!: (fn: (prevState: Spec) => Spec) => void;

  public renderingManager!: RenderingManager;
  public eventManager!: EventManager;
  public dataManager!: DataManager;

  private plugins: ISpaceGraphPlugin[] = [];
  private dispose: () => void;

  constructor(containerSelector: string, initialSpec: Spec, plugins: ISpaceGraphPlugin[] = []) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container element '${containerSelector}' not found.`);
    }
    this.container = container as HTMLElement;

    // The `createRoot` ensures that all SolidJS reactivity is properly disposed of
    // when the `destroy` method is called.
    this.dispose = createRoot((dispose) => {
      this.initReactiveState(initialSpec);
      this.initManagers();
      this.initPlugins(plugins);

      // Return the dispose function so it can be called later in `destroy()`
      return dispose;
    });
  }

  /**
   * Initializes the core reactive state using SolidJS.
   */
  private initReactiveState(initialSpec: Spec) {
    const { state, updateState, setState } = createState(initialSpec);
    this.state = state;
    this.updateState = updateState;
    this.setState = setState;
  }

  /**
   * Initializes the core managers for rendering and events.
   */
  private initManagers() {
    this.renderingManager = new RenderingManager(this, this.container);
    this.eventManager = new EventManager();
    this.dataManager = new DataManager(this);
  }

  /**
   * Initializes the plugins.
   */
  private initPlugins(plugins: ISpaceGraphPlugin[]) {
    this.plugins = plugins;
    for (const plugin of this.plugins) {
      plugin.init(this);
    }
  }

  /**
   * Registers an event listener.
   * @param eventName - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is fired.
   * @returns A function that removes the event listener when called.
   */
  public on(eventName: string, listener: (...args: any[]) => void) {
    return this.eventManager.on(eventName, listener);
  }

  /**
   * Retrieves a node or edge by its ID.
   * @param id - The unique identifier of the element.
   * @returns The element's reactive state proxy, or undefined if not found.
   */
  public getElement(id: string) {
    return this.dataManager.getElement(id);
  }

  /**
   * Updates the graph with a new (partial) specification.
   * Changes are merged into the existing state, and the visualization updates reactively.
   * @param spec - A partial `Spec` object with the properties to update.
   */
  public update(spec: SpecUpdate) {
    this.updateState(spec);
  }

  /**
   * Cleans up all resources, including SolidJS effects, Three.js objects,
   * and event listeners, to prevent memory leaks.
   */
  public destroy() {
    this.dispose(); // Dispose SolidJS root and all effects
    for (const plugin of this.plugins) {
      if (plugin.dispose) {
        plugin.dispose();
      }
    }
    this.renderingManager.dispose();
    this.eventManager.dispose();
  }
}
