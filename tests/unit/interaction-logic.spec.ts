import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { InteractionLogic } from '../../src/InteractionLogic';
import { Store, createStore } from 'solid-js/store';
import { Spec } from '../../src/types';

// Mock factory for the state
const createMockState = (): Store<Spec> => {
  const [state] = createStore<Spec>({
    camera: {
      target: { x: 0, y: 0, z: 0 },
      phi: Math.PI / 2,
      theta: 0,
      distance: 10,
    },
    data: {
      nodes: [{ id: 'n1', type: 'sphere', position: { x: 10, y: 20, z: 30 } }],
      edges: [],
    },
    interaction: {
      hoveredElementId: null,
      selectedElementIds: [],
    },
  });
  return state;
};

describe('InteractionLogic', () => {
  // Mocks
  const mockUpdateState = vi.fn();
  const mockThreeCamera = new THREE.PerspectiveCamera();
  const mockRendererEl = (
    typeof window !== 'undefined'
      ? {
          getBoundingClientRect: () => ({
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            right: 800,
            bottom: 600,
          }),
        }
      : null
  ) as HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockThreeCamera.position.set(0, 0, 0);
    mockThreeCamera.rotation.set(0, 0, 0);
    mockThreeCamera.updateMatrixWorld(true);
  });

  describe('handleNodeDrag', () => {
    it('should call updateState with the new node position', () => {
      const draggedElementId = 'n1';

      // Drag plane is facing the camera, at z=0
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

      // Simulate a drag to the center of the "screen"
      const vx = 400;
      const vy = 300;

      InteractionLogic.handleNodeDrag(
        vx,
        vy,
        draggedElementId,
        dragPlane,
        mockRendererEl,
        mockThreeCamera,
        mockUpdateState
      );

      // The ray from the center of the screen is straight down the Z axis.
      // It will intersect the plane at (0, 0, 0).
      expect(mockUpdateState).toHaveBeenCalledOnce();
      const { data } = mockUpdateState.mock.calls[0][0];
      const updatedNode = data.nodes[0];
      expect(updatedNode.id).toBe(draggedElementId);
      expect(updatedNode.position.x).toBeCloseTo(0);
      expect(updatedNode.position.y).toBeCloseTo(0);
      expect(updatedNode.position.z).toBeCloseTo(0);
    });
  });

  describe('handlePan', () => {
    it('should calculate the correct pan when camera is not rotated', () => {
      const state = createMockState();
      InteractionLogic.handlePan(100, 50, state, mockUpdateState, mockThreeCamera);

      expect(mockUpdateState).toHaveBeenCalledOnce();
      const { camera: newCameraState } = mockUpdateState.mock.calls[0][0];
      expect(newCameraState.target.x).toBeCloseTo(-1);
      expect(newCameraState.target.y).toBeCloseTo(0.5);
      expect(newCameraState.target.z).toBeCloseTo(0);
    });

    it('should calculate the correct pan when camera is rotated 90 degrees on Y axis', () => {
      const state = createMockState();
      mockThreeCamera.rotation.y = Math.PI / 2;
      mockThreeCamera.updateMatrixWorld(true);

      InteractionLogic.handlePan(100, 0, state, mockUpdateState, mockThreeCamera);

      expect(mockUpdateState).toHaveBeenCalledOnce();
      const { camera: newCameraState } = mockUpdateState.mock.calls[0][0];
      expect(newCameraState.target.x).toBeCloseTo(0);
      expect(newCameraState.target.y).toBeCloseTo(0);
      expect(newCameraState.target.z).toBeCloseTo(1);
    });
  });

  describe('handleOrbit', () => {
    it('should update camera phi and theta on orbit', () => {
      const state = createMockState();
      const initialPhi = state.camera.phi;
      const initialTheta = state.camera.theta;

      InteractionLogic.handleOrbit(100, 50, state, mockUpdateState);

      expect(mockUpdateState).toHaveBeenCalledOnce();
      const { camera: newCameraState } = mockUpdateState.mock.calls[0][0];

      // 100 * 0.005 = 0.5
      expect(newCameraState.theta).toBeCloseTo(initialTheta - 0.5);
      // 50 * 0.005 = 0.25
      expect(newCameraState.phi).toBeCloseTo(initialPhi - 0.25);
    });
  });
});
