import { createEffect } from 'solid-js';
import { Store } from 'solid-js/store';
import * as THREE from 'three';
import { HtmlNodeSpec, Spec } from '../types';
import { CullingManager } from '../utils/CullingManager';
import { LODManager } from '../utils/LODManager';

export class HTMLRenderer {
  private cssScene: THREE.Scene;
  private css3DScene: THREE.Scene;
  private state: Store<Spec>;
  private cullingManager?: CullingManager;
  private lodManager?: LODManager;
  private htmlObjects: Map<string, THREE.Object3D> = new Map();
  private disposeEffect?: () => void;

  constructor(cssScene: THREE.Scene, css3DScene: THREE.Scene, state: Store<Spec>) {
    this.cssScene = cssScene;
    this.css3DScene = css3DScene;
    this.state = state;

    // Initialize performance optimization systems if enabled
    if (state.performance?.enableCulling) {
      this.cullingManager = new CullingManager();
    }
    
    if (state.performance?.enableLOD) {
      this.lodManager = new LODManager();
    }

    createEffect(() => {
      // This effect will run whenever the nodes array changes.
      // With the new element actor system, HTML nodes are managed by HtmlNodeElementActor
      // This renderer is primarily responsible for maintaining the CSS scenes
      // and applying performance optimizations
      this.updatePerformanceSystems();
    });
  }

  public updateHTMLNodes() {
    // With the new element actor system, HTML nodes are managed by HtmlNodeElementActor
    // This method is kept for backward compatibility but does nothing
    // Performance optimizations are applied continuously in the render loop
  }

  public dispose() {
    // Cleanup is handled by the element actors
    this.htmlObjects.clear();
    this.cullingManager?.clear();
    this.lodManager?.clear();
  }
  
  public getCssScene(): THREE.Scene {
    return this.cssScene;
  }
  
  public getCss3DScene(): THREE.Scene {
    return this.css3DScene;
  }
  
  public registerHtmlObject(nodeId: string, object: THREE.Object3D): void {
    this.htmlObjects.set(nodeId, object);
    
    // Register with culling system if enabled
    if (this.cullingManager) {
      this.cullingManager.registerObject(object);
    }
    
    // Register with LOD system if enabled
    if (this.lodManager) {
      // Define LOD settings for HTML nodes
      const settings = {
        distances: [50, 100, 200],
        detailLevels: [
          (obj: THREE.Object3D) => obj, // Full detail
          (obj: THREE.Object3D) => obj, // Medium detail (could reduce complexity)
          (obj: THREE.Object3D) => obj  // Low detail (could hide or simplify)
        ]
      };
      this.lodManager.registerObject(object, settings);
    }
  }
  
  public unregisterHtmlObject(nodeId: string): void {
    const object = this.htmlObjects.get(nodeId);
    if (object) {
      this.cullingManager?.unregisterObject(object);
      this.lodManager?.unregisterObject(object);
      this.htmlObjects.delete(nodeId);
    }
  }
  
  public updatePerformanceSystems(): void {
    // This method is called from the createEffect in the constructor
    // In a more sophisticated implementation, we would update the performance systems
    // with camera information, but for now we'll just ensure they're initialized
  }
  
  public getVisibleHtmlObjects(): THREE.Object3D[] {
    if (this.cullingManager) {
      return this.cullingManager.cullObjects();
    }
    return Array.from(this.htmlObjects.values());
  }
}
