import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createState } from '../../src/createState';
import { LayoutController } from '../../src/LayoutController';
import { Spec } from '../../src/types';

describe('LayoutController', () => {
  let dispose: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (dispose) {
      dispose();
    }
  });

  it('should apply force-directed layout and update node positions', () => {
    createRoot((_dispose) => {
      dispose = _dispose;
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: 'n1', type: 'sphere' },
            { id: 'n2', type: 'sphere' },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        },
        layout: { type: 'force-directed' }
      };

      const { state, setState } = createState(initialSpec);
      const layoutController = new LayoutController(state, setState, () => {});
      layoutController.init();

      // Tick the simulation manually
      layoutController.tick(50);

      const node1 = state.data.nodes.find((n) => n.id === 'n1');
      expect(node1?.position?.x).not.toBe(0);
      expect(node1?.position?.y).not.toBe(0);
    });
  });

  it('should pause and resume the layout simulation', () => {
    createRoot((_dispose) => {
      dispose = _dispose;
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
          ],
          edges: [],
        },
        layout: { type: 'force-directed' },
      };

      const { state, updateState, setState } = createState(initialSpec);
      const layoutController = new LayoutController(state, setState, () => {});
      layoutController.init();

      // Pause the layout
      layoutController.pause();
      layoutController.tick(50);
      const pos1_x = state.data.nodes.find((n) => n.id === 'n1')?.position?.x;
      expect(pos1_x).toBe(0);

      // Resume the layout
      layoutController.resume();
      layoutController.tick(50);
      const pos1_after_resume_x = state.data.nodes.find(
        (n) => n.id === 'n1',
      )?.position?.x;
      expect(pos1_after_resume_x).not.toBe(0);
    });
  });
});
