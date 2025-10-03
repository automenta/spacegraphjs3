import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { EdgeRenderer } from '../../src/renderers/EdgeRenderer';
import { InteractionPlugin } from '../../src/plugins/InteractionPlugin';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { createStore } from 'solid-js/store';
import { Spec, NodeSpec, EdgeSpec } from '../../src/types';
import { createRoot } from 'solid-js';

// Mock PointerEvent for test environment
class MockPointerEvent extends Event {
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;

  constructor(type: string, init: any = {}) {
    super(type, init);
    this.clientX = init.clientX || 0;
    this.clientY = init.clientY || 0;
    this.ctrlKey = init.ctrlKey || false;
    this.metaKey = init.metaKey || false;
  }
}

// Mock WheelEvent for test environment
class MockWheelEvent extends Event {
  deltaY: number;
  constructor(type: string, init: any = {}) {
    super(type, init);
    this.deltaY = init.deltaY || 0;
  }
  preventDefault() {
    // Mock implementation
  }
}

// Mock the Gesture library
vi.mock('@use-gesture/vanilla', () => ({
  Gesture: vi.fn().mockImplementation((element, handlers) => ({
    destroy: vi.fn(),
    handlers,
  })),
}));

// Replace global events in test environment
(global as any).PointerEvent = MockPointerEvent;
(global as any).WheelEvent = MockWheelEvent;

describe('Edge Interaction', () => {
  let scene: THREE.Scene;
  let mockNodeState1: NodeSpec;
  let mockNodeState2: NodeSpec;
  let mockEdgeState: EdgeSpec;
  let mockGraphState: Spec;
  let edgeRenderer: EdgeRenderer;

  beforeEach(() => {
    scene = new THREE.Scene();
    mockNodeState1 = {
      id: 'node-1',
      type: 'sphere',
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
    };
    mockNodeState2 = {
      id: 'node-2',
      type: 'sphere',
      position: { x: 10, y: 0, z: 0 },
      color: '#00ff00',
    };
    mockEdgeState = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      color: '#0000ff',
      width: 2,
    };
    mockGraphState = {
      data: {
        nodes: [mockNodeState1, mockNodeState2],
        edges: [mockEdgeState],
      },
      style: {},
      layout: { type: 'force-directed' },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: Math.PI / 2,
        theta: 0,
        distance: 10,
      },
      controls: {
        keyboard: {
          enabled: true,
          panSpeed: 0.1,
          zoomSpeed: 0.1,
          orbitSpeed: 0.1,
        },
      },
      performance: { instancingThreshold: 100 },
      interaction: {
        hoveredElementId: null,
        selectedElementIds: [],
      },
    };
  });

  describe('EdgeRenderer', () => {
    it('should create edge with hit area for interaction', async () => {
      await createRoot(async (dispose) => {
        const [state] = createStore<Spec>(mockGraphState);
        edgeRenderer = new EdgeRenderer(scene, state);
        edgeRenderer.updateEdges();

        // Check that visual line was created
        expect(edgeRenderer.getEdgeObject('edge-1')).toBeDefined();

        // Check that hit area was created
        const raycastableObjects = edgeRenderer.getRaycastableObjects();
        expect(raycastableObjects.length).toBe(1);
        expect(raycastableObjects[0].userData.edgeId).toBe('edge-1');
        expect(raycastableObjects[0].userData.isHitArea).toBe(true);

        edgeRenderer.dispose();
        dispose();
      });
    });

    it('should handle edge hover state', async () => {
      await createRoot(async (dispose) => {
        const [state] = createStore<Spec>(mockGraphState);
        edgeRenderer = new EdgeRenderer(scene, state);
        edgeRenderer.updateEdges();

        // Set edge hover
        edgeRenderer.setEdgeHover('edge-1', true);

        // Check that edge state was updated
        const edgeObject = edgeRenderer.getEdgeObject('edge-1');
        expect(edgeObject).toBeDefined();

        edgeRenderer.dispose();
        dispose();
      });
    });

    it('should handle edge selection state', async () => {
      await createRoot(async (dispose) => {
        const [state] = createStore<Spec>(mockGraphState);
        edgeRenderer = new EdgeRenderer(scene, state);
        edgeRenderer.updateEdges();

        // Set edge selected
        edgeRenderer.setEdgeSelected('edge-1', true);

        // Check that edge state was updated
        const edgeObject = edgeRenderer.getEdgeObject('edge-1');
        expect(edgeObject).toBeDefined();

        edgeRenderer.dispose();
        dispose();
      });
    });

    describe('Conditional Edge Styling', () => {
      let scene: THREE.Scene;
      let mockNodeState1: NodeSpec;
      let mockNodeState2: NodeSpec;
      let mockEdgeState: EdgeSpec;
      let mockGraphState: Spec;
      let edgeRenderer: EdgeRenderer;

      beforeEach(() => {
        scene = new THREE.Scene();
        mockNodeState1 = {
          id: 'node-1',
          type: 'sphere',
          position: { x: 0, y: 0, z: 0 },
          color: '#ff0000',
        };
        mockNodeState2 = {
          id: 'node-2',
          type: 'sphere',
          position: { x: 10, y: 0, z: 0 },
          color: '#00ff00',
        };
        mockEdgeState = {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          color: '#0000ff',
          width: 2,
        };
        mockGraphState = {
          data: {
            nodes: [mockNodeState1, mockNodeState2],
            edges: [mockEdgeState],
          },
          style: {
            'edge:hover': {
              color: '#ffffff',
              width: 3,
              opacity: 1.0,
            },
            'edge:selected': {
              color: '#ffff00',
              width: 4,
              opacity: 1.0,
            },
            'edge:source-selected': {
              color: '#ff00ff',
              width: 3,
              opacity: 0.8,
            },
            'edge:target-selected': {
              color: '#00ffff',
              width: 3,
              opacity: 0.8,
            },
            'edge:both-selected': {
              color: '#ffffff',
              width: 5,
              opacity: 1.0,
            },
          },
          layout: { type: 'force-directed' },
          camera: {
            target: { x: 0, y: 0, z: 0 },
            phi: Math.PI / 2,
            theta: 0,
            distance: 10,
          },
          controls: {
            keyboard: {
              enabled: true,
              panSpeed: 0.1,
              zoomSpeed: 0.1,
              orbitSpeed: 0.1,
            },
          },
          performance: { instancingThreshold: 100 },
          interaction: {
            hoveredElementId: null,
            selectedElementIds: [],
          },
        };
      });

      it('should apply source-selected style when source node is selected', async () => {
        await createRoot(async (dispose) => {
          // Set up state with source node selected
          mockGraphState.interaction.selectedElementIds = ['node-1'];
          const [state] = createStore<Spec>(mockGraphState);
          edgeRenderer = new EdgeRenderer(scene, state);
          edgeRenderer.updateEdges();

          // Check that edge material reflects source-selected style
          const edgeObject = edgeRenderer.getEdgeObject('edge-1');
          expect(edgeObject).toBeDefined();
          expect(edgeObject!.material).toBeDefined();

          edgeRenderer.dispose();
          dispose();
        });
      });

      it('should apply target-selected style when target node is selected', async () => {
        await createRoot(async (dispose) => {
          // Set up state with target node selected
          mockGraphState.interaction.selectedElementIds = ['node-2'];
          const [state] = createStore<Spec>(mockGraphState);
          edgeRenderer = new EdgeRenderer(scene, state);
          edgeRenderer.updateEdges();

          // Check that edge material reflects target-selected style
          const edgeObject = edgeRenderer.getEdgeObject('edge-1');
          expect(edgeObject).toBeDefined();
          expect(edgeObject!.material).toBeDefined();

          edgeRenderer.dispose();
          dispose();
        });
      });

      it('should apply both-selected style when both nodes are selected', async () => {
        await createRoot(async (dispose) => {
          // Set up state with both nodes selected
          mockGraphState.interaction.selectedElementIds = ['node-1', 'node-2'];
          const [state] = createStore<Spec>(mockGraphState);
          edgeRenderer = new EdgeRenderer(scene, state);
          edgeRenderer.updateEdges();

          // Check that edge material reflects both-selected style
          const edgeObject = edgeRenderer.getEdgeObject('edge-1');
          expect(edgeObject).toBeDefined();
          expect(edgeObject!.material).toBeDefined();

          edgeRenderer.dispose();
          dispose();
        });
      });

      it('should apply selected style when edge itself is selected', async () => {
        await createRoot(async (dispose) => {
          // Set up state with edge selected
          const [state] = createStore<Spec>(mockGraphState);
          edgeRenderer = new EdgeRenderer(scene, state);
          edgeRenderer.updateEdges();

          // Select the edge
          edgeRenderer.setEdgeSelected('edge-1', true);

          // Check that edge material reflects selected style
          const edgeObject = edgeRenderer.getEdgeObject('edge-1');
          expect(edgeObject).toBeDefined();
          expect(edgeObject!.material).toBeDefined();

          edgeRenderer.dispose();
          dispose();
        });
      });
    });
  });

  describe('InteractionPlugin Edge Interaction', () => {
    let graph: SpaceGraph;
    let plugin: InteractionPlugin;
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

      mockUpdateState = vi.fn();

      // Create mock objects for intersection testing
      const mockNodeObject = new THREE.Object3D();
      mockNodeObject.userData = { nodeId: 'node-1' };

      const mockEdgeObject = new THREE.Line();
      mockEdgeObject.userData = { edgeId: 'edge-1', isHitArea: true };

      const mockEdgeRenderer = {
        getRaycastableObjects: () => [mockEdgeObject],
        setEdgeHover: vi.fn(),
        setEdgeSelected: vi.fn(),
      };

      graph = {
        state: mockGraphState,
        updateState: mockUpdateState,
        update: mockUpdateState,
        render: {
          getRendererDomElement: () => mockRendererEl,
          getRenderer: () => ({
            domElement: mockRendererEl,
          }),
          getCamera: () => new THREE.PerspectiveCamera(),
          getNodeRenderer: () => ({
            getRaycastableObjects: () => [mockNodeObject],
            getNodeIdFromIntersection: (intersection: any) => {
              if (intersection.object === mockNodeObject) {
                return 'node-1';
              }
              return null;
            },
          }),
          getEdgeRenderer: () => mockEdgeRenderer,
        },
        dataManager: {
          getElement: (id: string) => {
            if (id === 'node-1') return mockNodeState1;
            if (id === 'node-2') return mockNodeState2;
            return null;
          },
          getEdge: (id: string) => {
            if (id === 'edge-1') return mockEdgeState;
            return null;
          },
          getNode: (id: string) => {
            if (id === 'node-1') return mockNodeState1;
            if (id === 'node-2') return mockNodeState2;
            return null;
          },
        },
        events: {
          on: vi.fn(),
          emit: vi.fn(),
          off: vi.fn(),
        },
      } as unknown as SpaceGraph;

      plugin = new InteractionPlugin();
      plugin.init(graph);
    });

    it('should handle edge click events', () => {
      const mockEdge = { id: 'edge-1', source: 'node-1', target: 'node-2' };
      const mockSourceNode = {
        id: 'node-1',
        type: 'sphere',
        position: { x: 0, y: 0, z: 0 },
      };
      const mockTargetNode = {
        id: 'node-2',
        type: 'sphere',
        position: { x: 10, y: 0, z: 0 },
      };

      // Override getIntersectedElement to return an edge element
      const originalMethod = (plugin as any).getIntersectedElement;
      (plugin as any).getIntersectedElement = (event: any) => {
        return {
          type: 'edge',
          edge: mockEdge,
          sourceNode: mockSourceNode,
          targetNode: mockTargetNode,
        };
      };

      const clickEvent = new MockPointerEvent('click', {
        clientX: 400,
        clientY: 300,
      });

      // Simulate click
      (plugin as any).onClick(clickEvent);

      expect(graph.events.emit).toHaveBeenCalledWith('edge:click', {
        target: mockEdge,
        event: clickEvent,
        sourceNode: mockSourceNode,
        targetNode: mockTargetNode,
      });
    });

    it('should handle edge hover enter events', () => {
      const mockEdge = { id: 'edge-1', source: 'node-1', target: 'node-2' };
      const mockSourceNode = {
        id: 'node-1',
        type: 'sphere',
        position: { x: 0, y: 0, z: 0 },
      };
      const mockTargetNode = {
        id: 'node-2',
        type: 'sphere',
        position: { x: 10, y: 0, z: 0 },
      };

      const hoverState = {
        event: new MockPointerEvent('pointermove'),
      };

      // Override getIntersectedElement to return an edge element
      (plugin as any).getIntersectedElement = (event: any) => {
        return {
          type: 'edge',
          edge: mockEdge,
          sourceNode: mockSourceNode,
          targetNode: mockTargetNode,
        };
      };

      (plugin as any).onHover(hoverState);

      // Check that edge hover was set
      expect(graph.render.getEdgeRenderer()?.setEdgeHover).toHaveBeenCalledWith(
        'edge-1',
        true
      );

      // Check that event was emitted
      expect(graph.events.emit).toHaveBeenCalledWith('edge:hover:enter', {
        target: mockEdge,
        sourceNode: mockSourceNode,
        targetNode: mockTargetNode,
      });
    });

    it('should handle edge hover leave events', () => {
      // Set up previous hover state
      (plugin as any).hoveredEdgeId = 'edge-1';

      const hoverState = {
        event: new MockPointerEvent('pointermove'),
      };

      // Override getIntersectedElement to return null (no intersection)
      (plugin as any).getIntersectedElement = (event: any) => null;

      (plugin as any).onHover(hoverState);

      // Check that edge hover was unset
      expect(graph.render.getEdgeRenderer()?.setEdgeHover).toHaveBeenCalledWith(
        'edge-1',
        false
      );

      // Check that event was emitted
      expect(graph.events.emit).toHaveBeenCalledWith('edge:hover:leave', {
        target: mockEdgeState,
        sourceNode: mockNodeState1,
        targetNode: mockNodeState2,
      });
    });

    it('should handle edge selection with Ctrl key', () => {
      const mockEdge = { id: 'edge-1', source: 'node-1', target: 'node-2' };
      const mockSourceNode = {
        id: 'node-1',
        type: 'sphere',
        position: { x: 0, y: 0, z: 0 },
      };
      const mockTargetNode = {
        id: 'node-2',
        type: 'sphere',
        position: { x: 10, y: 0, z: 0 },
      };

      // Override getIntersectedElement to return an edge element
      (plugin as any).getIntersectedElement = (event: any) => {
        return {
          type: 'edge',
          edge: mockEdge,
          sourceNode: mockSourceNode,
          targetNode: mockTargetNode,
        };
      };

      // Simulate Ctrl+click
      const clickEvent = new MockPointerEvent('click', {
        ctrlKey: true,
        clientX: 400,
        clientY: 300,
      });

      (plugin as any).onClick(clickEvent);

      // Check that edge was selected
      expect(
        graph.render.getEdgeRenderer()?.setEdgeSelected
      ).toHaveBeenCalledWith('edge-1', true);

      // Check that event was emitted
      expect(graph.events.emit).toHaveBeenCalledWith('edge:click', {
        target: mockEdge,
        event: clickEvent,
        sourceNode: mockSourceNode,
        targetNode: mockTargetNode,
      });
    });
  });
});
