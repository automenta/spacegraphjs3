import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "solid-js";
import { createState } from "../../src/createState";
import { BasicRenderer } from "../../src/BasicRenderer";
import { Spec } from "../../src/types";
import * as THREE from "three";
import { tick } from "../utils";

// Mock the THREE library
const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
};

const mockMesh = {
  position: { set: vi.fn() },
  geometry: { dispose: vi.fn(), disposeBoundsTree: vi.fn() },
  material: { dispose: vi.fn(), color: { set: vi.fn() } },
  userData: {},
};

vi.mock("three", async () => {
  const actualThree = await vi.importActual("three");
  return {
    ...actualThree,
    Scene: vi.fn(() => mockScene),
    Mesh: vi.fn(() => mockMesh),
    SphereGeometry: vi.fn(() => ({
      computeBoundsTree: vi.fn(),
    })),
    MeshBasicMaterial: vi.fn(() => ({
      color: { set: vi.fn() },
    })),
  };
});

describe("BasicRenderer", () => {
  let dispose: () => void;
  let scene: THREE.Scene;

  vi.useFakeTimers();

  beforeEach(() => {
    vi.clearAllMocks();
    scene = new THREE.Scene();
  });

  afterEach(() => {
    if (dispose) {
      dispose();
    }
  });

  it("should create meshes for initial nodes", async () => {
    createRoot((disposeFn) => {
      dispose = disposeFn;
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: "n1", type: "sphere" },
            { id: "n2", type: "sphere" },
          ],
        },
      };
      const { state } = createState(initialSpec);
      new BasicRenderer(scene, state);
    });

    await tick();

    expect(THREE.Mesh).toHaveBeenCalledTimes(2);
    expect(scene.add).toHaveBeenCalledTimes(2);
  });

  it("should add a mesh when a node is added to the state", async () => {
    await createRoot(async (disposeFn) => {
      dispose = disposeFn;
      const initialSpec: Spec = {
        data: { nodes: [{ id: "n1", type: "sphere" }] },
      };
      const { state, updateState } = createState(initialSpec);
      new BasicRenderer(scene, state);

      await tick();

      expect(THREE.Mesh).toHaveBeenCalledTimes(1);
      expect(scene.add).toHaveBeenCalledTimes(1);

      // Add a new node
      updateState({
        data: {
          nodes: [
            ...state.data.nodes,
            { id: "n2", type: "sphere" },
          ],
        },
      });

      await tick();

      expect(THREE.Mesh).toHaveBeenCalledTimes(2);
      expect(scene.add).toHaveBeenCalledTimes(2);
    });
  });

  it("should remove a mesh when a node is removed from the state", async () => {
    await createRoot(async (disposeFn) => {
      dispose = disposeFn;
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: "n1", type: "sphere" },
            { id: "n2", type: "sphere" },
          ],
        },
      };
      const { state, updateState } = createState(initialSpec);
      new BasicRenderer(scene, state);

      await tick();

      expect(scene.add).toHaveBeenCalledTimes(2);

      // Remove a node
      updateState({
        data: {
          nodes: state.data.nodes.filter((n) => n.id !== "n1"),
        },
      });

      await tick();

      expect(scene.remove).toHaveBeenCalledTimes(1);
      expect(mockMesh.geometry.dispose).toHaveBeenCalledTimes(1);
      expect(mockMesh.material.dispose).toHaveBeenCalledTimes(1);
    });
  });

  it("should update a mesh position when a node position changes", async () => {
    await createRoot(async (disposeFn) => {
      dispose = disposeFn;
      const initialSpec: Spec = {
        data: {
          nodes: [{ id: "n1", type: "sphere", position: { x: 0, y: 0, z: 0 } }],
        },
      };
      const { state, updateState } = createState(initialSpec);
      new BasicRenderer(scene, state);

      await tick();
      vi.clearAllMocks(); // Clear mocks after initial setup

      // Update node position
      updateState({
        data: {
          nodes: [{ id: "n1", position: { x: 10, y: 20, z: 30 } }],
        },
      });

      await tick();

      expect(mockMesh.position.set).toHaveBeenCalledWith(10, 20, 30);
    });
  });

  it("should update a mesh color when node is hovered or selected", async () => {
    await createRoot(async (disposeFn) => {
      dispose = disposeFn;
      const initialSpec: Spec = {
        data: {
          nodes: [{ id: "n1", type: "sphere", color: "#ff0000" }],
        },
        style: {
          "node:hover": { color: "#00ff00" },
          "node:selected": { color: "#0000ff" },
        },
      };
      const { state, updateState } = createState(initialSpec);
      new BasicRenderer(scene, state);

      await tick();

      // Initial color
      expect(mockMesh.material.color.set).toHaveBeenCalledWith("#ff0000");
      vi.clearAllMocks();

      // Hover
      updateState({
        interaction: { ...state.interaction, hoveredElementId: "n1" },
      });
      await tick();
      expect(mockMesh.material.color.set).toHaveBeenCalledWith("#00ff00");
      vi.clearAllMocks();

      // Select
      updateState({
        interaction: { ...state.interaction, selectedElementIds: ["n1"] },
      });
      await tick();
      expect(mockMesh.material.color.set).toHaveBeenCalledWith("#0000ff");
    });
  });
});
