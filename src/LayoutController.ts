import { createRoot, createEffect } from 'solid-js';
import { Store, produce } from 'solid-js/store';
import { Spec, GraphElement, Edge, Node } from './types';

export class LayoutController {
  private setState: (fn: (prevState: Spec) => Spec) => void;
  public ready: Promise<void>;
  private resolveReady!: () => void;
  private emit: (eventName: string, ...args: any[]) => void;
  private disposeEffect?: () => void;
  private state: Store<Spec>;

  constructor(
    state: Store<Spec>,
    setState: (fn: (prevState: Spec) => Spec) => void,
    emit: (eventName: string, ...args: any[]) => void
  ) {
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.state = state;
    this.setState = setState;
    this.emit = emit;
  }

  public init() {
    this.disposeEffect = createRoot((dispose) => {
      // Placeholder layout: simply resolve ready immediately
      this.resolveReady();

      // Effect to react to changes in nodes and edges and update positions
      createEffect(() => {
        const nodes = this.state.data?.nodes || [];
        if (nodes.length > 0) {
          this.setState(
            produce((s: Spec) => {
              s.data.nodes.forEach((node) => {
                // Always apply a new random position for this placeholder layout
                node.position = {
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 100,
                  z: (Math.random() - 0.5) * 100,
                };
              });
            })
          );
        }
      });

      return dispose;
    });
  }

  public pinNodes(nodeIds: string[]) {
    // Placeholder: no-op
  }

  public unpinNodes(nodeIds: string[]) {
    // Placeholder: no-op
  }

  public dispose() {
    if (this.disposeEffect) {
      this.disposeEffect();
    }
  }
}