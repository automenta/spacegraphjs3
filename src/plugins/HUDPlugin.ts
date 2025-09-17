import { createEffect } from 'solid-js';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';

/**
 * A plugin that manages the Heads-Up Display (HUD).
 */
export class HUDPlugin implements ISpaceGraphPlugin {
  private graph!: SpaceGraph;
  private hudContainer!: HTMLElement;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    const container = this.graph.renderingManager.getContainer();
    this.hudContainer = document.createElement('div');
    this.hudContainer.style.position = 'absolute';
    this.hudContainer.style.top = '10px';
    this.hudContainer.style.left = '10px';
    this.hudContainer.style.color = 'white';
    container.appendChild(this.hudContainer);

    createEffect(() => this.updateHUD());
  }

  public updateHUD(): void {
    const hudState = this.graph.state.hud;
    if (hudState?.visible) {
      this.hudContainer.style.display = 'block';
      this.hudContainer.innerHTML = `
        <div>${hudState.content}</div>
      `;
    } else {
      this.hudContainer.style.display = 'none';
    }
  }

  public dispose(): void {
    if (this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
  }
}
