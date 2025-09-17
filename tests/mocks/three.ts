import * as THREE from 'three';

export class MockWebGLRenderer {
  domElement = document.createElement('canvas');
  setSize() {}
  render() {}
  dispose() {}
}

export class MockCSS2DRenderer {
    domElement = document.createElement('div');
    setSize() {}
    render() {}
}

export const WebGLRenderer = MockWebGLRenderer;
export const CSS2DRenderer = MockCSS2DRenderer;

// Export everything else from the original 'three' module
export * from 'three';
