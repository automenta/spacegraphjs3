import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createState } from '../../src/core/createState';
import { LayoutPlugin } from '../../src/plugins/LayoutPlugin';
import { Spec } from '../../src/types';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { EventManager } from '../../src/managers/EventManager';

describe('LayoutPlugin', () => {
  let state: ReturnType<typeof createState>['state'];
  let setState: ReturnType<typeof createState>['setState'];
  let layoutPlugin: LayoutPlugin;
  let disposeSolid: () => void;

  beforeEach(() => {
    disposeSolid = createRoot((_dispose) => {
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 10, y: 10, z: 10 } },
            { id: 'n2', type: 'sphere', position: { x: -10, y: -10, z: -10 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        },
        layout: { type: 'force-directed' },
      };

      const { state: s, setState: set, updateState } = createState(initialSpec);
      state = s;
      setState = set;

      const mockGraph = {
        state,
        setState,
        updateState,
        eventManager: new EventManager(),
      } as unknown as SpaceGraph;

      layoutPlugin = new LayoutPlugin();
      layoutPlugin.init(mockGraph);
      return _dispose;
    });
  });

  afterEach(() => {
    if (disposeSolid) {
      disposeSolid();
    }
  });

  it('should apply force-directed layout and update node positions', async () => {
    const initialNode1Pos = { ...state.data.nodes.find((n) => n.id === 'n1')!.position };

    layoutPlugin.resume();
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for simulation to tick
    layoutPlugin.pause();

    const node1 = state.data.nodes.find((n) => n.id === 'n1');
    expect(node1?.position?.x).not.toBe(initialNode1Pos.x);
    expect(node1?.position?.y).not.toBe(initialNode1Pos.y);
  });

  it('should pause and resume the layout simulation', async () => {
    layoutPlugin.resume();
    await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for initial movement
    const pos1_initial_x = state.data.nodes.find((n) => n.id === 'n1')?.position?.x;

    layoutPlugin.pause();
    const pos1_paused_x = state.data.nodes.find((n) => n.id === 'n1')?.position?.x;

    await new Promise((resolve) => setTimeout(resolve, 200)); // Wait while paused
    const pos1_after_paused_ticks_x = state.data.nodes.find((n) => n.id === 'n1')?.position?.x;
    expect(pos1_after_paused_ticks_x).toBe(pos1_paused_x);

    layoutPlugin.resume();
    await new Promise((resolve) => setTimeout(resolve, 200)); // Wait after resume
    const pos1_after_resume_x = state.data.nodes.find((n) => n.id === 'n1')?.position?.x;
    expect(pos1_after_resume_x).not.toBe(pos1_paused_x); // Position should have changed
  });
});
