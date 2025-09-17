import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  MeshBVH,
} from 'three-mesh-bvh';

declare module 'three' {
  interface BufferGeometry {
    boundsTree: MeshBVH | null;
    computeBoundsTree: typeof computeBoundsTree;
    disposeBoundsTree: typeof disposeBoundsTree;
  }

  interface Raycaster {
    firstHitOnly: boolean;
  }

  // This is required because three-mesh-bvh modifies the Mesh.prototype directly.
  // It's not ideal, but it reflects the reality of the library's implementation.
  interface Mesh {
    raycast: typeof acceleratedRaycast;
  }
}
