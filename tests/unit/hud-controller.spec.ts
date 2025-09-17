import { describe, it, expect } from 'vitest';
import { createStore, Store } from 'solid-js/store';
import { Spec } from '../../src/types';
import { HUDPlugin } from '../../src/plugins/HUDPlugin';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { createRoot } from 'solid-js';

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

const createMockState = (): [Store<Spec>, (spec: Partial<Spec>) => void] => {
  const [state, setState] = createStore<Spec>({
    data: {
      nodes: [{ id: 'n1', type: 'sphere' }],
      edges: [],
    },
    hud: {
      visible: true,
      content: 'Initial Content'
    }
  });
  return [state, setState];
};

describe('HUDPlugin', () => {
  it('should create and reactively update the HUD display', async () => {
    await createRoot(async (dispose) => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const [state, setState] = createMockState();

      const mockGraph = {
        state,
        renderingManager: {
          getContainer: () => container,
        },
      } as unknown as SpaceGraph;

      const hudPlugin = new HUDPlugin();
      hudPlugin.init(mockGraph);

      await nextTick();

      const hudContainer = (hudPlugin as any).hudContainer;
      expect(hudContainer).toBeDefined();
      expect(hudContainer.style.display).toBe('block');
      expect(hudContainer.innerHTML).toContain('Initial Content');

      setState({ hud: { ...state.hud, content: 'Updated Content' } });
      await nextTick();
      expect(hudContainer.innerHTML).toContain('Updated Content');

      setState({ hud: { ...state.hud, visible: false } });
      await nextTick();
      expect(hudContainer.style.display).toBe('none');

      hudPlugin.dispose();
      document.body.removeChild(container);
      dispose();
    });
  });
});
