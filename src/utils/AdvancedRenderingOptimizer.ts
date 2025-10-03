import * as THREE from 'three';
import { SpaceGraph } from '../core/SpaceGraph';
import { Logger } from './Logger';

// Extend the Performance interface to include memory property
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

/**
 * Configuration for advanced rendering optimizations
 */
export interface RenderingOptimizationConfig {
  /**
   * Enable frustum culling optimization
   */
  enableFrustumCulling: boolean;

  /**
   * Enable occlusion culling optimization
   */
  enableOcclusionCulling: boolean;

  /**
   * Enable level of detail (LOD) optimization
   */
  enableLOD: boolean;

  /**
   * Enable dynamic batching optimization
   */
  enableDynamicBatching: boolean;

  /**
   * Enable texture streaming optimization
   */
  enableTextureStreaming: boolean;

  /**
   * Enable dynamic shader compilation optimization
   */
  enableDynamicShaders: boolean;

  /**
   * Threshold for switching to instanced rendering
   */
  instancingThreshold: number;

  /**
   * Distance threshold for LOD transitions
   */
  lodDistanceThresholds: number[];

  /**
   * Frame rate target for adaptive quality
   */
  targetFrameRate: number;

  /**
   * Enable adaptive quality scaling
   */
  enableAdaptiveQuality: boolean;
}

/**
 * Statistics for rendering performance
 */
export interface RenderingStats {
  /**
   * Current frame rate
   */
  frameRate: number;

  /**
   * Average frame time in milliseconds
   */
  avgFrameTime: number;

  /**
   * Number of rendered objects
   */
  renderedObjects: number;

  /**
   * Number of culled objects
   */
  culledObjects: number;

  /**
   * Current quality level (0-1)
   */
  qualityLevel: number;

  /**
   * Memory usage in MB
   */
  memoryUsage: number;
}

/**
 * Advanced rendering optimizer that combines multiple optimization techniques
 */
export class AdvancedRenderingOptimizer {
  private graph: SpaceGraph;
  private logger: Logger = Logger.getInstance();
  private config: RenderingOptimizationConfig;
  private stats: RenderingStats = {
    frameRate: 60,
    avgFrameTime: 16.67,
    renderedObjects: 0,
    culledObjects: 0,
    qualityLevel: 1.0,
    memoryUsage: 0,
  };

  // Performance tracking
  private frameTimes: number[] = [];
  private lastFrameTime: number = performance.now();

  // Optimization systems
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();

  // Batching system
  private batchGroups: Map<string, THREE.Group> = new Map();

  // Texture streaming
  private textureCache: Map<string, THREE.Texture> = new Map();
  private textureLoadingQueue: Set<string> = new Set();

  constructor(
    graph: SpaceGraph,
    config?: Partial<RenderingOptimizationConfig>
  ) {
    this.graph = graph;
    this.logger.setGraph(graph);

    this.config = {
      enableFrustumCulling: true,
      enableOcclusionCulling: false,
      enableLOD: true,
      enableDynamicBatching: true,
      enableTextureStreaming: false,
      enableDynamicShaders: true,
      instancingThreshold: 100,
      lodDistanceThresholds: [50, 100, 200],
      targetFrameRate: 60,
      enableAdaptiveQuality: true,
      ...config,
    };

    this.logger.info(
      'AdvancedRenderingOptimizer',
      'Initialized with config',
      this.config
    );
  }

  /**
   * Update the optimizer with the current frame data
   * @param _delta - Time since last frame in seconds
   */
  public update(_delta: number): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update frame time statistics
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Calculate average frame time and frame rate
    const avgFrameTime =
      this.frameTimes.reduce((sum, time) => sum + time, 0) /
      this.frameTimes.length;
    this.stats.avgFrameTime = avgFrameTime;
    this.stats.frameRate = 1000 / avgFrameTime;

    // Update memory usage
    if (typeof performance !== 'undefined' && performance.memory) {
      this.stats.memoryUsage =
        Math.round((performance.memory.usedJSHeapSize / 1024 / 1024) * 100) /
        100;
    }

    // Apply adaptive quality scaling if enabled
    if (this.config.enableAdaptiveQuality) {
      this.applyAdaptiveQuality();
    }
  }

  /**
   * Apply frustum culling to a set of objects
   * @param objects - Objects to cull
   * @param camera - Camera to use for culling
   * @returns Array of visible objects
   */
  public applyFrustumCulling(
    objects: THREE.Object3D[],
    camera: THREE.Camera
  ): THREE.Object3D[] {
    if (!this.config.enableFrustumCulling) {
      return objects;
    }

    // Update frustum from camera
    this.cameraMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);

    const visibleObjects: THREE.Object3D[] = [];
    let culledCount = 0;

    for (const object of objects) {
      if (this.frustum.containsPoint(object.position)) {
        visibleObjects.push(object);
      } else {
        culledCount++;
      }
    }

    this.stats.culledObjects = culledCount;
    this.stats.renderedObjects = visibleObjects.length;

    return visibleObjects;
  }

  /**
   * Apply level of detail (LOD) to objects based on distance
   * @param objects - Objects to apply LOD to
   * @param camera - Camera to calculate distances from
   */
  public applyLOD(objects: THREE.Object3D[], camera: THREE.Camera): void {
    if (!this.config.enableLOD) {
      return;
    }

    const cameraPosition = camera.position;

    for (const object of objects) {
      const distance = cameraPosition.distanceTo(object.position);

      // Determine LOD level based on distance
      let lodLevel = 0;
      for (let i = 0; i < this.config.lodDistanceThresholds.length; i++) {
        if (distance > this.config.lodDistanceThresholds[i]) {
          lodLevel = i + 1;
        } else {
          break;
        }
      }

      // Apply LOD level to object (this would typically modify the object's geometry/material)
      // For now, we'll just store the LOD level in userData
      if (!object.userData) object.userData = {};
      object.userData.lodLevel = lodLevel;
    }
  }

  /**
   * Apply dynamic batching to similar objects
   * @param objects - Objects to batch
   * @returns Batched objects grouped by material/geometry
   */
  public applyDynamicBatching(
    objects: THREE.Object3D[]
  ): Map<string, THREE.Group> {
    if (!this.config.enableDynamicBatching) {
      return new Map();
    }

    // Clear previous batches
    this.batchGroups.clear();

    // Group objects by material and geometry
    const objectGroups = new Map<string, THREE.Object3D[]>();

    for (const object of objects) {
      if (object instanceof THREE.Mesh) {
        const material = object.material;
        const geometry = object.geometry;

        // Create a key based on material and geometry
        const key = `${material.uuid}-${geometry.uuid}`;

        if (!objectGroups.has(key)) {
          objectGroups.set(key, []);
        }

        objectGroups.get(key)!.push(object);
      }
    }

    // Create batches for groups that exceed threshold
    for (const [key, groupObjects] of objectGroups.entries()) {
      if (groupObjects.length > this.config.instancingThreshold) {
        // Create a batch group
        const batchGroup = new THREE.Group();

        // For simplicity, we'll just add all objects to the group
        // In a real implementation, we would merge geometries or use instancing
        for (const object of groupObjects) {
          batchGroup.add(object);
        }

        this.batchGroups.set(key, batchGroup);
      }
    }

    return this.batchGroups;
  }

  /**
   * Apply adaptive quality scaling based on performance
   */
  private applyAdaptiveQuality(): void {
    const targetFrameTime = 1000 / this.config.targetFrameRate;

    // If we're consistently below target frame rate, reduce quality
    if (this.stats.avgFrameTime > targetFrameTime * 1.2) {
      this.stats.qualityLevel = Math.max(0.1, this.stats.qualityLevel - 0.1);
      this.logger.debug(
        'AdvancedRenderingOptimizer',
        `Reducing quality to ${this.stats.qualityLevel}`
      );
    }
    // If we're consistently above target frame rate, increase quality
    else if (this.stats.avgFrameTime < targetFrameTime * 0.8) {
      this.stats.qualityLevel = Math.min(1.0, this.stats.qualityLevel + 0.1);
      this.logger.debug(
        'AdvancedRenderingOptimizer',
        `Increasing quality to ${this.stats.qualityLevel}`
      );
    }

    // Apply quality level to rendering settings
    this.applyQualitySettings();
  }

  /**
   * Apply quality settings based on current quality level
   */
  private applyQualitySettings(): void {
    // Adjust various rendering parameters based on quality level
    const renderer = this.graph.render.getRenderer();

    // Adjust shadow quality
    if (renderer.shadowMap) {
      if (this.stats.qualityLevel < 0.3) {
        renderer.shadowMap.type = THREE.BasicShadowMap;
      } else if (this.stats.qualityLevel < 0.6) {
        renderer.shadowMap.type = THREE.PCFShadowMap;
      } else {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    }

    // Adjust antialiasing
    // Antialiasing cannot be changed after renderer creation, so we'll just log a message
    if (this.stats.qualityLevel < 0.5) {
      this.logger.debug(
        'AdvancedRenderingOptimizer',
        'Low quality: Consider disabling antialiasing'
      );
    } else {
      this.logger.debug(
        'AdvancedRenderingOptimizer',
        'High quality: Antialiasing recommended'
      );
    }
  }

  /**
   * Preload textures for upcoming objects
   * @param textureUrls - URLs of textures to preload
   */
  public preloadTextures(textureUrls: string[]): void {
    if (!this.config.enableTextureStreaming) {
      return;
    }

    for (const url of textureUrls) {
      if (!this.textureCache.has(url) && !this.textureLoadingQueue.has(url)) {
        this.textureLoadingQueue.add(url);

        // Load texture asynchronously
        const loader = new THREE.TextureLoader();
        loader.load(
          url,
          (texture) => {
            this.textureCache.set(url, texture);
            this.textureLoadingQueue.delete(url);
            this.logger.debug(
              'AdvancedRenderingOptimizer',
              `Loaded texture: ${url}`
            );
          },
          undefined,
          (error) => {
            this.logger.error(
              'AdvancedRenderingOptimizer',
              `Failed to load texture: ${url}`,
              error
            );
            this.textureLoadingQueue.delete(url);
          }
        );
      }
    }
  }

  /**
   * Get a preloaded texture
   * @param url - URL of the texture
   * @returns The texture if available, undefined otherwise
   */
  public getTexture(url: string): THREE.Texture | undefined {
    return this.textureCache.get(url);
  }

  /**
   * Get current rendering statistics
   * @returns Current rendering statistics
   */
  public getStats(): RenderingStats {
    return { ...this.stats };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  public getConfig(): RenderingOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config - New configuration
   */
  public setConfig(config: Partial<RenderingOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info(
      'AdvancedRenderingOptimizer',
      'Configuration updated',
      this.config
    );
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Dispose of textures
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();

    // Clear other resources
    this.batchGroups.clear();
    this.frameTimes = [];

    this.logger.info('AdvancedRenderingOptimizer', 'Disposed');
  }
}
