export class EventManager {
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  public on(eventName: string, listener: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(listener);

    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  public emit(eventName: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  public dispose(): void {
    this.eventListeners.clear();
  }
}
