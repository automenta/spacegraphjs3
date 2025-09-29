import { GraphEventMap } from '../types';
/**
 * A lightweight event manager that wraps the `mitt` library.
 */
export declare class EventManager {
    private emitter;
    constructor();
    /**
     * Registers an event listener.
     * @param eventName - The name of the event to listen for.
     * @param listener - The callback function to execute when the event is fired.
     * @returns A function that removes the event listener when called.
     */
    on<Key extends keyof GraphEventMap>(eventName: Key, listener: (payload: GraphEventMap[Key]) => void): () => void;
    /**
     * Emits an event.
     * @param eventName - The name of the event to emit.
     * @param payload - The payload to pass to the event listeners.
     */
    emit<Key extends keyof GraphEventMap>(eventName: Key, ...args: GraphEventMap[Key] extends void ? [] : [payload: GraphEventMap[Key]]): void;
    /**
     * Removes all event listeners.
     */
    dispose(): void;
}
