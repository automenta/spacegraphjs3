import mitt, { Emitter } from 'mitt';
import { GraphEventMap } from '../types';

/**
 * A lightweight event manager that wraps the `mitt` library.
 */
export class EventManager {
  private emitter: Emitter<GraphEventMap>;
  private disposed = false;

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
    listener: (payload: GraphEventMap[Key]) => void
  ): () => void {
    if (this.disposed) {
      console.warn('EventManager is disposed, cannot register listener');
      return () => {};
    }
    
    this.emitter.on(eventName, listener);
    return () => this.off(eventName, listener);
  }

  /**
   * Removes an event listener.
   * @param eventName - The name of the event.
   * @param listener - The callback function to remove.
   */
  public off<Key extends keyof GraphEventMap>(
    eventName: Key,
    listener: (payload: GraphEventMap[Key]) => void
  ): void {
    if (this.disposed) return;
    this.emitter.off(eventName, listener);
  }

  /**
   * Emits an event.
   * @param eventName - The name of the event to emit.
   * @param payload - The payload to pass to the event listeners.
   */
  public emit<Key extends keyof GraphEventMap>(
    eventName: Key,
    ...args: GraphEventMap[Key] extends void ? [] : [payload: GraphEventMap[Key]]
  ): void {
    if (this.disposed) {
      console.warn('EventManager is disposed, cannot emit event');
      return;
    }
    
    // Emit the event with proper typing
    // @ts-ignore - mitt types are tricky with conditional payloads
    this.emitter.emit(eventName, ...args);
  }

  /**
   * Removes all event listeners.
   */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.emitter.all.clear();
  }

  /**
   * Checks if the event manager is disposed.
   * @returns True if disposed, false otherwise.
   */
  public isDisposed(): boolean {
    return this.disposed;
  }
}
