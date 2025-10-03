import { describe, expect, it } from 'vitest';
import { HUDPlugin, Spec } from '../../src';
import { createTestGraph, nextTick } from './test-utils';

describe('HUDPlugin', () => {
  it('should create and reactively update the HUD display', async () => {
    const spec: Spec = {
      data: {
        nodes: [{ id: 'n1', type: 'sphere' }],
        edges: [],
      },
      style: {},
      layout: { type: 'force-directed' },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: Math.PI / 2,
        theta: 0,
        distance: 100,
      },
      controls: {
        keyboard: {
          enabled: true,
          panSpeed: 0.1,
          zoomSpeed: 0.1,
          orbitSpeed: 0.1,
        },
      },
      performance: { instancingThreshold: 100 },
      interaction: {
        hoveredElementId: null,
        selectedElementIds: [],
      },
      hud: {
        visible: true,
        content: 'Initial Content',
      },
    } as any;
    const { graph, cleanup } = createTestGraph(spec);
    const hudPlugin = new HUDPlugin();
    hudPlugin.init(graph);
    hudPlugin.updateHUD();

    await nextTick();

    const hudContainer = (hudPlugin as any).hudContainer;
    expect(hudContainer).toBeDefined();
    expect(hudContainer.style.display).toBe('block');
    expect(hudContainer.innerHTML).toContain('Initial Content');

    graph.update({ hud: { content: 'Updated Content' } });
    hudPlugin.updateHUD();
    await nextTick();
    expect(hudContainer.innerHTML).toContain('Updated Content');

    graph.update({ hud: { visible: false } });
    hudPlugin.updateHUD();
    await nextTick();
    expect(hudContainer.style.display).toBe('none');

    cleanup();
  });
});
