import { SpaceGraph } from '../../src/core/SpaceGraph';
import { Spec } from '../../src/types';

import { vi } from 'vitest';
import { RenderingManager } from '../mocks/RenderingManager';
import { DataManager } from '../../src/managers/DataManager';
import { EventManager } from '../../src/managers/EventManager';

export const createTestGraph = (initialSpec: Spec) => {
  const containerId = `test-container-${Math.random().toString(36).substring(7)}`;
  const container = document.createElement('div');
  container.id = containerId;
  document.body.appendChild(container);

  const mockInitManagers = vi
    .spyOn(SpaceGraph.prototype as any, 'initManagers')
    .mockImplementation(function (this: SpaceGraph) {
      this.renderingManager = new RenderingManager() as any;
      this.dataManager = new DataManager(this);
      this.eventManager = new EventManager();
    });

  const graph = new SpaceGraph(`#${containerId}`, initialSpec);

  mockInitManagers.mockRestore();

  const cleanup = () => {
    graph.destroy();
    document.body.removeChild(container);
  };

  return {
    graph,
    container,
    cleanup,
  };
};

export const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));
