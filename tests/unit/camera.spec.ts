import { describe, expect, it, vi } from 'vitest';
import { createState } from '../../src/core/createState';
import { CameraPlugin } from '../../src/plugins/CameraPlugin';
import { Spec } from '../../src/types';
import * as THREE from 'three';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { animate } from 'popmotion';

vi.mock('popmotion', () => ({
  animate: vi.fn(),
}));

describe('CameraPlugin', () => {
  it('should animate camera position with flyTo', () => {
    const initialSpec: Spec = {
      camera: {
        target: { x: 0, y: 0, z: 0 },
        distance: 10,
        phi: Math.PI / 2,
        theta: 0,
      },
    } as any;

    const { state, updateState } = createState(initialSpec);
    const mockCamera = new THREE.PerspectiveCamera();

    const mockGraph = {
      state,
      updateState,
      renderingManager: {
        getCamera: () => mockCamera,
      },
      eventManager: {
        emit: vi.fn(),
      },
    } as unknown as SpaceGraph;

    const cameraPlugin = new CameraPlugin();
    cameraPlugin.init(mockGraph);

    const targetState = {
      target: { x: 10, y: 10, z: 0 },
      distance: 5,
    };
    const options = { duration: 1000 };

    cameraPlugin.flyTo(targetState, options);

    const animateArgs = (animate as any).mock.calls[0][0];
    expect(animateArgs.duration).toBe(1000);

    // Simulate halfway through the animation
    animateArgs.onUpdate({
      target: { x: 5, y: 5, z: 0 },
      distance: 7.5,
    });

    const checkIsClose = (val: number, target: number) =>
      expect(Math.abs(val - target)).toBeLessThan(1);

    // The camera's position is derived from the state's spherical coordinates.
    // We need to check the state, not the mockCamera position directly,
    // because the sync effect is not running in this test.
    checkIsClose(mockGraph.state.camera.target.x, 5);
    checkIsClose(mockGraph.state.camera.target.y, 5);
    checkIsClose(mockGraph.state.camera.distance, 7.5);

    // Simulate completion
    animateArgs.onComplete();

    expect(mockGraph.eventManager.emit).toHaveBeenCalledWith(
      'camera:animation:end'
    );
  });
});
