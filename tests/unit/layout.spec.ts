import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'solid-js';
import { createState } from '../../src/createState';
import { LayoutController } from '../../src/LayoutController';
import { Spec } from '../../src/types';

describe('LayoutController', () => {
  it('should apply force-directed layout and update node positions', async () => {
    await createRoot(async (dispose) => {
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        },
        layout: { type: 'force-directed' },
        camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      };

      const { state } = createState(initialSpec);
      const mockEmit = vi.fn();
      const layoutController = new LayoutController(state, mockEmit);
      layoutController.init();

      await layoutController.ready;

      layoutController.tick(300);

      const node1 = state.data.nodes.find(n => n.id === 'n1');
      const node2 = state.data.nodes.find(n => n.id === 'n2');

      expect(node1?.position?.x).not.toBeCloseTo(0);
      expect(node1?.position?.y).not.toBeCloseTo(0);
      expect(node2?.position?.x).not.toBeCloseTo(1);
      expect(node2?.position?.y).not.toBeCloseTo(1);

      layoutController.dispose();
      dispose();
    });
  });

  it('should pause and resume the layout simulation', async () => {
    await createRoot(async (dispose) => {
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 1, y: 1, z: 1 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        },
        layout: { type: 'force-directed' },
        camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      };

      const { state } = createState(initialSpec);
      const mockEmit = vi.fn();
      const layoutController = new LayoutController(state, mockEmit);
      layoutController.init();

      await layoutController.ready;

      layoutController.tick(150);

      layoutController.pause();
      const pos1_paused_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

      layoutController.tick(150);
      const pos1_after_pause_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

      expect(pos1_after_pause_x).toBeCloseTo(pos1_paused_x!);

      layoutController.resume();
      layoutController.tick(150);
      const pos1_after_resume_x = state.data.nodes.find(n => n.id === 'n1')?.position?.x;

      expect(pos1_after_resume_x).not.toBeCloseTo(pos1_after_pause_x!);

      layoutController.dispose();
      dispose();
    });
  });
});
