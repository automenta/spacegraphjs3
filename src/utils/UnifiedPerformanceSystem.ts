/**
 * Unified Performance System
 * Consolidated performance monitoring, optimization, and rendering utilities
 */

import * as THREE from 'three';
import { BaseUtilitySystem } from './abstractions/BaseUtilitySystem';
import { ThreeObjectPoolManager } from './ThreeObjectPoolManager';
import { CullingManager } from './CullingManager';
import { LODManager, LODSettings } from './LODManager';
import { MemoryManager } from './MemoryManager';
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
 * Configuration for unified performance system
 */
export interface UnifiedPerformanceConfig {
  // Basic monitoring
  enableFPSMonitoring?: boolean;
  enableMemoryTracking?: boolean;
  enableRenderTiming?: boolean;
  updateInterval?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;

  // Optimization strategies
  enableObjectPooling?: boolean;
  enableFrustumCulling?: boolean;
  enableLOD?: boolean;
  enableMemoryManagement?: boolean;
  enableBatching?: boolean;
  enableInstancing?: boolean;

  // Rendering optimizations
  enableOcclusionCulling?: boolean;
  enableDynamicBatching?: boolean;
  enableTextureStreaming?: boolean;
  enableDynamicShaders?: boolean;
  enableAdaptiveQuality?: boolean;

  // Thresholds and targets
  maxFPS?: number;
  targetFrameTime?: number;
  qualityLevel?: 'low' | 'medium' | 'high' | 'ultra';
  instancingThreshold?: number;
  lodDistanceThresholds?: number[];
  targetFrameRate?: number;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  // Basic metrics
  fps: number;
  frameTime: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  renderTime: number;

  // Advanced metrics
  drawCalls: number;
  triangles: number;
  objectCount: number;
  textureCount: number;
  shaderCount: number;
  qualityLevel: number;
  isThrottling: boolean;

  // Rendering stats
  renderedObjects: number;
  culledObjects: number;
  avgFrameTime: number;
}

/**
 * Strategy interface for different optimization techniques
 */
export interface IOptimizationStrategy {
  init(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer): void;
  update(): void;
  dispose(): void;
  getName(): string;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}

/**
 * Object Pooling Strategy
 */
export class ObjectPoolingStrategy implements IOptimizationStrategy {
  private poolManager: ThreeObjectPoolManager;
  private enabled = true;

  constructor(private config: { maxPoolSize?: number } = {}) {
    this.poolManager = ThreeObjectPoolManager.getInstance();
  }

  init(_scene: THREE.Scene, _camera: THREE.Camera, _renderer: THREE.WebGLRenderer): void {
    // ThreeObjectPoolManager is already initialized globally
  }

  update(): void {
    // Object pooling doesn't need per-frame updates
  }

  dispose(): void {
    // ThreeObjectPoolManager is managed globally, don't dispose here
  }

  getName(): string {
    return 'ObjectPooling';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public getVector3(): THREE.Vector3 {
    return this.poolManager.getVector3();
  }

  public releaseVector3(vec: THREE.Vector3): void {
    this.poolManager.releaseVector3(vec);
  }

  public getMaterial(color?: THREE.Color): THREE.MeshBasicMaterial {
    return this.poolManager.getMaterial(color);
  }

  public releaseMaterial(mat: THREE.MeshBasicMaterial): void {
    this.poolManager.releaseMaterial(mat);
  }
}

/**
 * Frustum Culling Strategy
 */
export class FrustumCullingStrategy implements IOptimizationStrategy {
  private cullingManager: CullingManager;
  private enabled = true;

  constructor() {
    this.cullingManager = new CullingManager();
  }

  init(_scene: THREE.Scene, camera: THREE.Camera, _renderer: THREE.WebGLRenderer): void {
    this.cullingManager.setCamera(camera);
  }

  update(): void {
    if (this.enabled) {
      this.cullingManager.updateFrustum();
    }
  }

  dispose(): void {
    this.cullingManager.clear();
  }

  getName(): string {
    return 'FrustumCulling';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public registerObject(object: THREE.Object3D): void {
    this.cullingManager.registerObject(object);
  }

  public unregisterObject(object: THREE.Object3D): void {
    this.cullingManager.unregisterObject(object);
  }
}

/**
 * LOD Strategy
 */
export class LODStrategy implements IOptimizationStrategy {
  private lodManager: LODManager;
  private enabled = true;
  private qualityLevel = 2;

  constructor(private config: { qualityLevel?: number } = {}) {
    this.lodManager = new LODManager();
    this.qualityLevel = config.qualityLevel || 2;
  }

  init(_scene: THREE.Scene, camera: THREE.Camera, _renderer: THREE.WebGLRenderer): void {
    this.lodManager.setCamera(camera);
  }

  update(): void {
    if (this.enabled) {
      this.lodManager.update();
    }
  }

  dispose(): void {
    this.lodManager.clear();
  }

  getName(): string {
    return 'LOD';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public registerObject(object: THREE.Object3D, settings: LODSettings): void {
    this.lodManager.registerObject(object, settings);
  }

  public setQualityLevel(level: number): void {
    this.qualityLevel = Math.max(0, Math.min(3, level));
  }
}

/**
 * Memory Management Strategy
 */
export class MemoryManagementStrategy implements IOptimizationStrategy {
  private memoryManager: MemoryManager;
  private enabled = true;

  constructor() {
    this.memoryManager = MemoryManager.getInstance();
  }

  init(scene: THREE.Scene, _camera: THREE.Camera, _renderer: THREE.WebGLRenderer): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Material || object instanceof THREE.Texture) {
        this.memoryManager.trackObject(object);
      }
    });
  }

  update(): void {
    // Memory management updates happen periodically
  }

  dispose(): void {
    this.memoryManager.disposeAllTrackedObjects();
  }

  getName(): string {
    return 'MemoryManagement';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public trackObject(object: any): void {
    this.memoryManager.trackObject(object);
  }
}

/**
 * Geometry Batching Strategy
 */
export class GeometryBatchingStrategy implements IOptimizationStrategy {
  private enabled = true;
  private batchedObjects: Map<string, THREE.Mesh> = new Map();

  init(scene: THREE.Scene, _camera: THREE.Camera, _renderer: THREE.WebGLRenderer): void {
    this.createBatchedMeshes(scene);
  }

  update(): void {
    // Batching doesn't need per-frame updates
  }

  dispose(): void {
    for (const mesh of this.batchedObjects.values()) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }
    this.batchedObjects.clear();
  }

  getName(): string {
    return 'GeometryBatching';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private createBatchedMeshes(scene: THREE.Scene): void {
    const batchGroups = new Map<string, THREE.Mesh[]>();

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material && !object.userData.isBatched) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        const key = `${material.type}_${material.uuid}`;

        if (!batchGroups.has(key)) {
          batchGroups.set(key, []);
        }
        batchGroups.get(key)!.push(object);
      }
    });

    batchGroups.forEach((meshes, key) => {
      if (meshes.length > 5) {
        this.createBatchedMesh(meshes, key, scene);
      }
    });
  }

  private createBatchedMesh(meshes: THREE.Mesh[], key: string, scene: THREE.Scene): void {
    if (meshes.length === 0) return;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    meshes.forEach((mesh) => {
      if (mesh.geometry) geometries.push(mesh.geometry);
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          materials.push(...mesh.material);
        } else {
          materials.push(mesh.material);
        }
      }
    });

    if (geometries.length === 0) return;

    const mergedGeometry = this.mergeGeometries(geometries);
    if (!mergedGeometry) return;

    const batchedMesh = new THREE.Mesh(mergedGeometry, materials[0]);
    batchedMesh.userData.isBatched = true;
    batchedMesh.userData.originalMeshes = meshes.map((m) => m.uuid);

    const parent = meshes[0].parent || scene;
    parent.add(batchedMesh);

    meshes.forEach((mesh) => {
      mesh.visible = false;
      mesh.userData.batchedBy = batchedMesh.uuid;
    });

    this.batchedObjects.set(key, batchedMesh);
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
    if (geometries.length === 0) return null;
    if (geometries.length === 1) return geometries[0];

    try {
      const mergedGeometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      let vertexOffset = 0;

      geometries.forEach((geometry) => {
        const pos = geometry.attributes.position?.array;
        const norm = geometry.attributes.normal?.array;
        const uv = geometry.attributes.uv?.array;
        const index = geometry.index?.array;

        if (pos) positions.push(...Array.from(pos));
        if (norm) normals.push(...Array.from(norm));
        if (uv) uvs.push(...Array.from(uv));

        if (index) {
          indices.push(...Array.from(index).map((i) => i + vertexOffset));
        } else {
          for (let i = 0; i < pos.length / 3; i++) {
            indices.push(vertexOffset + i);
          }
        }

        vertexOffset += pos.length / 3;
      });

      if (positions.length > 0) {
        mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      }
      if (normals.length > 0) {
        mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      }
      if (uvs.length > 0) {
        mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      }
      if (indices.length > 0) {
        mergedGeometry.setIndex(indices);
      }

      return mergedGeometry;
    } catch (error) {
      console.warn('Failed to merge geometries:', error);
      return null;
    }
  }
}

/**
 * Instancing Strategy
 */
export class InstancingStrategy implements IOptimizationStrategy {
  private enabled = true;
  private instancedObjects: Map<string, THREE.InstancedMesh> = new Map();

  init(scene: THREE.Scene, _camera: THREE.Camera, _renderer: THREE.WebGLRenderer): void {
    this.createInstancedMeshes(scene);
  }

  update(): void {
    for (const instancedMesh of this.instancedObjects.values()) {
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    for (const instancedMesh of this.instancedObjects.values()) {
      if (instancedMesh.geometry) instancedMesh.geometry.dispose();
      if (instancedMesh.material) {
        if (Array.isArray(instancedMesh.material)) {
          instancedMesh.material.forEach((mat) => mat.dispose());
        } else {
          instancedMesh.material.dispose();
        }
      }
    }
    this.instancedObjects.clear();
  }

  getName(): string {
    return 'Instancing';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private createInstancedMeshes(scene: THREE.Scene): void {
    const instanceGroups = new Map<string, THREE.Mesh[]>();

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry && object.material && !object.userData.isInstanced) {
        const geometry = object.geometry;
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        const key = `${geometry.uuid}_${material.uuid}`;

        if (!instanceGroups.has(key)) {
          instanceGroups.set(key, []);
        }
        instanceGroups.get(key)!.push(object);
      }
    });

    instanceGroups.forEach((meshes, key) => {
      if (meshes.length > 10) {
        this.createInstancedMesh(meshes, key, scene);
      }
    });
  }

  private createInstancedMesh(meshes: THREE.Mesh[], key: string, scene: THREE.Scene): void {
    if (meshes.length === 0) return;

    const templateMesh = meshes[0];
    const geometry = templateMesh.geometry;
    const material = Array.isArray(templateMesh.material) ? templateMesh.material[0] : templateMesh.material;

    const instancedMesh = new THREE.InstancedMesh(geometry, material, meshes.length);
    instancedMesh.userData.isInstanced = true;
    instancedMesh.userData.originalMeshes = meshes.map((m) => m.uuid);

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    meshes.forEach((mesh, index) => {
      matrix.compose(mesh.position, mesh.quaternion, mesh.scale);
      instancedMesh.setMatrixAt(index, matrix);

      if (material instanceof THREE.MeshBasicMaterial && mesh.material instanceof THREE.MeshBasicMaterial) {
        color.copy(mesh.material.color);
        instancedMesh.setColorAt(index, color);
      }

      mesh.visible = false;
      mesh.userData.instancedBy = instancedMesh.uuid;
    });

    const parent = meshes[0].parent || scene;
    parent.add(instancedMesh);

    this.instancedObjects.set(key, instancedMesh);
  }
}

/**
 * Main Unified Performance System
 */
export class UnifiedPerformanceSystem extends BaseUtilitySystem {
  private strategies: Map<string, IOptimizationStrategy> = new Map();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private config: Required<UnifiedPerformanceConfig>;
  private logger: Logger = Logger.getInstance();

  // Performance tracking
  private metrics: PerformanceMetrics;
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private throttling = false;

  // Rendering optimization
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private textureLoadingQueue: Set<string> = new Set();

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    config: UnifiedPerformanceConfig = {}
  ) {
    super('UnifiedPerformance');
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.config = {
      enableFPSMonitoring: true,
      enableMemoryTracking: true,
      enableRenderTiming: true,
      updateInterval: 1000,
      enableObjectPooling: true,
      enableFrustumCulling: true,
      enableLOD: true,
      enableMemoryManagement: true,
      enableBatching: true,
      enableInstancing: true,
      enableOcclusionCulling: false,
      enableDynamicBatching: true,
      enableTextureStreaming: false,
      enableDynamicShaders: true,
      enableAdaptiveQuality: true,
      maxFPS: 60,
      targetFrameTime: 16.67,
      qualityLevel: 'high',
      instancingThreshold: 100,
      lodDistanceThresholds: [50, 100, 200],
      targetFrameRate: 60,
      ...config,
    };

    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      nodeCount: 0,
      edgeCount: 0,
      renderTime: 0,
      drawCalls: 0,
      triangles: 0,
      objectCount: 0,
      textureCount: 0,
      shaderCount: 0,
      qualityLevel: this.getQualityLevelValue(this.config.qualityLevel),
      isThrottling: false,
      renderedObjects: 0,
      culledObjects: 0,
      avgFrameTime: 16.67,
    };

    this.initializeStrategies();
  }

  protected onInit(): void {
    this.initStrategies();
    this.startPerformanceMonitoring();
  }

  protected onUpdate(_deltaTime: number): void {
    this.updateMetrics();
    this.checkPerformanceThresholds();

    if (this.config.enableAdaptiveQuality) {
      this.adaptQuality();
    }

    for (const strategy of this.strategies.values()) {
      if (strategy.isEnabled()) {
        strategy.update();
      }
    }
  }

  protected onPerformanceModeChanged(enabled: boolean): void {
    for (const strategy of this.strategies.values()) {
      strategy.setEnabled(!enabled);
    }

    if (enabled) {
      this.setQualityLevel('low');
    }
  }

  protected onDispose(): void {
    this.stopPerformanceMonitoring();
    for (const strategy of this.strategies.values()) {
      strategy.dispose();
    }
    this.strategies.clear();

    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();
  }

  private initializeStrategies(): void {
    if (this.config.enableObjectPooling) {
      this.strategies.set('objectPooling', new ObjectPoolingStrategy());
    }

    if (this.config.enableFrustumCulling) {
      this.strategies.set('frustumCulling', new FrustumCullingStrategy());
    }

    if (this.config.enableLOD) {
      this.strategies.set('lod', new LODStrategy({
        qualityLevel: this.getQualityLevelValue(this.config.qualityLevel),
      }));
    }

    if (this.config.enableMemoryManagement) {
      this.strategies.set('memoryManagement', new MemoryManagementStrategy());
    }

    if (this.config.enableBatching) {
      this.strategies.set('geometryBatching', new GeometryBatchingStrategy());
    }

    if (this.config.enableInstancing) {
      this.strategies.set('instancing', new InstancingStrategy());
    }
  }

  private initStrategies(): void {
    for (const strategy of this.strategies.values()) {
      strategy.init(this.scene, this.camera, this.renderer);
    }
  }

  private getQualityLevelValue(level: string): number {
    const levels = { low: 0, medium: 1, high: 2, ultra: 3 };
    return levels[level as keyof typeof levels] || 2;
  }

  private updateMetrics(): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    const fps = 1000 / frameTime;

    this.fpsHistory.push(fps);
    this.frameTimeHistory.push(frameTime);

    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
    }

    this.metrics.fps = fps;
    this.metrics.frameTime = frameTime;
    this.metrics.avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    this.metrics.drawCalls = this.renderer.info.render.calls;
    this.metrics.triangles = this.renderer.info.render.triangles;
    this.metrics.objectCount = this.scene.children.length;
    this.metrics.textureCount = this.renderer.info.memory.textures;
    this.metrics.shaderCount = this.renderer.info.programs?.length || 0;

    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576;
    }

    this.lastFrameTime = currentTime;
  }

  private checkPerformanceThresholds(): void {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;

    if (avgFPS < this.config.maxFPS * 0.8 || avgFrameTime > this.config.targetFrameTime * 1.2) {
      this.throttling = true;
      this.metrics.isThrottling = true;

      if (this.config.enableAdaptiveQuality) {
        this.reduceQuality();
      }
    } else {
      this.throttling = false;
      this.metrics.isThrottling = false;
    }

    if (this.metrics.memoryUsage > 500) {
      const memoryStrategy = this.strategies.get('memoryManagement');
      if (memoryStrategy instanceof MemoryManagementStrategy) {
        // Trigger garbage collection
      }
    }
  }

  private adaptQuality(): void {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    if (avgFPS < this.config.maxFPS * 0.7) {
      this.reduceQuality();
    } else if (avgFPS > this.config.maxFPS * 0.95 && this.metrics.qualityLevel < 3) {
      this.increaseQuality();
    }
  }

  private reduceQuality(): void {
    if (this.metrics.qualityLevel > 0) {
      this.metrics.qualityLevel--;
      this.applyQualitySettings();
    }
  }

  private increaseQuality(): void {
    if (this.metrics.qualityLevel < 3) {
      this.metrics.qualityLevel++;
      this.applyQualitySettings();
    }
  }

  private applyQualitySettings(): void {
    const qualitySettings = {
      0: { shadows: false, lodDistance: 0.5, maxRoughness: 1, maxMetalness: 0.5 },
      1: { shadows: true, lodDistance: 0.75, maxRoughness: 0.8, maxMetalness: 0.7 },
      2: { shadows: true, lodDistance: 1, maxRoughness: 0.5, maxMetalness: 0.9 },
      3: { shadows: true, lodDistance: 1.5, maxRoughness: 0.2, maxMetalness: 1.0 },
    };

    const settings = qualitySettings[this.metrics.qualityLevel as keyof typeof qualitySettings] || qualitySettings[2];

    if (this.renderer.shadowMap) {
      this.renderer.shadowMap.enabled = settings.shadows;
    }

    const lodStrategy = this.strategies.get('lod');
    if (lodStrategy instanceof LODStrategy) {
      lodStrategy.setQualityLevel(this.metrics.qualityLevel);
    }
  }

  private startPerformanceMonitoring(): void {
    const monitorLoop = () => {
      if (!this.isInitialized()) return;

      this.updateMetrics();
      this.checkPerformanceThresholds();

      if (this.config.enableAdaptiveQuality) {
        this.adaptQuality();
      }

      setTimeout(() => monitorLoop(), this.config.updateInterval);
    };

    monitorLoop();
  }

  private stopPerformanceMonitoring(): void {
    // Monitoring stops when disposed
  }

  // Public API methods
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getStrategy(name: string): IOptimizationStrategy | undefined {
    return this.strategies.get(name);
  }

  public setQualityLevel(level: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.metrics.qualityLevel = this.getQualityLevelValue(level);
    this.applyQualitySettings();
  }

  public updateConfig(newConfig: Partial<UnifiedPerformanceConfig>): void {
    Object.assign(this.config, newConfig);

    if (newConfig.qualityLevel) {
      this.setQualityLevel(newConfig.qualityLevel);
    }
  }

  public isThrottling(): boolean {
    return this.throttling;
  }

  // Compatibility methods for tests
  public startMonitoring(): void {
    this.startPerformanceMonitoring();
  }

  public stopMonitoring(): void {
    this.stopPerformanceMonitoring();
  }

  // Rendering optimization methods
  public applyFrustumCulling(objects: THREE.Object3D[], camera: THREE.Camera): THREE.Object3D[] {
    if (!this.config.enableFrustumCulling) {
      return objects;
    }

    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
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

    this.metrics.culledObjects = culledCount;
    this.metrics.renderedObjects = visibleObjects.length;

    return visibleObjects;
  }

  public applyLOD(objects: THREE.Object3D[], camera: THREE.Camera): void {
    if (!this.config.enableLOD) {
      return;
    }

    const cameraPosition = camera.position;

    for (const object of objects) {
      const distance = cameraPosition.distanceTo(object.position);
      let lodLevel = 0;

      for (let i = 0; i < this.config.lodDistanceThresholds!.length; i++) {
        if (distance > this.config.lodDistanceThresholds![i]) {
          lodLevel = i + 1;
        } else {
          break;
        }
      }

      if (!object.userData) object.userData = {};
      object.userData.lodLevel = lodLevel;
    }
  }

  public preloadTextures(textureUrls: string[]): void {
    if (!this.config.enableTextureStreaming) {
      return;
    }

    for (const url of textureUrls) {
      if (!this.textureCache.has(url) && !this.textureLoadingQueue.has(url)) {
        this.textureLoadingQueue.add(url);

        const loader = new THREE.TextureLoader();
        loader.load(
          url,
          (texture) => {
            this.textureCache.set(url, texture);
            this.textureLoadingQueue.delete(url);
            this.logger.debug('UnifiedPerformanceSystem', `Loaded texture: ${url}`);
          },
          undefined,
          (error) => {
            this.logger.error('UnifiedPerformanceSystem', `Failed to load texture: ${url}`, error);
            this.textureLoadingQueue.delete(url);
          }
        );
      }
    }
  }

  public getTexture(url: string): THREE.Texture | undefined {
    return this.textureCache.get(url);
  }

  // Utility methods from PerformanceUtils
  public static batchOperations<T>(operations: (() => T)[], batchSize: number = 10): T[] {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = batch.map((op) => op());
      results.push(...batchResults);

      if (i + batchSize < operations.length) {
        setTimeout(() => {}, 0);
      }
    }

    return results;
  }

  public static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  public static throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  public static optimizeArrayOperations<T>(array: T[], operation: (item: T) => void): void {
    const chunkSize = 1000;

    if (array.length <= chunkSize) {
      array.forEach(operation);
      return;
    }

    let index = 0;
    const processChunk = () => {
      const endIndex = Math.min(index + chunkSize, array.length);

      for (let i = index; i < endIndex; i++) {
        operation(array[i]);
      }

      index = endIndex;

      if (index < array.length) {
        setTimeout(processChunk, 0);
      }
    };

    processChunk();
  }

  public createPerformanceMonitor(): HTMLElement {
    const monitor = document.createElement('div');
    monitor.style.position = 'fixed';
    monitor.style.top = '10px';
    monitor.style.right = '10px';
    monitor.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    monitor.style.color = 'white';
    monitor.style.padding = '10px';
    monitor.style.borderRadius = '5px';
    monitor.style.fontFamily = 'monospace';
    monitor.style.fontSize = '12px';
    monitor.style.zIndex = '10000';
    monitor.style.minWidth = '150px';

    const updateDisplay = () => {
      const color = this.metrics.fps > 50 ? '#00ff00' : this.metrics.fps > 30 ? '#ffff00' : '#ff0000';
      monitor.innerHTML = `
        <div style="color: ${color}; font-weight: bold;">FPS: ${this.metrics.fps.toFixed(1)}</div>
        <div>Frame: ${this.metrics.frameTime.toFixed(2)}ms</div>
        <div>Memory: ${this.metrics.memoryUsage.toFixed(1)}MB</div>
        <div>Objects: ${this.metrics.objectCount}</div>
        <div>Draw Calls: ${this.metrics.drawCalls}</div>
      `;
    };

    setInterval(updateDisplay, 1000);
    updateDisplay();

    return monitor;
  }

  public createProfiler(name: string): PerformanceProfiler {
    return new PerformanceProfiler(name, this);
  }

  public updateElementCounts(nodeCount: number, edgeCount: number): void {
    this.metrics.nodeCount = nodeCount;
    this.metrics.edgeCount = edgeCount;
  }

  public async measureRenderTime<T>(operation: () => T | Promise<T>): Promise<{ result: T; renderTime: number }> {
    if (!this.config.enableRenderTiming) {
      const result = await operation();
      return { result, renderTime: 0 };
    }

    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    this.metrics.renderTime = renderTime;

    return { result, renderTime };
  }

  public isPerformanceAcceptable(thresholds: Partial<PerformanceMetrics> = {}): boolean {
    const defaultThresholds = {
      fps: 30,
      frameTime: 33.33,
      memoryUsage: 100,
      renderTime: 16.67,
    };

    const actualThresholds = { ...defaultThresholds, ...thresholds };

    return (
      this.metrics.fps >= actualThresholds.fps! &&
      this.metrics.frameTime <= actualThresholds.frameTime! &&
      this.metrics.memoryUsage <= actualThresholds.memoryUsage! &&
      this.metrics.renderTime <= actualThresholds.renderTime!
    );
  }

  public getPerformanceColor(): string {
    if (this.metrics.fps > 50) return '#00ff00';
    if (this.metrics.fps > 30) return '#ffff00';
    return '#ff0000';
  }

  public getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.fps < 30) {
      recommendations.push('Consider reducing node count or complexity');
      recommendations.push('Enable LOD (Level of Detail) for distant objects');
      recommendations.push('Reduce animation complexity');
    }

    if (this.metrics.frameTime > 33) {
      recommendations.push('Optimize rendering pipeline');
      recommendations.push('Consider culling off-screen objects');
    }

    if (this.metrics.memoryUsage > 100) {
      recommendations.push('Monitor memory usage - consider object pooling');
      recommendations.push('Check for memory leaks in event listeners');
    }

    if (this.metrics.renderTime > 16) {
      recommendations.push('Optimize individual render operations');
      recommendations.push('Consider batching similar operations');
    }

    return recommendations;
  }
}

/**
 * Performance Profiler for specific operations
 */
export class PerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  constructor(private name: string, private performanceSystem: UnifiedPerformanceSystem) {}

  public mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  public measure(startLabel: string, endLabel: string, measureName?: string): number {
    const startTime = this.marks.get(startLabel);
    const endTime = this.marks.get(endLabel);

    if (startTime === undefined || endTime === undefined) {
      console.warn(`PerformanceProfiler: Missing marks for measurement`);
      return 0;
    }

    const duration = endTime - startTime;
    const name = measureName || `${startLabel}-${endLabel}`;
    this.measures.set(name, duration);

    return duration;
  }

  public getMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  public logSummary(): void {
    console.group(`Performance Profile: ${this.name}`);

    this.measures.forEach((duration, name) => {
      console.log(`${name}: ${duration.toFixed(2)}ms`);
    });

    console.groupEnd();
  }

  public clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Export factory function
export function createUnifiedPerformanceSystem(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  config?: UnifiedPerformanceConfig
): UnifiedPerformanceSystem {
  return new UnifiedPerformanceSystem(scene, camera, renderer, config);
}

export default UnifiedPerformanceSystem;
/**
 * Advanced Rendering Optimizer - Stub implementation
 * TODO: Implement full advanced rendering optimization features
 */
export class AdvancedRenderingOptimizer {
  constructor(private graph: any) {}

  update(_deltaTime: number): void {
    // Stub implementation
  }

  dispose(): void {
    // Stub implementation
  }
}