import { afterEach, beforeEach, vi, expect } from 'vitest';
import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

// Mock SolidJS devtools global to prevent errors in test environment
if (typeof globalThis !== 'undefined') {
  (globalThis as any)._$SolidDev = {
    registerGraph: () => {},
  };
}

// Apply the monkey-patch for all tests
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

// Mock FontLoader to prevent network requests in tests
vi.mock('three/examples/jsm/loaders/FontLoader.js', () => {
  return {
    FontLoader: vi.fn().mockImplementation(() => {
      return {
        load: vi.fn().mockImplementation((url, onLoad, onProgress, onError) => {
          // Simulate async loading with a minimal delay
          setTimeout(() => {
            if (onError) {
              onError(new Error('Network request disabled in tests'));
            }
          }, 0);
        })
      };
    })
  };
});

// Fail tests on console errors and warnings
let consoleErrorSpy: any;
let consoleWarnSpy: any;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error');
  consoleWarnSpy = vi.spyOn(console, 'warn');
});

afterEach(() => {
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  // Allow warnings only for TextElementActor in test environment
  const warnings = consoleWarnSpy.mock.calls;
  const nonTextActorWarnings = warnings.filter((call: any[]) =>
    !call[0]?.includes('Failed to create text geometry for node')
  );
  expect(nonTextActorWarnings).toHaveLength(0);
  
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});
