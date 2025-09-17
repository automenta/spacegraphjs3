import { vi, afterEach, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

// Mock SolidJS devtools global to prevent errors in test environment
if (typeof globalThis !== 'undefined') {
  (globalThis as any)._$SolidDev = {
    registerGraph: () => {
    },
  };
}

// Apply the monkey-patch for all tests
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

// Fail tests on console errors and warnings
let consoleErrorSpy: any;
let consoleWarnSpy: any;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error');
  consoleWarnSpy = vi.spyOn(console, 'warn');
});

afterEach(() => {
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  expect(consoleWarnSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});
