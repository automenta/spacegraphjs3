// Mock SolidJS devtools global to prevent errors in test environment
if (typeof globalThis !== 'undefined') {
  (globalThis as any)._$SolidDev = { registerGraph: () => {} };
}

import * as THREE from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

// Apply the monkey-patch for all tests
// @ts-expect-error - Linter doesn't like this, but it's the way the library is meant to be used.
THREE.Mesh.prototype.raycast = acceleratedRaycast;
// @ts-expect-error - Linter doesn't like this, but it's the way the library is meant to be used.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// @ts-expect-error - Linter doesn't like this, but it's the way the library is meant to be used.
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
