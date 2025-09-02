import { Store } from 'solid-js/store';
import { Spec } from './types';

export class HUDController {
  private state: Store<Spec>;
  private hudContainer: HTMLDivElement;
  private menuBar: HTMLDivElement;

  constructor(container: HTMLElement, state: Store<Spec>) {
    this.state = state;
    this.hudContainer = document.createElement('div');
    this.hudContainer.style.position = 'absolute';
    this.hudContainer.style.top = '0';
    this.hudContainer.style.left = '0';
    this.hudContainer.style.width = '100%';
    this.hudContainer.style.height = '100%';
    this.hudContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to the canvas
    container.appendChild(this.hudContainer);

    this.initMenuBar();
    // The REPL has been removed for security reasons.
    // this.initStatusBar(onExecute);
  }

  private initMenuBar() {
    this.menuBar = document.createElement('div');
    this.menuBar.style.position = 'absolute';
    this.menuBar.style.top = '10px';
    this.menuBar.style.left = '10px';
    this.menuBar.style.color = 'white';
    this.menuBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.menuBar.style.padding = '5px 10px';
    this.menuBar.style.borderRadius = '5px';
    this.menuBar.style.pointerEvents = 'auto'; // Re-enable pointer events for the menu
    this.menuBar.textContent = 'SpaceGraphJS v3.1';
    this.hudContainer.appendChild(this.menuBar);
  }

  public dispose() {
    if (this.hudContainer.parentElement) {
      this.hudContainer.parentElement.removeChild(this.hudContainer);
    }
  }
}
