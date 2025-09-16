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
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 10, y: 10, z: 10 } },
          ],
          edges: [],
        },
        layout: { type: 'force-directed' },
        style: {},
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: 0,
          theta: 0,
          distance: 10,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 0.1,
            zoomSpeed: 0.1,
            orbitSpeed: 0.02,
          },
        },
        performance: {
          instancingThreshold: 100,
        },
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

  it('should apply a placeholder layout and update node positions', async () => {
    updateState({
      data: {
        nodes: [{ id: 'n2', type: 'sphere' }],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      },
    });
    await layoutController.ready;

    // With the placeholder layout, positions should be set (randomly if not provided)
    const node1 = state.data.nodes.find((n) => n.id === 'n1');
    expect(node1?.position).toBeDefined();
    expect(node1?.position?.x).not.toBe(10); // Should have changed from initial

    const node2 = state.data.nodes.find((n) => n.id === 'n2');
    expect(node2?.position).toBeDefined();
  });
});