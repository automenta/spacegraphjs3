import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "solid-js";
import { createState } from "../../src/createState";
import { LayoutController } from "../../src/LayoutController";
import { Spec } from "../../src/types";

describe("LayoutController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should apply force-directed layout and update node positions", () => {
    createRoot((dispose) => {
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: "n1", type: "sphere" },
            { id: "n2", type: "sphere" },
          ],
          edges: [{ id: "e1", source: "n1", target: "n2" }],
        },
      };

      const { state, setState } = createState(initialSpec);
      new LayoutController(state, setState);

      vi.runAllTimers();

      const node1 = state.data.nodes.find((n) => n.id === "n1");
      const node2 = state.data.nodes.find((n) => n.id === "n2");

      expect(node1?.position?.x).not.toBe(0);
      expect(node1?.position?.y).not.toBe(0);
      expect(node2?.position?.x).not.toBe(0);
      expect(node2?.position?.y).not.toBe(0);

      dispose();
    });
  });

  it("should pause and resume the layout simulation", () => {
    createRoot((dispose) => {
      const initialSpec: Spec = {
        data: {
          nodes: [
            { id: "n1", type: "sphere" },
            { id: "n2", type: "sphere" },
          ],
          edges: [{ id: "e1", source: "n1", target: "n2" }],
        },
        layout: {
          paused: true,
        },
      };

      const { state, setState } = createState(initialSpec);
      new LayoutController(state, setState);

      vi.runAllTimers();

      const pos1_x = state.data.nodes.find((n) => n.id === "n1")?.position?.x;

      expect(pos1_x).toBe(0);

      setState("layout", "paused", false);
      vi.runAllTimers();

      const pos1_after_resume_x = state.data.nodes.find(
        (n) => n.id === "n1",
      )?.position?.x;

      expect(pos1_after_resume_x).not.toBe(0);

      dispose();
    });
  });
});
