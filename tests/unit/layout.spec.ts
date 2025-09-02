import { describe, it, expect, vi } from 'vitest';
import { createState } from '../../src/createState';
import { LayoutController } from '../../src/LayoutController';
import { Spec } from '../../src/types';

describe('LayoutController', () => {
  it('should apply force-directed layout and update node positions', async () => {
    const initialSpec: Spec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
        ],
      },
      layout: {
        type: 'force-directed',
      },
      camera: { position: { x: 0, y: 0, z: 5 }, zoom: 1 },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
      style: {},
      controls: {},
    };

    const { state, updateState } = createState(initialSpec);
    const layoutController = new LayoutController(state, updateState);

    // Give the simulation some time to run
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if node positions have changed
    const node1 = state.data.nodes.find(n => n.id === 'n1');
    const node2 = state.data.nodes.find(n => n.id === 'n2');

    expect(node1?.position?.x).not.toBeCloseTo(0);
    expect(node1?.position?.y).not.toBeCloseTo(0);
    expect(node2?.position?.x).not.toBeCloseTo(1);
    expect(node2?.position?.y).not.toBeCloseTo(1);

    layoutController.dispose();
  });

  it('should pause and resume the layout simulation', async () => {
    const initialSpec: Spec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
        ],
      },
      layout: {
        type: 'force-directed',
      },
      camera: { position: { x: 0, y: 0, z: 5 }, zoom: 1 },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
      style: {},
      controls: {},
    };

    const { state, updateState } = createState(initialSpec);
    const layoutController = new LayoutController(state, updateState);

    // Let it run for a bit
    await new Promise(resolve => setTimeout(resolve, 200));

    layoutController.pause();
    const pos1_paused_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

    // Wait some more, positions should not change significantly
    await new Promise(resolve => setTimeout(resolve, 200));
    const pos1_after_pause_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

    expect(pos1_after_pause_x).toBeCloseTo(pos1_paused_x || 0);

    layoutController.resume();
    // Let it run again
    await new Promise(resolve => setTimeout(resolve, 500));
    const pos1_after_resume_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

    expect(pos1_after_resume_x).not.toBeCloseTo(pos1_after_pause_x || 0);

    layoutController.dispose();
  });
});
