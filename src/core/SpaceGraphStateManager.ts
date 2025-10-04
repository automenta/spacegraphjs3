import { Store } from 'solid-js/store';
import { Spec, SpecUpdate } from '../types';

/**
 * Manages SpaceGraph state operations
 */
export class SpaceGraphStateManager {
  public state!: Store<Spec>;
  private internalUpdateState!: (spec: SpecUpdate) => void;
  private internalSetState!: (fn: (prevState: Spec) => Spec) => void;

  /**
   * Initialize reactive state
   */
  initializeState(
    initialSpec: Spec,
    updateFn: (spec: SpecUpdate) => void,
    setFn: (fn: (prevState: Spec) => Spec) => void
  ): void {
    this.state = initialSpec as Store<Spec>;
    this.internalUpdateState = updateFn;
    this.internalSetState = setFn;
  }

  /**
   * Update state with partial spec
   */
  updateState(spec: SpecUpdate): void {
    this.internalUpdateState(spec);
  }

  /**
   * Update state with producer function
   */
  updateStateWithProducer(fn: (prevState: Spec) => Spec): void {
    this.internalSetState(fn);
  }

  /**
   * Get current state
   */
  getState(): Store<Spec> {
    return this.state;
  }

  /**
   * Get update state function
   */
  getUpdateStateFn(): (spec: SpecUpdate) => void {
    return this.internalUpdateState;
  }

  /**
   * Get set state function
   */
  getSetStateFn(): (fn: (prevState: Spec) => Spec) => void {
    return this.internalSetState;
  }
}