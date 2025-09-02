import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createState } from '../../src/createState';
import { CameraController } from '../../src/CameraController';
import { Spec } from '../../src/types';
import * as THREE from 'three';

describe('CameraController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should animate camera state with flyTo', async () => {
    const initialSpec: Spec = {
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: 0,
        theta: 0,
        distance: 10,
      },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
    };

    const { state } = createState(initialSpec);
    const mockEmit = vi.fn();
    const mockCamera = new THREE.PerspectiveCamera();
    const cameraController = new CameraController(state, mockEmit, mockCamera);

    const target = {
      target: { x: 10, y: 10, z: 10 },
      distance: 5,
      phi: 1,
      theta: 1,
    };
    const options = { duration: 1000, ease: (t: number) => t };

    cameraController.flyTo(target, options);

    expect(state.camera?.target.x).toBe(0);
    expect(state.camera?.distance).toBe(10);

    await vi.advanceTimersByTimeAsync(500);

    // State should be halfway to the target
    const checkIsClose = (val: number, target: number) => expect(Math.abs(val - target)).toBeLessThan(0.1);
    checkIsClose(state.camera!.target.x, 5);
    checkIsClose(state.camera!.target.y, 5);
    checkIsClose(state.camera!.target.z, 5);
    checkIsClose(state.camera!.distance, 7.5);
    checkIsClose(state.camera!.phi, 0.5);
    checkIsClose(state.camera!.theta, 0.5);


    // Advance time to the end
    await vi.advanceTimersByTimeAsync(500);

    // State should be at the target
    checkIsClose(state.camera!.target.x, 10);
    checkIsClose(state.camera!.target.y, 10);
    checkIsClose(state.camera!.target.z, 10);
    checkIsClose(state.camera!.distance, 5);
    checkIsClose(state.camera!.phi, 1);
    checkIsClose(state.camera!.theta, 1);
  });
});
