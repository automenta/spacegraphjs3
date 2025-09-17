import mitt, { Emitter } from 'mitt';

/**
 * A lightweight event manager that wraps the `mitt` library.
 */
export class EventManager {
  private emitter: Emitter<any>;

  constructor() {
    this.emitter = mitt();
  }

  /**
   * Registers an event listener.
   * @param eventName - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is fired.
   * @returns A function that removes the event listener when called.
   */
  public on(eventName: string, listener: (...args: any[]) => void) {
    this.emitter.on(eventName, listener);
    return () => this.emitter.off(eventName, listener);
  }

  /**
   * Emits an event.
   * @param eventName - The name of the event to emit.
   * @param args - The arguments to pass to the event listeners.
   */
  public emit(eventName: string, ...args: any[]) {
    this.emitter.emit(eventName, ...args);
  }

  /**
   * Removes all event listeners.
   */
  public dispose() {
    this.emitter.all.clear();
  }
}
