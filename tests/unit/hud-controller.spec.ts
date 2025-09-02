import { describe, it, expect } from 'vitest';
import { createStore, Store } from 'solid-js/store';
import { Spec } from '../../src/types';
import { HUDController } from '../../src/HUDController';

const createMockState = (): [Store<Spec>, (spec: Partial<Spec>) => void] => {
  const [state, setState] = createStore<Spec>({
    data: {
      nodes: [{ id: 'n1', type: 'sphere' }],
      edges: [],
    },
    camera: {
      target: { x: 0, y: 0, z: 0 },
      phi: 1.57,
      theta: 1.57,
      distance: 10,
    },
  });
  return [state, setState];
};

describe('HUDController', () => {
  it('should create and reactively update the stats display', () => {
    const container = document.createElement('div');
    const [state, setState] = createMockState();
    const hudController = new HUDController(container, state);

    // Manually call updateStats to populate the HUD for the first time
    hudController.updateStats();

    const statsContainer = hudController.statsContainer;
    expect(statsContainer).toBeDefined();

    // Check initial content
    expect(statsContainer.innerHTML).toContain('Nodes: 1');
    expect(statsContainer.innerHTML).toContain('Edges: 0');
    expect(statsContainer.innerHTML).toContain('Distance: 10.00');

    // Update state and check for reactive update by calling updateStats again
    setState({ camera: { distance: 20 } });
    hudController.updateStats();
    expect(statsContainer.innerHTML).toContain('Distance: 20.00');

    setState({ data: { nodes: [...state.data.nodes, { id: 'n2', type: 'sphere' }] } });
    hudController.updateStats();
    expect(statsContainer.innerHTML).toContain('Nodes: 2');
  });
});
