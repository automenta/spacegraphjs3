import mitt, { Emitter } from 'mitt';
import { GraphEventMap } from '../types';

/**
 * A lightweight event manager that wraps the `mitt` library.
 */
export class EventManager {
  private emitter: Emitter<GraphEventMap>;

  constructor() {
    this.emitter = mitt<GraphEventMap>();
  }

  /**
   * Registers an event listener.
   * @param eventName - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is fired.
   * @returns A function that removes the event listener when called.
   */
  public on<Key extends keyof GraphEventMap>(
    eventName: Key,
    listener: (payload: GraphEventMap[Key]) => void,
  ) {
    this.emitter.on(eventName, listener);
    return () => this.emitter.off(eventName, listener);
  }

  /**
   * Emits an event.
   * @param eventName - The name of the event to emit.
   * @param payload - The payload to pass to the event listeners.
   */
  public emit<Key extends keyof GraphEventMap>(
    eventName: Key,
    payload: GraphEventMap[Key],
  ) {
    this.emitter.emit(eventName, payload);
  }

  /**
   * Removes all event listeners.
   */
  public dispose() {
    this.emitter.all.clear();
  }
}
