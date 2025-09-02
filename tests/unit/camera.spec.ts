import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createState } from '../../src/createState';
import { CameraController } from '../../src/CameraController';
import { Spec } from '../../src/types';

describe('CameraController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should animate camera state with flyTo', async () => {
    const initialSpec: Spec = {
      camera: { position: { x: 0, y: 0, z: 5 }, zoom: 1 },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
    };

    const { state } = createState(initialSpec);
    const cameraController = new CameraController(state);

    const target = { position: { x: 10, z: 20 }, zoom: 2 };
    const options = { duration: 1000, ease: (t: number) => t }; // Use linear easing for predictable testing

    // Start the animation
    cameraController.flyTo(target, options);

    // Initial state should be unchanged on the first frame
    expect(state.camera?.position.x).toBe(0);
    expect(state.camera?.zoom).toBe(1);

    // Advance time by 500ms (halfway through)
    await vi.advanceTimersByTimeAsync(500);

    // State should be halfway to the target
    expect(state.camera?.position.x).toBeCloseTo(5);
    expect(state.camera?.position.y).toBeCloseTo(0); // y was not in target
    expect(state.camera?.position.z).toBeCloseTo(12.5); // (5 + (20-5)*0.5)
    expect(state.camera?.zoom).toBeCloseTo(1.5);

    // Advance time to the end
    await vi.advanceTimersByTimeAsync(500);

    // State should be at the target
    expect(state.camera?.position.x).toBeCloseTo(10);
    expect(state.camera?.position.y).toBeCloseTo(0);
    expect(state.camera?.position.z).toBeCloseTo(20);
    expect(state.camera?.zoom).toBeCloseTo(2);
  });
});
