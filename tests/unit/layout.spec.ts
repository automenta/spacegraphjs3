import { describe, it, expect } from 'vitest';
import { createState } from '../../src/createState';
import { LayoutController } from '../../src/LayoutController';
import { Spec } from '../../src/types';

// Use a mock for requestAnimationFrame if needed, although manual ticking avoids this.
// vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(() => cb(0), 16));

describe('LayoutController', () => {
  it('should apply force-directed layout and update node positions', () => {
    const initialSpec: Spec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      },
      layout: { type: 'force-directed' },
      camera: { position: { x: 0, y: 0, z: 5 }, zoom: 1 },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
      style: {},
      controls: {},
    };

    const { state } = createState(initialSpec);
    const layoutController = new LayoutController(state);

    // Manually step the simulation forward. This is more reliable than setTimeout.
    // @ts-ignore - tick is a testing-only method
    layoutController.tick(300);

    const node1 = state.data.nodes.find(n => n.id === 'n1');
    const node2 = state.data.nodes.find(n => n.id === 'n2');

    // Check that positions have moved from their initial state.
    expect(node1?.position?.x).not.toBeCloseTo(0);
    expect(node1?.position?.y).not.toBeCloseTo(0);
    expect(node2?.position?.x).not.toBeCloseTo(1);
    expect(node2?.position?.y).not.toBeCloseTo(1);

    layoutController.dispose();
  });

  it('should pause and resume the layout simulation', () => {
    const initialSpec: Spec = {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      },
      layout: { type: 'force-directed' },
      camera: { position: { x: 0, y: 0, z: 5 }, zoom: 1 },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
      style: {},
      controls: {},
    };

    const { state } = createState(initialSpec);
    const layoutController = new LayoutController(state);

    // Run for a bit
    // @ts-ignore
    layoutController.tick(150);

    layoutController.pause();
    const pos1_paused_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

    // Run some more, positions should not change because it's paused.
    // @ts-ignore
    layoutController.tick(150);
    const pos1_after_pause_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

    expect(pos1_after_pause_x).toBeCloseTo(pos1_paused_x!);

    layoutController.resume();
    // Run again
    // @ts-ignore
    layoutController.tick(150);
    const pos1_after_resume_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

    expect(pos1_after_resume_x).not.toBeCloseTo(pos1_after_pause_x!);

    layoutController.dispose();
  });
});
