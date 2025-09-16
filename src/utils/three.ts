import * as THREE from 'three';
import {
  CSS3DRenderer,
  CSS3DObject,
} from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// This file should only export THREE and related utilities.
// The monkey-patching for three-mesh-bvh should be done in the application entry point.

export { THREE, CSS3DRenderer, CSS3DObject };
