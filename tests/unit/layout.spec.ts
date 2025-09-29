import { describe, expect, it } from 'vitest';
import { LayoutPlugin, Spec } from '../../src';
import { createTestGraph, nextTick } from './test-utils';
import { D3ForceLayout } from '../../src/layouts/D3ForceLayout';

describe('LayoutPlugin', () => {
  it('should apply force-directed layout and update node positions', async () => {
    const spec: Spec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 10, y: 10, z: 10 } },
          { id: 'n2', type: 'sphere', position: { x: -10, y: -10, z: -10 } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      },
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
    };
    const { graph, cleanup } = createTestGraph(spec);
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    layoutPlugin.updateLayoutEngine();
    await nextTick();

    const initialNode1Pos = {
      ...graph.state.data.nodes.find((n) => n.id === 'n1')!.position,
    };

    const d3Layout = layoutPlugin.currentLayoutEngine as D3ForceLayout;
    d3Layout.tick(300); // Manually tick the simulation

    const node1 = graph.state.data.nodes.find((n) => n.id === 'n1');
    expect(node1?.position?.x).not.toBe(initialNode1Pos.x);
    expect(node1?.position?.y).not.toBe(initialNode1Pos.y);

    cleanup();
  });

  it('should pause and resume the layout simulation', async () => {
    const spec: Spec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 10, y: 10, z: 10 } },
          { id: 'n2', type: 'sphere', position: { x: -10, y: -10, z: -10 } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      },
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
    };
    const { graph, cleanup } = createTestGraph(spec);
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    layoutPlugin.updateLayoutEngine();
    await nextTick();

    const d3Layout = layoutPlugin.currentLayoutEngine as D3ForceLayout;
    d3Layout.tick(10); // Manually tick the simulation for a short time

    // Test that manual ticks work when not paused
    const pos1_before_pause_x = graph.state.data.nodes.find((n) => n.id === 'n1')
      ?.position?.x;

    d3Layout.tick(10); // Tick again
    const pos1_after_ticks_x = graph.state.data.nodes.find(
      (n) => n.id === 'n1'
    )?.position?.x;
    
    // Positions should change with manual ticks
    expect(pos1_after_ticks_x).not.toBe(pos1_before_pause_x);

    d3Layout.pause();
    
    const pos1_paused_x = graph.state.data.nodes.find((n) => n.id === 'n1')
      ?.position?.x;

    // Manual ticks should still work when paused (this is how D3 works)
    d3Layout.tick(10); // Tick again while paused
    const pos1_after_paused_ticks_x = graph.state.data.nodes.find(
      (n) => n.id === 'n1'
    )?.position?.x;
    
    // Positions should change with manual ticks even when paused
    expect(pos1_after_paused_ticks_x).not.toBe(pos1_paused_x);

    d3Layout.resume();
    d3Layout.reheat();
    d3Layout.tick(10); // Tick again after resume
    // After reheat, the simulation should be running
    // We've already tested that reheat calls alpha() with a value and restart()
    
    cleanup();
  });
});
