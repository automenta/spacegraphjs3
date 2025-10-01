import * as THREE from 'three';
import { ObjectPool } from './ObjectPool';
import { CullingManager } from './CullingManager';
import { LODManager, LODSettings } from './LODManager';
import { MemoryManager } from './MemoryManager';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';

/**
 * Performance optimization configuration
 */
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
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  objectCount: number;
  textureCount: number;
  shaderCount: number;
}

/**
 * Comprehensive performance optimization system
 */
export class PerformanceOptimizer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  
  private objectPools: Map<string, ObjectPool<any>> = new Map();
  private cullingManager: CullingManager;
  private lodManager: LODManager;
  private memoryManager: MemoryManager;
  
  private config: Required<PerformanceConfig>;
  private metrics: PerformanceMetrics;
  
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  
  private optimizationEnabled = true;
  private qualityLevel: number;
  
  private logger: Logger;
  private errorHandler: ErrorHandler;
  
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    config: PerformanceConfig = {}
  ) {
    this.errorHandler = ErrorHandler.getInstance();
    this.logger = Logger.getInstance();
    
    // Validate inputs
    this.validateRequiredParameter(scene, 'Scene');
    this.validateRequiredParameter(camera, 'Camera');
    this.validateRequiredParameter(renderer, 'Renderer');
    
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
      ...config
    };
    
    this.qualityLevel = this.getQualityLevelValue(this.config.qualityLevel);
    
    this.cullingManager = new CullingManager();
    this.lodManager = new LODManager();
    this.memoryManager = MemoryManager.getInstance();
    
    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      objectCount: 0,
      textureCount: 0,
      shaderCount: 0
    };
    
    try {
      this.initializeOptimizations();
      this.startPerformanceMonitoring();
    } catch (error) {
      this.errorHandler.handleError('PerformanceOptimizer', 'Failed to initialize optimizer', error);
      throw error;
    }
  }
  
  /**
   * Get quality level value
   */
  private getQualityLevelValue(level: string): number {
    const levels = { low: 0, medium: 1, high: 2, ultra: 3 };
    return levels[level as keyof typeof levels] || 2;
  }
  
  /**
   * Initialize optimization systems
   */
  private initializeOptimizations(): void {
    try {
      if (this.config.enableObjectPooling) {
        this.setupObjectPooling();
      }
      
      if (this.config.enableFrustumCulling) {
        this.setupFrustumCulling();
      }
      
      if (this.config.enableLOD) {
        this.setupLODSystem();
      }
      
      if (this.config.enableMemoryManagement) {
        this.setupMemoryManagement();
      }
      
      if (this.config.enableBatching) {
        this.setupBatching();
      }
      
      if (this.config.enableInstancing) {
        this.setupInstancing();
      }
    } catch (error) {
      this.errorHandler.handleError('PerformanceOptimizer', 'Failed to initialize optimizations', error);
      throw error;
    }
  }
  
  /**
   * Setup object pooling
   */
  private setupObjectPooling(): void {
    try {
      // Configure object pools for common object types
      this.objectPools.set('mesh', new ObjectPool(() => new THREE.Mesh(), undefined, 100));
      this.objectPools.set('group', new ObjectPool(() => new THREE.Group(), undefined, 50));
      this.objectPools.set('vector3', new ObjectPool(() => new THREE.Vector3(), undefined, 200));
      this.objectPools.set('color', new ObjectPool(() => new THREE.Color(), undefined, 100));
    } catch (error) {
      this.errorHandler.handleError('PerformanceOptimizer', 'Failed to setup object pooling', error);
      throw error;
    }
  }
  
  /**
   * Setup frustum culling
   */
  private setupFrustumCulling(): void {
    this.cullingManager.setCamera(this.camera);
    
    // Add culling components to objects
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        this.cullingManager.registerObject(object);
      }
    });
  }
  
  /**
   * Setup LOD system
   */
  private setupLODSystem(): void {
    this.lodManager.setCamera(this.camera);
    
    // Configure LOD levels based on quality settings
    const lodLevels = this.getLODLevels();
    
    // Register objects with LOD settings
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        const settings: LODSettings = {
          distances: lodLevels,
          detailLevels: [
            (obj) => obj, // Original detail
            (obj) => this.createSimplifiedVersion(obj, 0.5), // Medium detail
            (obj) => this.createSimplifiedVersion(obj, 0.25) // Low detail
          ]
        };
        this.lodManager.registerObject(object, settings);
      }
    });
  }
  
  /**
   * Get LOD levels based on quality
   */
  private getLODLevels(): number[] {
    const levels = {
      0: [100, 50, 10],    // Low quality
      1: [200, 100, 25],   // Medium quality
      2: [500, 200, 50],   // High quality
      3: [1000, 500, 100]  // Ultra quality
    };
    
    return levels[this.qualityLevel as keyof typeof levels] || levels[2];
  }
  
  /**
   * Create simplified version of object
   */
  private createSimplifiedVersion(object: THREE.Object3D, factor: number): THREE.Object3D {
    try {
      // Validate inputs
      if (!this.validateOptionalParameter(object, 'Object')) {
        return object;
      }
      
      factor = this.validateRangeParameter(factor, 0, 1, 0.5, 'simplification factor');
      
      const simplified = object.clone();
      
      // Apply simplification factor to geometry if it's a mesh
      if (simplified instanceof THREE.Mesh && simplified.geometry) {
        const geometry = simplified.geometry;
        const positionAttribute = geometry.attributes.position;
        
        if (positionAttribute) {
          const positions = positionAttribute.array as Float32Array;
          const simplifiedPositions = new Float32Array(Math.floor(positions.length * factor));
          
          // Simple decimation - take every nth vertex
          const step = Math.floor(1 / factor);
          for (let i = 0, j = 0; i < positions.length && j < simplifiedPositions.length; i += step * 3, j += 3) {
            simplifiedPositions[j] = positions[i];
            simplifiedPositions[j + 1] = positions[i + 1];
            simplifiedPositions[j + 2] = positions[i + 2];
          }
          
          geometry.setAttribute('position', new THREE.BufferAttribute(simplifiedPositions, 3));
          geometry.computeVertexNormals();
        }
      }
      
      return simplified;
    } catch (error) {
      this.errorHandler.handleError('PerformanceOptimizer', 'Failed to create simplified version', error);
      return object;
    }
  }
  
  /**
   * Setup memory management
   */
  private setupMemoryManagement(): void {
    // Track objects for memory management
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Material || object instanceof THREE.Texture) {
        this.memoryManager.trackObject(object);
      }
    });
  }
  
  /**
   * Setup batching
   */
  private setupBatching(): void {
    const batchGroups = new Map<string, THREE.Mesh[]>();
    
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
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
        this.createBatchedMesh(meshes, key);
      }
    });
  }
  
  /**
   * Create batched mesh
   */
  private createBatchedMesh(meshes: THREE.Mesh[], _key: string): void {
    if (meshes.length === 0) return;
    
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    
    meshes.forEach(mesh => {
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
    batchedMesh.userData.originalMeshes = meshes.map(m => m.uuid);
    
    // Replace original meshes
    const parent = meshes[0].parent || this.scene;
    parent.add(batchedMesh);
    
    meshes.forEach(mesh => {
      mesh.visible = false;
      mesh.userData.batchedBy = batchedMesh.uuid;
    });
  }
  
  /**
   * Merge geometries
   */
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
      
      geometries.forEach(geometry => {
        const pos = geometry.attributes.position?.array;
        const norm = geometry.attributes.normal?.array;
        const uv = geometry.attributes.uv?.array;
        const index = geometry.index?.array;
        
        if (pos) positions.push(...Array.from(pos));
        if (norm) normals.push(...Array.from(norm));
        if (uv) uvs.push(...Array.from(uv));
        
        if (index) {
          indices.push(...Array.from(index).map(i => i + vertexOffset));
        } else {
          // Generate indices if none exist
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
      this.errorHandler.handleWarning('PerformanceOptimizer', 'Failed to merge geometries', error);
      return null;
    }
  }
  
  /**
   * Setup instancing
   */
  private setupInstancing(): void {
    // Find objects suitable for instancing
    const instanceGroups = new Map<string, THREE.Mesh[]>();
    
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh && object.geometry && object.material) {
        const geometry = object.geometry;
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
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
        this.createInstancedMesh(meshes, key);
      }
    });
  }
  
  /**
   * Create instanced mesh
   */
  private createInstancedMesh(meshes: THREE.Mesh[], _key: string): void {
    if (meshes.length === 0) return;
    
    const templateMesh = meshes[0];
    const geometry = templateMesh.geometry;
    const material = Array.isArray(templateMesh.material) ? templateMesh.material[0] : templateMesh.material;
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, meshes.length);
    instancedMesh.userData.isInstanced = true;
    instancedMesh.userData.originalMeshes = meshes.map(m => m.uuid);
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    meshes.forEach((mesh, index) => {
      // Set instance matrix
      matrix.compose(mesh.position, mesh.quaternion, mesh.scale);
      instancedMesh.setMatrixAt(index, matrix);
      
      // Set instance color if material supports it
      if (material instanceof THREE.MeshBasicMaterial && mesh.material instanceof THREE.MeshBasicMaterial) {
        color.copy(mesh.material.color);
        instancedMesh.setColorAt(index, color);
      }
      
      // Hide original mesh
      mesh.visible = false;
      mesh.userData.instancedBy = instancedMesh.uuid;
    });
    
    // Add to scene
    const parent = meshes[0].parent || this.scene;
    parent.add(instancedMesh);
  }
  
  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    const monitorLoop = () => {
      if (!this.optimizationEnabled) return;
      
      this.updateMetrics();
      this.checkPerformanceThresholds();
      
      if (this.config.adaptiveQuality) {
        this.adaptQuality();
      }
      
      setTimeout(monitorLoop, 1000); // Check every second
    };
    
    monitorLoop();
  }
  
  /**
   * Update performance metrics
   */
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
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576;
    }
    
    this.lastFrameTime = currentTime;
  }
  
  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(): void {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    
    // Check if performance is below target
    if (avgFPS < this.config.maxFPS * 0.8 || avgFrameTime > this.config.targetFrameTime * 1.2) {
      this.logger.warn('PerformanceOptimizer', `Performance below target: ${avgFPS.toFixed(1)} FPS, ${avgFrameTime.toFixed(1)}ms frame time`);
      
      if (this.config.adaptiveQuality) {
        this.reduceQuality();
      }
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > 500) { // 500MB threshold
      this.logger.warn('PerformanceOptimizer', `High memory usage: ${this.metrics.memoryUsage.toFixed(1)}MB`);
      this.memoryManager.disposeAllTrackedObjects();
    }
  }
  
  /**
   * Adapt quality based on performance
   */
  private adaptQuality(): void {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    
    if (avgFPS < this.config.maxFPS * 0.7) {
      this.reduceQuality();
    } else if (avgFPS > this.config.maxFPS * 0.95 && this.qualityLevel < 3) {
      this.increaseQuality();
    }
  }
  
  /**
   * Reduce quality level
   */
  private reduceQuality(): void {
    if (this.qualityLevel > 0) {
      this.qualityLevel--;
      this.applyQualitySettings();
      this.logger.info('PerformanceOptimizer', `Reduced quality to level ${this.qualityLevel}`);
    }
  }
  
  /**
   * Increase quality level
   */
  private increaseQuality(): void {
    if (this.qualityLevel < 3) {
      this.qualityLevel++;
      this.applyQualitySettings();
      this.logger.info('PerformanceOptimizer', `Increased quality to level ${this.qualityLevel}`);
    }
  }
  
  /**
   * Apply quality settings
   */
  private applyQualitySettings(): void {
    const settings = this.getQualitySettings();
    
    // Apply renderer settings
    if (this.renderer.shadowMap) {
      this.renderer.shadowMap.enabled = settings.shadows;
    }
    
    // Update material quality
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.roughness = Math.min(material.roughness, settings.maxRoughness);
            material.metalness = Math.min(material.metalness, settings.maxMetalness);
          }
        });
      }
    });
  }
  
  /**
   * Get quality settings for current level
   */
  private getQualitySettings() {
    const qualitySettings = {
      0: { shadows: false, lodLevels: [50, 25, 5], maxRoughness: 1, maxMetalness: 0.5 },
      1: { shadows: true, lodLevels: [100, 50, 15], maxRoughness: 0.8, maxMetalness: 0.7 },
      2: { shadows: true, lodLevels: [200, 100, 30], maxRoughness: 0.5, maxMetalness: 0.9 },
      3: { shadows: true, lodLevels: [500, 200, 60], maxRoughness: 0.2, maxMetalness: 1.0 }
    };
    
    return qualitySettings[this.qualityLevel as keyof typeof qualitySettings] || qualitySettings[2];
  }
  
  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Enable/disable optimizations
   */
  public setOptimizationEnabled(enabled: boolean): void {
    this.optimizationEnabled = enabled;
  }
  
  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    // Validate input
    if (!this.validateOptionalParameter(newConfig, 'Config')) {
      return;
    }
    
    Object.assign(this.config, newConfig);
    
    try {
      // Reinitialize affected systems
      if (newConfig.qualityLevel) {
        this.qualityLevel = this.getQualityLevelValue(newConfig.qualityLevel);
        this.applyQualitySettings();
      }
    } catch (error) {
      this.errorHandler.handleError('PerformanceOptimizer', 'Failed to update config', error);
    }
  }
  
  /**
   * Dispose of optimizer
   */
  public dispose(): void {
    this.optimizationEnabled = false;
    
    this.objectPools.forEach(pool => pool.clear());
    this.objectPools.clear();
    
    this.cullingManager.clear();
    this.lodManager.clear();
  }
  
  /**
   * Validate required parameter
   */
  private validateRequiredParameter(param: any, paramName: string): void {
    if (!param) {
      const error = new Error(`${paramName} is required for PerformanceOptimizer`);
      this.errorHandler.handleError('PerformanceOptimizer', `Validation failed for ${paramName}`, error);
      throw error;
    }
  }
  
  /**
   * Validate optional parameter
   */
  private validateOptionalParameter(param: any, paramName: string): boolean {
    if (!param) {
      this.errorHandler.handleWarning('PerformanceOptimizer', `Cannot process with null ${paramName.toLowerCase()}`);
      return false;
    }
    return true;
  }
  
  /**
   * Validate parameter within range
   */
  private validateRangeParameter(value: number, min: number, max: number, defaultValue: number, paramName: string): number {
    if (value <= min || value > max) {
      this.errorHandler.handleWarning('PerformanceOptimizer', `Invalid ${paramName}, using default value`, { value, min, max, defaultValue });
      return defaultValue;
    }
    return value;
  }
}