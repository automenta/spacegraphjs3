import { describe, expect, it, vi } from 'vitest';
import { createTestGraph } from './test-utils';
import { DataManager } from '../../src/managers/DataManager';
import { EventManager } from '../../src/managers/EventManager';

describe('SpaceGraph', () => {
  it('should call dispose on all managers when destroy is called', () => {
    const dataManagerDisposeSpy = vi.spyOn(DataManager.prototype, 'dispose');
    const eventManagerDisposeSpy = vi.spyOn(EventManager.prototype, 'dispose');

    const { graph, cleanup } = createTestGraph({
      data: { nodes: [], edges: [] },
      style: {},
      layout: { type: 'force-directed' },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: 0,
        theta: 0,
        distance: 100,
      },
      controls: {
        keyboard: {
          enabled: true,
          panSpeed: 1,
          zoomSpeed: 1,
          orbitSpeed: 1,
        },
      },
      performance: {
        instancingThreshold: 1000,
      },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
    });

    // The mock rendering manager's dispose is already a spy
    const renderingManagerDisposeSpy = graph.render.dispose;

    graph.destroy();

    expect(dataManagerDisposeSpy).toHaveBeenCalledOnce();
    expect(eventManagerDisposeSpy).toHaveBeenCalledOnce();
    expect(renderingManagerDisposeSpy).toHaveBeenCalledOnce();

    // a second destroy should not call them again
    graph.destroy();

    expect(dataManagerDisposeSpy).toHaveBeenCalledOnce();
    expect(eventManagerDisposeSpy).toHaveBeenCalledOnce();
    expect(renderingManagerDisposeSpy).toHaveBeenCalledOnce();

    cleanup();
  });
});
