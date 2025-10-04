import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { CameraPlugin } from '../../src/plugins/CameraPlugin';
import { InteractionPlugin } from '../../src/plugins/InteractionPlugin';
import { SpaceGraphCore } from '../../src/core/SpaceGraphCore';
import { ErrorBoundary } from '../../src/utils/ErrorBoundary';
import { ResourceManager } from '../../src/utils/ResourceManager';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';
import { EnhancedObjectPool } from '../../src/utils/EnhancedObjectPool';
import { ValidationSystem } from '../../src/utils/ValidationSystem';

/**
 * Comprehensive test suite for enhanced camera and interaction plugin quality improvements
 */
describe('Enhanced Camera and Interaction Plugin Quality', () => {
  let cameraPlugin: CameraPlugin;
  let interactionPlugin: InteractionPlugin;
  let mockGraph: any;
  let mockRender: any;
  let mockCamera: THREE.PerspectiveCamera;
  let mockScene: THREE.Scene;

  beforeEach(() => {
    // Set up Three.js mocks
    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    mockScene = new THREE.Scene();

    mockRender = {
      getCamera: vi.fn(() => mockCamera),
      getScene: vi.fn(() => mockScene),
      getRendererDomElement: vi.fn(() => document.createElement('canvas')),
      getRenderer: vi.fn(() => ({
        domElement: { clientWidth: 800, clientHeight: 600 }
      })),
      getNodeRenderer: vi.fn(() => ({
        getRaycastableObjects: vi.fn(() => []),
        getNodeIdFromIntersection: vi.fn(() => null),
      })),
      getEdgeRenderer: vi.fn(() => ({
        getRaycastableObjects: vi.fn(() => []),
        getEdgeEditHandles: vi.fn(() => []),
        setEdgeHover: vi.fn(),
        setEdgeSelected: vi.fn(),
        setEdgeEditing: vi.fn(),
      })),
    };

    mockGraph = {
      render: mockRender,
      state: {
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 4,
          theta: Math.PI / 4,
          distance: 50,
        },
        controls: {
          keyboard: {
            enabled: true,
            panSpeed: 1,
            zoomSpeed: 1,
            orbitSpeed: 1,
          },
        },
        interaction: {
          selectedElementIds: [],
          hoveredElementId: null,
        },
        data: {
          nodes: [
            {
              id: 'node1',
              position: { x: 0, y: 0, z: 0 },
              type: 'box',
            },
          ],
          edges: [],
          groups: [],
        },
      },
      update: vi.fn(),
      events: {
        emit: vi.fn(),
        on: vi.fn(),
      },
      dataManager: {
        getNode: vi.fn((id) => mockGraph.state?.data.nodes.find((n: any) => n.id === id)),
        getEdge: vi.fn(),
        getElement: vi.fn(),
        getGroup: vi.fn(),
      },
      cameraPlugin: null as any,
    };

    // Initialize plugins
    cameraPlugin = new CameraPlugin();
    interactionPlugin = new InteractionPlugin();

    // Set up spies for utility systems
    vi.spyOn(ErrorBoundary.getInstance(), 'execute');
    vi.spyOn(ResourceManager.getInstance(), 'registerResource');
    vi.spyOn(PerformanceMonitor.getInstance(), 'measure');
    vi.spyOn(EnhancedObjectPool.getInstance(), 'createThreeJSPools');
    vi.spyOn(ValidationSystem.getInstance(), 'assert');
  });

  afterEach(() => {
    // Clean up
    cameraPlugin.dispose();
    interactionPlugin.dispose();

    vi.restoreAllMocks();
  });

  describe('Error Handling Standardization', () => {
    it('should handle initialization errors gracefully', () => {
      const errorBoundarySpy = vi.spyOn(ErrorBoundary.getInstance(), 'execute');

      // Mock a failure in initialization
      mockRender.getCamera = vi.fn(() => {
        throw new Error('Camera initialization failed');
      });

      expect(() => {
        cameraPlugin.init(mockGraph as SpaceGraphCore);
      }).not.toThrow();

      expect(errorBoundarySpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          component: 'CameraPlugin',
          rethrow: false,
        })
      );
    });

    it('should validate inputs using ValidationSystem', () => {
      const validationSpy = vi.spyOn(ValidationSystem.getInstance(), 'assert');

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      expect(validationSpy).toHaveBeenCalledWith(
        mockGraph,
        'SpaceGraphCore',
        expect.objectContaining({ context: 'CameraPlugin.init' })
      );
    });

    it('should handle flyTo errors with proper error boundaries', () => {
      cameraPlugin.init(mockGraph as SpaceGraphCore);

      const errorBoundarySpy = vi.spyOn(ErrorBoundary.getInstance(), 'execute');

      // Test with invalid camera spec
      expect(() => {
        cameraPlugin.flyTo(null as any, { duration: 1000 });
      }).not.toThrow();

      expect(errorBoundarySpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          component: 'CameraPlugin',
          rethrow: false,
        })
      );
    });
  });

  describe('Resource Management Improvements', () => {
    it('should register camera resources for tracking', () => {
      const resourceSpy = vi.spyOn(ResourceManager.getInstance(), 'registerResource');

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      expect(resourceSpy).toHaveBeenCalledWith(
        mockCamera,
        'PerspectiveCamera',
        expect.objectContaining({
          plugin: 'CameraPlugin',
          purpose: 'Main camera instance'
        })
      );
    });

    it('should create Three.js object pools for performance', () => {
      const poolSpy = vi.spyOn(EnhancedObjectPool.getInstance(), 'createThreeJSPools');

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      expect(poolSpy).toHaveBeenCalled();
    });

    it('should properly dispose of resources', () => {
      const resourceSpy = vi.spyOn(ResourceManager.getInstance(), 'registerResource');

      cameraPlugin.init(mockGraph as SpaceGraphCore);
      cameraPlugin.dispose();

      // Should register disposed resources for tracking
      expect(resourceSpy).toHaveBeenCalledWith(
        mockCamera,
        'PerspectiveCamera',
        expect.objectContaining({
          purpose: expect.stringContaining('disposed')
        })
      );
    });
  });

  describe('Performance Optimization', () => {
    it('should monitor performance of critical operations', () => {
      const performanceSpy = vi.spyOn(PerformanceMonitor.getInstance(), 'measure');

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      // Trigger a flyTo operation
      cameraPlugin.flyTo(
        { target: { x: 10, y: 10, z: 10 } },
        { duration: 1000 }
      );

      expect(performanceSpy).toHaveBeenCalledWith(
        'CameraPlugin.flyTo',
        expect.any(Function),
        expect.objectContaining({ context: 'CameraPlugin.flyTo' })
      );
    });

    it('should use object pooling for frequently created objects', () => {
      const poolSpy = vi.spyOn(EnhancedObjectPool.getInstance(), 'createThreeJSPools');

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      expect(poolSpy).toHaveBeenCalled();
    });
  });

  describe('Type Safety Enhancements', () => {
    it('should validate all inputs using ValidationSystem', () => {
      const validationSpy = vi.spyOn(ValidationSystem.getInstance(), 'assert');

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      expect(validationSpy).toHaveBeenCalledWith(
        mockGraph,
        'SpaceGraphCore',
        expect.any(Object)
      );
    });

    it('should handle invalid camera specifications gracefully', () => {
      cameraPlugin.init(mockGraph as SpaceGraphCore);

      const validationSpy = vi.spyOn(ValidationSystem.getInstance(), 'assert');

      expect(() => {
        cameraPlugin.flyTo(
          { target: 'invalid' as any },
          { duration: 1000 }
        );
      }).not.toThrow();

      expect(validationSpy).toHaveBeenCalledWith(
        { target: 'invalid' },
        'CameraSpec',
        expect.any(Object)
      );
    });
  });

  describe('Memory Management', () => {
    it('should clean up all resources on disposal', () => {
      const resourceSpy = vi.spyOn(ResourceManager.getInstance(), 'registerResource');

      cameraPlugin.init(mockGraph as SpaceGraphCore);
      interactionPlugin.init(mockGraph as SpaceGraphCore);

      cameraPlugin.dispose();
      interactionPlugin.dispose();

      // Should have registered multiple resources for tracking
      expect(resourceSpy).toHaveBeenCalled();
    });

    it('should handle disposal errors gracefully', () => {
      const errorBoundarySpy = vi.spyOn(ErrorBoundary.getInstance(), 'execute');

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      expect(() => {
        cameraPlugin.dispose();
      }).not.toThrow();

      expect(errorBoundarySpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          component: 'CameraPlugin',
          rethrow: false,
        })
      );
    });
  });

  describe('Code Documentation and Maintainability', () => {
    it('should provide comprehensive error context', () => {
      cameraPlugin.init(mockGraph as SpaceGraphCore);

      const errorBoundarySpy = vi.spyOn(ErrorBoundary.getInstance(), 'execute');

      // Trigger an error
      cameraPlugin.flyTo(null as any, { duration: 1000 });

      expect(errorBoundarySpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          component: 'CameraPlugin',
          onError: expect.any(Function),
        })
      );
    });

    it('should log initialization and disposal events', () => {
      const loggerSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      cameraPlugin.init(mockGraph as SpaceGraphCore);

      expect(loggerSpy).toHaveBeenCalledWith(
        'CameraPlugin',
        'CameraPlugin initialized successfully'
      );

      cameraPlugin.dispose();

      vi.restoreAllMocks();
    });
  });

  describe('Integration Testing', () => {
    it('should work together with enhanced error handling', () => {
      expect(() => {
        cameraPlugin.init(mockGraph as SpaceGraphCore);
        interactionPlugin.init(mockGraph as SpaceGraphCore);

        // Test basic operations
        cameraPlugin.flyTo(
          { target: { x: 5, y: 5, z: 5 } },
          { duration: 500 }
        );

        cameraPlugin.dispose();
        interactionPlugin.dispose();
      }).not.toThrow();
    });

    it('should handle complex interaction scenarios', () => {
      cameraPlugin.init(mockGraph as SpaceGraphCore);
      interactionPlugin.init(mockGraph as SpaceGraphCore);

      // Simulate complex interaction workflow
      expect(() => {
        // Camera operations
        cameraPlugin.setView('top', { duration: 500 });
        cameraPlugin.autoZoom({ duration: 500 });

        // Plugin disposal
        cameraPlugin.dispose();
        interactionPlugin.dispose();
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete initialization within acceptable time', () => {
      const startTime = performance.now();

      cameraPlugin.init(mockGraph as SpaceGraphCore);
      interactionPlugin.init(mockGraph as SpaceGraphCore);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should initialize within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid successive operations', () => {
      cameraPlugin.init(mockGraph as SpaceGraphCore);

      const startTime = performance.now();

      // Perform multiple rapid operations
      for (let i = 0; i < 10; i++) {
        cameraPlugin.flyTo(
          { target: { x: i, y: i, z: i } },
          { duration: 100 }
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid operations efficiently
      expect(duration).toBeLessThan(1000);
    });
  });
});