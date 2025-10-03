/**
 * Optimized Performance System
 * Refactored version of PerformanceOptimizer with better modularity and separation of concerns
 */

import * as THREE from 'three';
import { BaseUtilitySystem } from './abstractions/BaseUtilitySystem';
import { ObjectPool } from './ObjectPool';
import { CullingManager } from './CullingManager';
import { LODManager, LODSettings } from './LODManager';
import { MemoryManager } from './MemoryManager';

// Configuration interfaces
export interface PerformanceConfig {
  enableObjectPooling?: boolean;
  enableFrustumCulling?: boolean;
  enableLOD?: boolean;
  enableMemoryManagement?: boolean;
  enableBatching?: boolean;
  enableInstancing?: boolean;
  maxFPS?: number;
  targetFrameTime?: number;
  qualityLevel?: 'low' | 'medium' | 'high' | 'ultra';
  adaptiveQuality?: boolean;
  updateInterval?: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  objectCount: number;
  textureCount: number;
  shaderCount: number;
  qualityLevel: number;
  isThrottling: boolean;
}

// Strategy interfaces for different optimization techniques
export interface IOptimizationStrategy {
  init(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ): void;
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
  private pools: Map<string, ObjectPool<any>> = new Map();
  private enabled = true;

  constructor(private config: { maxPoolSize?: number } = {}) {}

  init(
    _scene: THREE.Scene,
    _camera: THREE.Camera,
    _renderer: THREE.WebGLRenderer
  ): void {
    this.setupDefaultPools();
  }

  update(): void {
    // Object pooling doesn't need per-frame updates
  }

  dispose(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
    this.pools.clear();
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

  private setupDefaultPools(): void {
    const maxSize = this.config.maxPoolSize || 100;

    this.pools.set(
      'vector3',
      new ObjectPool(() => new THREE.Vector3(), undefined, maxSize)
    );
    this.pools.set(
      'matrix4',
      new ObjectPool(() => new THREE.Matrix4(), undefined, maxSize)
    );
    this.pools.set(
      'color',
      new ObjectPool(() => new THREE.Color(), undefined, maxSize)
    );
    this.pools.set(
      'mesh',
      new ObjectPool(() => new THREE.Mesh(), undefined, maxSize / 2)
    );
    this.pools.set(
      'group',
      new ObjectPool(() => new THREE.Group(), undefined, maxSize / 4)
    );
  }

  public getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  public registerPool<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool);
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

  init(
    _scene: THREE.Scene,
    camera: THREE.Camera,
    _renderer: THREE.WebGLRenderer
  ): void {
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
  private qualityLevel = 2; // 0-3 scale

  constructor(private config: { qualityLevel?: number } = {}) {
    this.lodManager = new LODManager();
    this.qualityLevel = config.qualityLevel || 2;
  }

  init(
    _scene: THREE.Scene,
    camera: THREE.Camera,
    _renderer: THREE.WebGLRenderer
  ): void {
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

  init(
    scene: THREE.Scene,
    _camera: THREE.Camera,
    _renderer: THREE.WebGLRenderer
  ): void {
    // Track objects for memory management
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Material ||
        object instanceof THREE.Texture
      ) {
        this.memoryManager.trackObject(object);
      }
    });
  }

  update(): void {
    // Memory management updates happen periodically
    // Note: MemoryManager doesn't have an update method, it manages objects automatically
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

  init(
    scene: THREE.Scene,
    _camera: THREE.Camera,
    _renderer: THREE.WebGLRenderer
  ): void {
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
      if (
        object instanceof THREE.Mesh &&
        object.material &&
        !object.userData.isBatched
      ) {
        const material = Array.isArray(object.material)
          ? object.material[0]
          : object.material;
        const key = `${material.type}_${material.uuid}`;

        if (!batchGroups.has(key)) {
          batchGroups.set(key, []);
        }
        batchGroups.get(key)!.push(object);
      }
    });

    // Create batched meshes for groups with multiple objects
    batchGroups.forEach((meshes, key) => {
      if (meshes.length > 5) {
        this.createBatchedMesh(meshes, key, scene);
      }
    });
  }

  private createBatchedMesh(
    meshes: THREE.Mesh[],
    key: string,
    scene: THREE.Scene
  ): void {
    if (meshes.length === 0) return;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    meshes.forEach((mesh) => {
      if (mesh.geometry) {
        geometries.push(mesh.geometry);
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          materials.push(...mesh.material);
        } else {
          materials.push(mesh.material);
        }
      }
    });

    if (geometries.length === 0) return;

    // Create merged geometry
    const mergedGeometry = this.mergeGeometries(geometries);
    if (!mergedGeometry) return;

    // Create batched mesh
    const batchedMesh = new THREE.Mesh(mergedGeometry, materials[0]);
    batchedMesh.userData.isBatched = true;
    batchedMesh.userData.originalMeshes = meshes.map((m) => m.uuid);

    // Replace original meshes
    const parent = meshes[0].parent || scene;
    parent.add(batchedMesh);

    meshes.forEach((mesh) => {
      mesh.visible = false;
      mesh.userData.batchedBy = batchedMesh.uuid;
    });

    this.batchedObjects.set(key, batchedMesh);
  }

  private mergeGeometries(
    geometries: THREE.BufferGeometry[]
  ): THREE.BufferGeometry | null {
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
        mergedGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(positions, 3)
        );
      }
      if (normals.length > 0) {
        mergedGeometry.setAttribute(
          'normal',
          new THREE.Float32BufferAttribute(normals, 3)
        );
      }
      if (uvs.length > 0) {
        mergedGeometry.setAttribute(
          'uv',
          new THREE.Float32BufferAttribute(uvs, 2)
        );
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

  init(
    scene: THREE.Scene,
    _camera: THREE.Camera,
    _renderer: THREE.WebGLRenderer
  ): void {
    this.createInstancedMeshes(scene);
  }

  update(): void {
    // Update instanced mesh matrices if needed
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
    // Find objects suitable for instancing
    const instanceGroups = new Map<string, THREE.Mesh[]>();

    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.geometry &&
        object.material &&
        !object.userData.isInstanced
      ) {
        const geometry = object.geometry;
        const material = Array.isArray(object.material)
          ? object.material[0]
          : object.material;
        const key = `${geometry.uuid}_${material.uuid}`;

        if (!instanceGroups.has(key)) {
          instanceGroups.set(key, []);
        }
        instanceGroups.get(key)!.push(object);
      }
    });

    // Create instanced meshes for groups with multiple similar objects
    instanceGroups.forEach((meshes, key) => {
      if (meshes.length > 10) {
        this.createInstancedMesh(meshes, key, scene);
      }
    });
  }

  private createInstancedMesh(
    meshes: THREE.Mesh[],
    key: string,
    scene: THREE.Scene
  ): void {
    if (meshes.length === 0) return;

    const templateMesh = meshes[0];
    const geometry = templateMesh.geometry;
    const material = Array.isArray(templateMesh.material)
      ? templateMesh.material[0]
      : templateMesh.material;

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      meshes.length
    );
    instancedMesh.userData.isInstanced = true;
    instancedMesh.userData.originalMeshes = meshes.map((m) => m.uuid);

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    meshes.forEach((mesh, index) => {
      // Set instance matrix
      matrix.compose(mesh.position, mesh.quaternion, mesh.scale);
      instancedMesh.setMatrixAt(index, matrix);

      // Set instance color if material supports it
      if (
        material instanceof THREE.MeshBasicMaterial &&
        mesh.material instanceof THREE.MeshBasicMaterial
      ) {
        color.copy(mesh.material.color);
        instancedMesh.setColorAt(index, color);
      }

      // Hide original mesh
      mesh.visible = false;
      mesh.userData.instancedBy = instancedMesh.uuid;
    });

    // Add to scene
    const parent = meshes[0].parent || scene;
    parent.add(instancedMesh);

    this.instancedObjects.set(key, instancedMesh);
  }
}

/**
 * Main Optimized Performance System
 */
export class OptimizedPerformanceSystem extends BaseUtilitySystem {
  private strategies: Map<string, IOptimizationStrategy> = new Map();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private config: Required<PerformanceConfig>;
  private metrics: PerformanceMetrics;

  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private throttling = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    config: PerformanceConfig = {}
  ) {
    super('OptimizedPerformance');
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.config = {
      enableObjectPooling: true,
      enableFrustumCulling: true,
      enableLOD: true,
      enableMemoryManagement: true,
      enableBatching: true,
      enableInstancing: true,
      maxFPS: 60,
      targetFrameTime: 16.67,
      qualityLevel: 'high',
      adaptiveQuality: true,
      updateInterval: 1000,
      ...config,
    };

    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      objectCount: 0,
      textureCount: 0,
      shaderCount: 0,
      qualityLevel: this.getQualityLevelValue(this.config.qualityLevel),
      isThrottling: false,
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

    if (this.config.adaptiveQuality) {
      this.adaptQuality();
    }

    // Update all strategies
    for (const strategy of this.strategies.values()) {
      if (strategy.isEnabled()) {
        strategy.update();
      }
    }
  }

  protected onPerformanceModeChanged(enabled: boolean): void {
    // Enable/disable strategies based on performance mode
    for (const strategy of this.strategies.values()) {
      strategy.setEnabled(!enabled); // Disable some strategies in performance mode
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
  }

  private initializeStrategies(): void {
    if (this.config.enableObjectPooling) {
      this.strategies.set('objectPooling', new ObjectPoolingStrategy());
    }

    if (this.config.enableFrustumCulling) {
      this.strategies.set('frustumCulling', new FrustumCullingStrategy());
    }

    if (this.config.enableLOD) {
      this.strategies.set(
        'lod',
        new LODStrategy({
          qualityLevel: this.getQualityLevelValue(this.config.qualityLevel),
        })
      );
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
    this.metrics.drawCalls = this.renderer.info.render.calls;
    this.metrics.triangles = this.renderer.info.render.triangles;
    this.metrics.objectCount = this.scene.children.length;
    this.metrics.textureCount = this.renderer.info.memory.textures;
    this.metrics.shaderCount = this.renderer.info.programs?.length || 0;

    if ((performance as any).memory) {
      this.metrics.memoryUsage =
        (performance as any).memory.usedJSHeapSize / 1048576;
    }

    this.lastFrameTime = currentTime;
  }

  private checkPerformanceThresholds(): void {
    const avgFPS =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const avgFrameTime =
      this.frameTimeHistory.reduce((a, b) => a + b, 0) /
      this.frameTimeHistory.length;

    // Check if performance is below target
    if (
      avgFPS < this.config.maxFPS * 0.8 ||
      avgFrameTime > this.config.targetFrameTime * 1.2
    ) {
      this.throttling = true;
      this.metrics.isThrottling = true;

      if (this.config.adaptiveQuality) {
        this.reduceQuality();
      }
    } else {
      this.throttling = false;
      this.metrics.isThrottling = false;
    }

    // Check memory usage
    if (this.metrics.memoryUsage > 500) {
      // 500MB threshold
      const memoryStrategy = this.strategies.get('memoryManagement');
      if (memoryStrategy instanceof MemoryManagementStrategy) {
        // Trigger garbage collection
      }
    }
  }

  private adaptQuality(): void {
    const avgFPS =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    if (avgFPS < this.config.maxFPS * 0.7) {
      this.reduceQuality();
    } else if (
      avgFPS > this.config.maxFPS * 0.95 &&
      this.metrics.qualityLevel < 3
    ) {
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
      0: {
        shadows: false,
        lodDistance: 0.5,
        maxRoughness: 1,
        maxMetalness: 0.5,
      },
      1: {
        shadows: true,
        lodDistance: 0.75,
        maxRoughness: 0.8,
        maxMetalness: 0.7,
      },
      2: {
        shadows: true,
        lodDistance: 1,
        maxRoughness: 0.5,
        maxMetalness: 0.9,
      },
      3: {
        shadows: true,
        lodDistance: 1.5,
        maxRoughness: 0.2,
        maxMetalness: 1.0,
      },
    };

    const settings =
      qualitySettings[
        this.metrics.qualityLevel as keyof typeof qualitySettings
      ] || qualitySettings[2];

    // Apply renderer settings
    if (this.renderer.shadowMap) {
      this.renderer.shadowMap.enabled = settings.shadows;
    }

    // Update LOD distances
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

      if (this.config.adaptiveQuality) {
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

  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    Object.assign(this.config, newConfig);

    if (newConfig.qualityLevel) {
      this.setQualityLevel(newConfig.qualityLevel);
    }
  }

  public isThrottling(): boolean {
    return this.throttling;
  }
}

// Export factory function
export function createOptimizedPerformanceSystem(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  config?: PerformanceConfig
): OptimizedPerformanceSystem {
  return new OptimizedPerformanceSystem(scene, camera, renderer, config);
}
