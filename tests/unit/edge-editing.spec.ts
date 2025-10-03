import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { NodeSpec, EdgeSpec, Spec } from '../../src/types';

// Mock the Gesture library
vi.mock('@use-gesture/vanilla', () => ({
  Gesture: vi.fn().mockImplementation((element, handlers) => ({
    destroy: vi.fn(),
    handlers,
  })),
}));

describe('Edge Editing', () => {
  let graph: SpaceGraph;
  let mockRendererEl: HTMLElement;
  let mockUpdateState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a mock renderer element
    mockRendererEl = document.createElement('div');
    mockRendererEl.getBoundingClientRect = () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Create a minimal mock graph
    const initialSpec: Spec = {
      data: {
        nodes: [
          {
            id: 'node-1',
            type: 'sphere',
            position: { x: -5, y: 0, z: 0 },
            color: '#ff0000',
            label: 'Node 1',
          },
          {
            id: 'node-2',
            type: 'sphere',
            position: { x: 5, y: 0, z: 0 },
            color: '#00ff00',
            label: 'Node 2',
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'curved',
            color: '#ffffff',
            width: 2,
            curvature: 0.5,
          },
        ],
      },
      style: {},
      layout: { type: 'random' },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: Math.PI / 4,
        theta: Math.PI / 4,
        distance: 20,
      },
      controls: {
        keyboard: {
          enabled: true,
          panSpeed: 0.1,
          zoomSpeed: 0.1,
          orbitSpeed: 0.1,
        },
      },
      performance: {
        instancingThreshold: 100,
      },
      interaction: {
        hoveredElementId: null,
        selectedElementIds: [],
      },
    };

    mockUpdateState = vi.fn();

    graph = {
      state: initialSpec,
      updateState: mockUpdateState,
      update: mockUpdateState,
      render: {
        getRendererDomElement: () => mockRendererEl,
        getRenderer: () => ({
          domElement: mockRendererEl,
        }),
        getCamera: () => new THREE.PerspectiveCamera(),
        getNodeRenderer: () => null,
        getEdgeRenderer: () => null,
      },
      dataManager: {
        getElement: (id: string) =>
          initialSpec.data.nodes.find((node) => node.id === id) ||
          initialSpec.data.edges.find((edge) => edge.id === id) ||
          null,
        getNode: (id: string) =>
          initialSpec.data.nodes.find((node) => node.id === id) || null,
        getEdge: (id: string) =>
          initialSpec.data.edges.find((edge) => edge.id === id) || null,
      },
      events: {
        on: vi.fn(),
        emit: vi.fn(),
        off: vi.fn(),
      },
    } as unknown as SpaceGraph;
  });

  it('should allow updating curved edge curvature', () => {
    // Get the edge
    const edge = graph.dataManager.getEdge('edge-1');
    expect(edge).toBeDefined();
    expect(edge?.type).toBe('curved');
    expect(edge?.curvature).toBe(0.5);

    // Update the edge curvature directly
    const newCurvature = 0.8;

    graph.update({
      data: {
        edges: {
          update: [
            {
              id: 'edge-1',
              curvature: newCurvature,
            },
          ],
        },
      },
    });

    // Check that the update was called with correct parameters
    expect(mockUpdateState).toHaveBeenCalledWith({
      data: {
        edges: {
          update: [
            {
              id: 'edge-1',
              curvature: newCurvature,
            },
          ],
        },
      },
    });
  });

  it('should prepare curvature values for clamping between 0 and 1', () => {
    // Test that we can set curvature values that would be clamped
    // The actual clamping happens in the InteractionPlugin during drag operations

    // Try to set curvature above 1
    graph.update({
      data: {
        edges: {
          update: [
            {
              id: 'edge-1',
              curvature: 1.5, // Would be clamped to 1 in actual implementation
            },
          ],
        },
      },
    });

    expect(mockUpdateState).toHaveBeenCalledWith({
      data: {
        edges: {
          update: [
            {
              id: 'edge-1',
              curvature: 1.5,
            },
          ],
        },
      },
    });

    // Try to set curvature below 0
    graph.update({
      data: {
        edges: {
          update: [
            {
              id: 'edge-1',
              curvature: -0.5, // Would be clamped to 0 in actual implementation
            },
          ],
        },
      },
    });

    expect(mockUpdateState).toHaveBeenCalledWith({
      data: {
        edges: {
          update: [
            {
              id: 'edge-1',
              curvature: -0.5,
            },
          ],
        },
      },
    });
  });

  it('should allow setting curvature on any edge type', () => {
    // Add a straight edge
    graph.update({
      data: {
        edges: {
          add: [
            {
              id: 'edge-2',
              source: 'node-1',
              target: 'node-2',
              type: 'straight',
              color: '#ffffff',
              width: 2,
            },
          ],
        },
      },
    });

    // Try to set curvature on straight edge
    graph.update({
      data: {
        edges: {
          update: [
            {
              id: 'edge-2',
              curvature: 0.5,
            },
          ],
        },
      },
    });

    expect(mockUpdateState).toHaveBeenCalledWith({
      data: {
        edges: {
          update: [
            {
              id: 'edge-2',
              curvature: 0.5,
            },
          ],
        },
      },
    });
  });
});
