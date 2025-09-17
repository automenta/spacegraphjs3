import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createState } from '../../src/core/createState';
import { CameraPlugin } from '../../src/plugins/CameraPlugin';
import { Spec } from '../../src/types';
import * as THREE from 'three';
import { SpaceGraph } from '../../src/core/SpaceGraph';

describe('CameraPlugin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should animate camera position with flyTo', async () => {
    const initialSpec: Spec = {
      data: { nodes: [], edges: [] },
    };

    const { state, updateState } = createState(initialSpec);
    const mockCamera = new THREE.PerspectiveCamera();
    mockCamera.position.set(0, 0, 10);

    // Mock the SpaceGraph instance and its managers
    const mockGraph = {
      state,
      updateState,
      renderingManager: {
        getCamera: () => mockCamera,
      },
    } as unknown as SpaceGraph;

    const cameraPlugin = new CameraPlugin();
    cameraPlugin.init(mockGraph);

    const target = new THREE.Vector3(10, 10, 5);
    const options = { duration: 1000 };

    cameraPlugin.flyTo(target, options);

    expect(mockCamera.position.x).toBe(0);
    expect(mockCamera.position.z).toBe(10);

    await vi.advanceTimersByTimeAsync(500);

    // Position should be halfway to the target
    const checkIsClose = (val: number, target: number) =>
      expect(Math.abs(val - target)).toBeLessThan(0.1);

    checkIsClose(mockCamera.position.x, 5);
    checkIsClose(mockCamera.position.y, 5);
    checkIsClose(mockCamera.position.z, 7.5);

    // Advance time to the end
    await vi.advanceTimersByTimeAsync(500);

    // Position should be at the target
    checkIsClose(mockCamera.position.x, 10);
    checkIsClose(mockCamera.position.y, 10);
    checkIsClose(mockCamera.position.z, 5);
  });
});
