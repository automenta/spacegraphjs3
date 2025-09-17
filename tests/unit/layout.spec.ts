import { describe, it, expect } from 'vitest';
import { Spec } from '../../src/types';
import { createTestGraph, nextTick } from './test-utils';
import { LayoutPlugin } from '../../src/plugins/LayoutPlugin';
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
      layout: { type: 'force-directed' },
    } as any;
    const { graph, cleanup } = createTestGraph(spec);
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    await new Promise(resolve => setTimeout(resolve, 100));

    const initialNode1Pos = { ...graph.state.data.nodes.find((n) => n.id === 'n1')!.position };

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
      layout: { type: 'force-directed' },
    } as any;
    const { graph, cleanup } = createTestGraph(spec);
    const layoutPlugin = new LayoutPlugin();
    layoutPlugin.init(graph);
    await new Promise(resolve => setTimeout(resolve, 100));

    const d3Layout = layoutPlugin.currentLayoutEngine as D3ForceLayout;
    d3Layout.tick(100); // Manually tick the simulation
    const pos1_initial_x = graph.state.data.nodes.find((n) => n.id === 'n1')?.position?.x;

    d3Layout.pause();
    const pos1_paused_x = graph.state.data.nodes.find((n) => n.id === 'n1')?.position?.x;

    d3Layout.tick(100); // Tick again while paused
    const pos1_after_paused_ticks_x = graph.state.data.nodes.find((n) => n.id === 'n1')?.position?.x;
    expect(pos1_after_paused_ticks_x).toBe(pos1_paused_x);

    d3Layout.resume();
    d3Layout.tick(100); // Tick again after resume
    const pos1_after_resume_x = graph.state.data.nodes.find((n) => n.id === 'n1')?.position?.x;
    expect(pos1_after_resume_x).not.toBe(pos1_paused_x); // Position should have changed

    cleanup();
  });
});
