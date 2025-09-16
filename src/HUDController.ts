import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { Spec } from './types';

export class HUDController {
  private state: Store<Spec>;
  private hudContainer: HTMLDivElement;
  public statsContainer!: HTMLDivElement;
  private _dispose: () => void;

  constructor(container: HTMLElement, state: Store<Spec>) {
    this.state = state;
    this.hudContainer = document.createElement('div');
    this.hudContainer.style.position = 'absolute';
    this.hudContainer.style.top = '0';
    this.hudContainer.style.left = '0';
    this.hudContainer.style.width = '100%';
    this.hudContainer.style.height = '100%';
    this.hudContainer.style.pointerEvents = 'none';
    this.hudContainer.style.color = 'white';
    this.hudContainer.style.fontFamily = 'monospace';
    this.hudContainer.style.fontSize = '12px';
    container.appendChild(this.hudContainer);

    this._dispose = createRoot((dispose) => {
      this.initStatsDisplay();
      return dispose;
    });
  }

  private initStatsDisplay() {
    this.statsContainer = document.createElement('div');
    this.statsContainer.style.position = 'absolute';
    this.statsContainer.style.bottom = '10px';
    this.statsContainer.style.left = '10px';
    this.statsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.statsContainer.style.padding = '5px 10px';
    this.statsContainer.style.borderRadius = '5px';
    this.hudContainer.appendChild(this.statsContainer);

    createEffect(() => this.updateStats());
  }

  public updateStats() {
    const nodes = this.state.data?.nodes?.length || 0;
    const edges = this.state.data?.edges?.length || 0;
    const camera = this.state.camera;

    const cameraTarget = camera?.target
      ? `x:${camera.target.x.toFixed(2)}, y:${camera.target.y.toFixed(
          2
        )}, z:${camera.target.z.toFixed(2)}`
      : 'N/A';

    this.statsContainer.innerHTML = `
        Nodes: ${nodes}<br>
        Edges: ${edges}<br>
        <hr>
        Camera:<br>
        &nbsp;&nbsp;Phi: ${camera?.phi?.toFixed(2) ?? 'N/A'}<br>
        &nbsp;&nbsp;Theta: ${camera?.theta?.toFixed(2) ?? 'N/A'}<br>
        &nbsp;&nbsp;Distance: ${camera?.distance?.toFixed(2) ?? 'N/A'}<br>
        &nbsp;&nbsp;Target: ${cameraTarget}
      `;
  }

  public dispose() {
    this._dispose(); // Dispose of the SolidJS root and all its effects
    if (this.hudContainer.parentElement) {
      this.hudContainer.parentElement.removeChild(this.hudContainer);
    }
  }
}
