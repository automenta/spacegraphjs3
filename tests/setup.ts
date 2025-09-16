// Mock SolidJS devtools global to prevent errors in test environment
if (typeof globalThis !== 'undefined') {
  (globalThis as any)._$SolidDev = { registerGraph: () => {} };
}

// Dynamically import and apply the monkey-patch for all tests
import('three').then(THREE => {
  import('three-mesh-bvh').then(({
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree,
  }) => {
    THREE.Mesh.prototype.raycast = acceleratedRaycast;
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  });
});
