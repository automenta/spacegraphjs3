type Listener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Listener[]> = new Map();

  on(eventName: string, listener: Listener): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(listener);

    // Return a function to unsubscribe
    return () => this.off(eventName, listener);
  }

  off(eventName:string, listener: Listener) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(eventName: string, ...args: any[]) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      // Create a copy in case a listener unsubscribes itself
      [...listeners].forEach(listener => listener(...args));
    }
  }

  dispose() {
    this.events.clear();
  }
}
