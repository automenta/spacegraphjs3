import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createState } from '../../src/createState';
import { LayoutController } from '../../src/LayoutController';
import { Spec } from '../../src/types';

describe('LayoutController', () => {
  let state: ReturnType<typeof createState>['state'];
  let updateState: ReturnType<typeof createState>['updateState'];
  let layoutController: LayoutController;
  let disposeSolid: () => void;

  beforeEach(() => {
    disposeSolid = createRoot((_dispose) => {
      const initialSpec: Spec = {
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 10, y: 10, z: 10 } }],
          edges: [],
        },
        layout: { type: 'force-directed' },
        style: {},
        camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 10 },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      };

      const { state: s, updateState: u, setState } = createState(initialSpec);
      state = s;
      updateState = u;
      layoutController = new LayoutController(state, setState, () => {});
      layoutController.init();
      return _dispose;
    });
  });

  afterEach(() => {
    if (disposeSolid) {
      disposeSolid();
    }
  });

  it('should apply force-directed layout and update node positions', async () => {
    updateState({
      data: {
        nodes: [
          { id: 'n2', type: 'sphere' },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      },
    });
    await layoutController.ready;

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for simulation to tick

    const node1 = state.data.nodes.find((n) => n.id === 'n1');
    expect(node1?.position?.x).not.toBe(10);
    expect(node1?.position?.y).not.toBe(10);
  });

    it('should pause and resume the layout simulation', async () => {
      await layoutController.ready;

      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for initial movement
      const pos1_initial_x = state.data.nodes.find((n) => n.id === 'n1')?.position?.x;
      expect(pos1_initial_x).not.toBe(10);

      layoutController.pause();
      const pos1_paused_x = state.data.nodes.find((n) => n.id === 'n1')?.position?.x;

      await new Promise(resolve => setTimeout(resolve, 500)); // Wait while paused
      const pos1_after_paused_ticks_x = state.data.nodes.find(
        (n) => n.id === 'n1',
      )?.position?.x;
      expect(pos1_after_paused_ticks_x).toBe(pos1_paused_x);

      layoutController.resume();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait after resume
      const pos1_after_resume_x = state.data.nodes.find(
        (n) => n.id === 'n1',
      )?.position?.x;
      expect(pos1_after_resume_x).not.toBe(pos1_paused_x); // Position should have changed
    });
});
