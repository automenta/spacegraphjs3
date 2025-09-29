import { vi } from 'vitest';
import * as THREE from 'three';

export class RenderingManager {
  public scene: THREE.Scene;
  public cssScene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public container: HTMLElement;
  public renderer: any;
  public cssRenderer: any;
  public nodeRenderer: any;
  public edgeRenderer: any;
  public htmlRenderer: any;
  dispose = vi.fn();

  constructor() {
    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.container = document.createElement('div');
    this.renderer = {
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    };
    this.cssRenderer = {
      domElement: document.createElement('div'),
      setSize: vi.fn(),
      render: vi.fn(),
    };
    this.nodeRenderer = {
      getRaycastableObjects: () => [],
      getNodeIdFromIntersection: () => null,
      dispose: vi.fn(),
    };
    this.edgeRenderer = {
      lineSegments: {
        geometry: {
          getAttribute: () => ({
            array: [],
            count: 0,
          }),
        },
      },
      dispose: vi.fn(),
    };
    this.htmlRenderer = {
      dispose: vi.fn(),
    };
  }

  getScene = () => this.scene;

  getCamera = () => this.camera;

  getContainer = () => this.container;

  getRendererDomElement = () => this.renderer.domElement;

  getRenderer = () => this.renderer;

  getNodeRenderer = () => this.nodeRenderer;

  getEdgeRenderer = () => this.edgeRenderer;
}
