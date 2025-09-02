import { Store } from 'solid-js/store';
import { Spec } from './types';

export class HUDController {
  private state: Store<Spec>;
  private hudContainer: HTMLDivElement;
  private menuBar: HTMLDivElement;
  private statusBar: HTMLDivElement;
  private replInput: HTMLInputElement;

  constructor(
    container: HTMLElement,
    state: Store<Spec>,
    onExecute: (command: string) => void
  ) {
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
    this.initStatusBar(onExecute);
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

  private initStatusBar(onExecute: (command: string) => void) {
    this.statusBar = document.createElement('div');
    this.statusBar.style.position = 'absolute';
    this.statusBar.style.bottom = '10px';
    this.statusBar.style.left = '10px';
    this.statusBar.style.right = '10px';
    this.statusBar.style.color = 'white';
    this.statusBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.statusBar.style.padding = '5px 10px';
    this.statusBar.style.borderRadius = '5px';
    this.statusBar.style.display = 'flex';
    this.statusBar.style.alignItems = 'center';
    this.statusBar.style.pointerEvents = 'auto'; // Re-enable pointer events

    const label = document.createElement('span');
    label.textContent = 'REPL:';
    label.style.marginRight = '10px';
    this.statusBar.appendChild(label);

    this.replInput = document.createElement('input');
    this.replInput.type = 'text';
    this.replInput.style.flex = '1';
    this.replInput.style.background = 'rgba(255, 255, 255, 0.2)';
    this.replInput.style.border = '1px solid #aaa';
    this.replInput.style.color = 'white';
    this.replInput.placeholder = "Try 'graph.camera.flyTo({ distance: 20 })'";
    this.statusBar.appendChild(this.replInput);

    this.replInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        onExecute(this.replInput.value);
        this.replInput.value = '';
      }
    });

    this.hudContainer.appendChild(this.statusBar);
  }

  public dispose() {
    if (this.hudContainer.parentElement) {
      this.hudContainer.parentElement.removeChild(this.hudContainer);
    }
  }
}
