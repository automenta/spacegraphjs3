import * as THREE from 'three';
import {
  CSS3DRenderer,
  CSS3DObject,
} from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

// Add the bvh properties to the THREE objects
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export { THREE, CSS3DRenderer, CSS3DObject };
