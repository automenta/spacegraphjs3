# SpaceGraphJS3 Performance Optimization Specification

## Overview

This document specifies the implementation of advanced performance optimizations for SpaceGraphJS3, including object
pooling systems, level-of-detail (LOD) management, advanced culling mechanisms, and memory optimization strategies.
These enhancements will enable the library to handle significantly larger graphs while maintaining smooth 60fps
performance.

## Current Performance Analysis

### ✅ Existing Performance Features

- **Automatic Instancing**: Switches to InstancedRenderer when node count exceeds threshold
- **BVH Acceleration**: Uses three-mesh-bvh for GPU-accelerated raycasting
- **Reactive Data Plane**: Efficient SolidJS-based state management
- **Efficient Rendering**: Optimized render loops and state updates
- **Comprehensive Benchmarking**: Built-in performance measurement tools

### 🔧 Performance Bottlenecks Identified

- Object creation/destruction causing garbage collection pressure
- No level-of-detail system for distant objects
- Limited culling beyond basic frustum culling
- No object pooling for frequently created/destroyed objects
- Memory usage grows with extended sessions
- No shader-based rendering pipeline for maximum performance

## Performance Optimization Architecture

### Core Optimization Strategies

#### 1. Object Pooling System

**New File**: `src/utils/ObjectPool.ts`

**Purpose**: Reduce garbage collection pressure by reusing objects instead of creating/destroying them.

**Key Components**:

- Generic object pool for Three.js objects
- Specialized pools for common object types
- Automatic pool management and cleanup
- Configurable pool sizes and growth strategies

#### 2. Level-of-Detail (LOD) System

**New File**: `src/utils/LODManager.ts`

**Purpose**: Automatically reduce geometric complexity of distant objects while maintaining visual quality.

**Key Components**:

- Distance-based LOD switching
- Multiple LOD levels per object type
- Smooth transitions between LOD levels
- Configurable distance thresholds

#### 3. Advanced Culling System

**New File**: `src/utils/CullingManager.ts`

**Purpose**: Eliminate rendering of objects that are not visible to the camera.

**Key Components**:

- Frustum culling for off-screen objects
- Occlusion culling for hidden objects
- Distance-based culling for far objects
- Hierarchical culling for large scenes

#### 4. Memory Management System

**New File**: `src/utils/MemoryManager.ts`

**Purpose**: Monitor and optimize memory usage across the application lifecycle.

**Key Components**:

- Memory usage tracking and reporting
- Automatic cleanup of unused resources
- Memory leak detection and prevention
- Resource usage optimization

## Detailed Implementation

### Phase 1: Object Pooling System

#### 1.1 Generic Object Pool

```typescript
// src/utils/ObjectPool.ts
export interface PoolConfig {
  initialSize: number;
  maxSize: number;
  growthStrategy: 'fixed' | 'exponential' | 'adaptive';
  growthFactor: number;
  cleanupInterval: number;
  maxIdleTime: number;
}

export interface PooledObject<T = any> {
  object: T;
  inUse: boolean;
  lastUsed: number;
  useCount: number;
}

export class ObjectPool<T> {
  private pool: PooledObject<T>[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private disposeFn: (obj: T) => void;
  private config: Required<PoolConfig>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    disposeFn: (obj: T) => void,
    config: PoolConfig
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.disposeFn = disposeFn;
    this.config = {
      initialSize: config.initialSize,
      maxSize: config.maxSize,
      growthStrategy: config.growthStrategy ?? 'fixed',
      growthFactor: config.growthFactor ?? 2,
      cleanupInterval: config.cleanupInterval ?? 30000,
      maxIdleTime: config.maxIdleTime ?? 60000
    };

    this.initializePool();
    this.startCleanupTimer();
  }

  /**
   * Initialize the pool with initial objects
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const obj = this.createFn();
      this.pool.push({
        object: obj,
        inUse: false,
        lastUsed: Date.now(),
        useCount: 0
      });
    }
  }

  /**
   * Acquire an object from the pool
   */
  public acquire(): T {
    // Find available object
    let pooledObj = this.pool.find(obj => !obj.inUse);
    
    if (!pooledObj) {
      // No available objects, try to grow pool
      if (this.canGrow()) {
        this.growPool();
        pooledObj = this.pool.find(obj => !obj.inUse);
      } else {
        // Pool at maximum size, wait for available object
        pooledObj = this.waitForAvailableObject();
      }
    }

    if (!pooledObj) {
      throw new Error('Unable to acquire object from pool');
    }

    pooledObj.inUse = true;
    pooledObj.lastUsed = Date.now();
    pooledObj.useCount++;

    // Reset object state
    this.resetFn(pooledObj.object);

    return pooledObj.object;
  }

  /**
   * Release an object back to the pool
   */
  public release(obj: T): void {
    const pooledObj = this.pool.find(p => p.object === obj);
    if (!pooledObj) {
      console.warn('Attempting to release object not from this pool');
      return;
    }

    if (!pooledObj.inUse) {
      console.warn('Attempting to release object that is not in use');
      return;
    }

    pooledObj.inUse = false;
    pooledObj.lastUsed = Date.now();

    // Reset object state
    this.resetFn(pooledObj.object);
  }

  /**
   * Check if pool can grow
   */
  private canGrow(): boolean {
    return this.pool.length < this.config.maxSize;
  }

  /**
   * Grow the pool based on growth strategy
   */
  private growPool(): void {
    const currentSize = this.pool.length;
    let newSize: number;

    switch (this.config.growthStrategy) {
      case 'exponential':
        newSize = Math.min(currentSize * this.config.growthFactor, this.config.maxSize);
        break;
      case 'adaptive':
        // Adapt growth based on usage patterns
        const avgUseCount = this.pool.reduce((sum, obj) => sum + obj.useCount, 0) / currentSize;
        newSize = Math.min(
          currentSize + Math.ceil(avgUseCount * this.config.growthFactor),
          this.config.maxSize
        );
        break;
      case 'fixed':
      default:
        newSize = Math.min(currentSize + this.config.growthFactor, this.config.maxSize);
        break;
    }

    const objectsToAdd = newSize - currentSize;
    for (let i = 0; i < objectsToAdd; i++) {
      const obj = this.createFn();
      this.pool.push({
        object: obj,
        inUse: false,
        lastUsed: Date.now(),
        useCount: 0
      });
    }
  }

  /**
   * Wait for an available object (with timeout)
   */
  private waitForAvailableObject(): PooledObject<T> | null {
    const timeout = 5000; // 5 second timeout
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const obj = this.pool.find(p => !p.inUse);
      if (obj) return obj;
      
      // Small delay to avoid busy waiting
      const start = Date.now();
      while (Date.now() - start < 10) { /* busy wait */ }
    }

    return null;
  }

  /**
   * Start cleanup timer to remove idle objects
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleObjects();
    }, this.config.cleanupInterval);
  }

  /**
   * Remove objects that have been idle for too long
   */
  private cleanupIdleObjects(): void {
    const now = Date.now();
    const objectsToRemove: PooledObject<T>[] = [];

    for (const pooledObj of this.pool) {
      if (!pooledObj.inUse && (now - pooledObj.lastUsed) > this.config.maxIdleTime) {
        objectsToRemove.push(pooledObj);
      }
    }

    // Remove idle objects (but keep minimum pool size)
    const minSize = Math.max(this.config.initialSize, 10);
    for (const pooledObj of objectsToRemove) {
      if (this.pool.length > minSize) {
        const index = this.pool.indexOf(pooledObj);
        if (index > -1) {
          this.pool.splice(index, 1);
          this.disposeFn(pooledObj.object);
        }
      }
    }
  }

  /**
   * Get pool statistics
   */
  public getStats(): {
    totalObjects: number;
    inUseObjects: number;
    availableObjects: number;
    averageUseCount: number;
    poolUtilization: number;
  } {
    const totalObjects = this.pool.length;
    const inUseObjects = this.pool.filter(obj => obj.inUse).length;
    const availableObjects = totalObjects - inUseObjects;
    const averageUseCount = this.pool.reduce((sum, obj) => sum + obj.useCount, 0) / totalObjects;
    const poolUtilization = inUseObjects / totalObjects;

    return {
      totalObjects,
      inUseObjects,
      availableObjects,
      averageUseCount,
      poolUtilization
    };
  }

  /**
   * Dispose of the pool and all objects
   */
  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    for (const pooledObj of this.pool) {
      this.disposeFn(pooledObj.object);
    }

    this.pool = [];
  }
}
```

#### 1.2 Specialized Object Pools

```typescript
// src/utils/ThreeObjectPools.ts
import * as THREE from 'three';
import { ObjectPool } from './ObjectPool';

/**
 * Pool for Three.js Vector3 objects
 */
export class Vector3Pool extends ObjectPool<THREE.Vector3> {
  constructor(config: Partial<PoolConfig> = {}) {
    super(
      () => new THREE.Vector3(),
      (vec) => vec.set(0, 0, 0),
      (vec) => { /* Vector3 doesn't need disposal */ },
      {
        initialSize: 100,
        maxSize: 1000,
        growthStrategy: 'fixed',
        growthFactor: 50,
        ...config
      }
    );
  }
}

/**
 * Pool for Three.js Matrix4 objects
 */
export class Matrix4Pool extends ObjectPool<THREE.Matrix4> {
  constructor(config: Partial<PoolConfig> = {}) {
    super(
      () => new THREE.Matrix4(),
      (mat) => mat.identity(),
      (mat) => { /* Matrix4 doesn't need disposal */ },
      {
        initialSize: 50,
        maxSize: 500,
        growthStrategy: 'fixed',
        growthFactor: 25,
        ...config
      }
    );
  }
}

/**
 * Pool for Three.js BoxGeometry objects
 */
export class BoxGeometryPool extends ObjectPool<THREE.BoxGeometry> {
  private width: number;
  private height: number;
  private depth: number;

  constructor(width = 1, height = 1, depth = 1, config: Partial<PoolConfig> = {}) {
    super(
      () => new THREE.BoxGeometry(width, height, depth),
      (geom) => {
        // Reset geometry if needed
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
      },
      (geom) => geom.dispose(),
      {
        initialSize: 20,
        maxSize: 200,
        growthStrategy: 'adaptive',
        growthFactor: 2,
        ...config
      }
    );

    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}

/**
 * Pool for Three.js SphereGeometry objects
 */
export class SphereGeometryPool extends ObjectPool<THREE.SphereGeometry> {
  private radius: number;
  private widthSegments: number;
  private heightSegments: number;

  constructor(radius = 1, widthSegments = 32, heightSegments = 32, config: Partial<PoolConfig> = {}) {
    super(
      () => new THREE.SphereGeometry(radius, widthSegments, heightSegments),
      (geom) => {
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
      },
      (geom) => geom.dispose(),
      {
        initialSize: 50,
        maxSize: 500,
        growthStrategy: 'adaptive',
        growthFactor: 2,
        ...config
      }
    );

    this.radius = radius;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;
  }
}

/**
 * Pool for Three.js MeshBasicMaterial objects
 */
export class MaterialPool extends ObjectPool<THREE.MeshBasicMaterial> {
  private defaultColor: THREE.Color;

  constructor(defaultColor = new THREE.Color(0xffffff), config: Partial<PoolConfig> = {}) {
    super(
      () => new THREE.MeshBasicMaterial({ color: defaultColor }),
      (mat) => {
        mat.color.copy(defaultColor);
        mat.opacity = 1;
        mat.transparent = false;
      },
      (mat) => mat.dispose(),
      {
        initialSize: 100,
        maxSize: 1000,
        growthStrategy: 'adaptive',
        growthFactor: 2,
        ...config
      }
    );

    this.defaultColor = defaultColor.clone();
  }
}

/**
 * Global pool manager for all Three.js object pools
 */
export class ThreeObjectPoolManager {
  private pools: Map<string, ObjectPool<any>> = new Map();
  private static instance: ThreeObjectPoolManager;

  private constructor() {
    this.initializeDefaultPools();
  }

  public static getInstance(): ThreeObjectPoolManager {
    if (!ThreeObjectPoolManager.instance) {
      ThreeObjectPoolManager.instance = new ThreeObjectPoolManager();
    }
    return ThreeObjectPoolManager.instance;
  }

  private initializeDefaultPools(): void {
    // Vector3 pool
    this.pools.set('vector3', new Vector3Pool());

    // Matrix4 pool
    this.pools.set('matrix4', new Matrix4Pool());

    // Geometry pools
    this.pools.set('boxGeometry', new BoxGeometryPool());
    this.pools.set('sphereGeometry', new SphereGeometryPool());

    // Material pool
    this.pools.set('material', new MaterialPool());
  }

  public getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  public registerPool<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool);
  }

  /**
   * Get pooled Vector3
   */
  public getVector3(): THREE.Vector3 {
    const pool = this.pools.get('vector3') as Vector3Pool;
    return pool.acquire();
  }

  /**
   * Release pooled Vector3
   */
  public releaseVector3(vec: THREE.Vector3): void {
    const pool = this.pools.get('vector3') as Vector3Pool;
    pool.release(vec);
  }

  /**
   * Get pooled BoxGeometry
   */
  public getBoxGeometry(width = 1, height = 1, depth = 1): THREE.BoxGeometry {
    const poolName = `boxGeometry_${width}_${height}_${depth}`;
    let pool = this.pools.get(poolName) as BoxGeometryPool;
    
    if (!pool) {
      pool = new BoxGeometryPool(width, height, depth);
      this.pools.set(poolName, pool);
    }
    
    return pool.acquire();
  }

  /**
   * Release pooled BoxGeometry
   */
  public releaseBoxGeometry(geom: THREE.BoxGeometry, width = 1, height = 1, depth = 1): void {
    const poolName = `boxGeometry_${width}_${height}_${depth}`;
    const pool = this.pools.get(poolName) as BoxGeometryPool;
    
    if (pool) {
      pool.release(geom);
    }
  }

  /**
   * Get all pool statistics
   */
  public getAllStats(): Record<string, ReturnType<ObjectPool<any>['getStats']>> {
    const stats: Record<string, ReturnType<ObjectPool<any>['getStats']>> = {};
    
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    
    return stats;
  }

  /**
   * Dispose of all pools
   */
  public dispose(): void {
    for (const pool of this.pools.values()) {
      pool.dispose();
    }
    this.pools.clear();
  }
}
```

### Phase 2: Level-of-Detail (LOD) System

#### 2.1 LOD Manager

```typescript
// src/utils/LODManager.ts
import * as THREE from 'three';
import { SpaceGraph } from '../core/SpaceGraph';

export interface LODLevel {
  distance: number; // Distance threshold for this LOD level
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  complexity: number; // Complexity score (lower = simpler)
}

export interface LODConfig {
  levels: LODLevel[];
  transitionSmoothing: boolean;
  smoothingDistance: number;
  updateInterval: number;
}

export class LODManager {
  private graph: SpaceGraph;
  private config: LODConfig;
  private lodObjects: Map<string, {
    currentLevel: number;
    targetLevel: number;
    transitionProgress: number;
    mesh: THREE.Mesh;
    levels: LODLevel[];
  }> = new Map();
  private updateTimer?: NodeJS.Timeout;

  constructor(graph: SpaceGraph, config: LODConfig) {
    this.graph = graph;
    this.config = config;
    this.startUpdateTimer();
  }

  /**
   * Register an object for LOD management
   */
  public registerObject(id: string, mesh: THREE.Mesh, levels: LODLevel[]): void {
    // Sort levels by distance
    const sortedLevels = [...levels].sort((a, b) => a.distance - b.distance);
    
    this.lodObjects.set(id, {
      currentLevel: 0,
      targetLevel: 0,
      transitionProgress: 1,
      mesh,
      levels: sortedLevels
    });

    // Set initial LOD level
    this.updateObjectLOD(id);
  }

  /**
   * Unregister an object from LOD management
   */
  public unregisterObject(id: string): void {
    const lodData = this.lodObjects.get(id);
    if (lodData) {
      // Clean up LOD levels
      for (const level of lodData.levels) {
        if (level.geometry !== lodData.mesh.geometry) {
          level.geometry.dispose();
        }
        if (level.material !== lodData.mesh.material) {
          level.material.dispose();
        }
      }
    }
    
    this.lodObjects.delete(id);
  }

  /**
   * Update LOD for all registered objects
   */
  private updateAllObjectsLOD(): void {
    const cameraPosition = this.getCameraPosition();
    
    for (const [id] of this.lodObjects) {
      this.updateObjectLOD(id, cameraPosition);
    }
  }

  /**
   * Update LOD for a specific object
   */
  private updateObjectLOD(id: string, cameraPosition?: THREE.Vector3): void {
    const lodData = this.lodObjects.get(id);
    if (!lodData) return;

    cameraPosition = cameraPosition || this.getCameraPosition();
    const objectPosition = lodData.mesh.position;
    const distance = cameraPosition.distanceTo(objectPosition);

    // Determine appropriate LOD level based on distance
    let targetLevel = lodData.levels.length - 1; // Default to lowest detail
    
    for (let i = 0; i < lodData.levels.length; i++) {
      if (distance <= lodData.levels[i].distance) {
        targetLevel = i;
        break;
      }
    }

    // Update target level
    if (lodData.targetLevel !== targetLevel) {
      lodData.targetLevel = targetLevel;
      lodData.transitionProgress = 0;
    }

    // Handle smooth transitions
    if (this.config.transitionSmoothing && lodData.currentLevel !== lodData.targetLevel) {
      this.handleLODTransition(id);
    } else if (lodData.currentLevel !== lodData.targetLevel) {
      // Instant transition
      this.applyLODLevel(id, lodData.targetLevel);
    }
  }

  /**
   * Handle smooth transition between LOD levels
   */
  private handleLODTransition(id: string): void {
    const lodData = this.lodObjects.get(id);
    if (!lodData) return;

    // Update transition progress
    lodData.transitionProgress += 0.1; // Adjust for desired transition speed
    
    if (lodData.transitionProgress >= 1) {
      // Transition complete
      lodData.transitionProgress = 1;
      lodData.currentLevel = lodData.targetLevel;
      this.applyLODLevel(id, lodData.targetLevel);
    } else {
      // Apply intermediate transition
      this.applyLODTransition(id, lodData.transitionProgress);
    }
  }

  /**
   * Apply a specific LOD level to an object
   */
  private applyLODLevel(id: string, levelIndex: number): void {
    const lodData = this.lodObjects.get(id);
    if (!lodData) return;

    const level = lodData.levels[levelIndex];
    if (!level) return;

    // Update mesh geometry and material
    lodData.mesh.geometry = level.geometry;
    lodData.mesh.material = level.material;
    
    lodData.currentLevel = levelIndex;
  }

  /**
   * Apply smooth transition between LOD levels
   */
  private applyLODTransition(id: string, progress: number): void {
    const lodData = this.lodObjects.get(id);
    if (!lodData) return;

    const currentLevel = lodData.levels[lodData.currentLevel];
    const targetLevel = lodData.levels[lodData.targetLevel];
    
    if (!currentLevel || !targetLevel) return;

    // Create interpolated material properties
    if (currentLevel.material instanceof THREE.MeshBasicMaterial && 
        targetLevel.material instanceof THREE.MeshBasicMaterial) {
      
      const currentMaterial = currentLevel.material as THREE.MeshBasicMaterial;
      const targetMaterial = targetLevel.material as THREE.MeshBasicMaterial;
      
      // Interpolate opacity for smooth transition
      const interpolatedOpacity = currentMaterial.opacity * (1 - progress) + targetMaterial.opacity * progress;
      
      // Create temporary material for transition
      const transitionMaterial = currentMaterial.clone();
      transitionMaterial.opacity = interpolatedOpacity;
      transitionMaterial.transparent = interpolatedOpacity < 1;
      
      lodData.mesh.material = transitionMaterial;
    }
  }

  /**
   * Get current camera position
   */
  private getCameraPosition(): THREE.Vector3 {
    const cameraState = this.graph.state.camera;
    const direction = this.calculateCameraDirection(cameraState);
    const cameraPos = new THREE.Vector3(
      cameraState.target.x + direction.x * cameraState.distance,
      cameraState.target.y + direction.y * cameraState.distance,
      cameraState.target.z + direction.z * cameraState.distance
    );
    return cameraPos;
  }

  /**
   * Calculate camera direction from camera state
   */
  private calculateCameraDirection(cameraState: any): THREE.Vector3 {
    const phi = cameraState.phi * Math.PI / 180;
    const theta = cameraState.theta * Math.PI / 180;
    
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );
  }

  /**
   * Start update timer for LOD updates
   */
  private startUpdateTimer(): void {
    this.updateTimer = setInterval(() => {
      this.updateAllObjectsLOD();
    }, this.config.updateInterval);
  }

  /**
   * Create LOD levels for sphere geometry
   */
  public static createSphereLODs(radius: number): LODLevel[] {
    return [
      {
        distance: 0,
        geometry: new THREE.SphereGeometry(radius, 32, 32),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        complexity: 1.0
      },
      {
        distance: 50,
        geometry: new THREE.SphereGeometry(radius, 16, 16),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        complexity: 0.5
      },
      {
        distance: 100,
        geometry: new THREE.SphereGeometry(radius, 8, 8),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        complexity: 0.25
      },
      {
        distance: 200,
        geometry: new THREE.SphereGeometry(radius, 4, 4),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        complexity: 0.125
      }
    ];
  }

  /**
   * Create LOD levels for box geometry
   */
  public static createBoxLODs(width: number, height: number, depth: number): LODLevel[] {
    return [
      {
        distance: 0,
        geometry: new THREE.BoxGeometry(width, height, depth),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        complexity: 1.0
      },
      {
        distance: 75,
        geometry: new THREE.BoxGeometry(width, height, depth),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }),
        complexity: 0.8
      },
      {
        distance: 150,
        geometry: new THREE.BoxGeometry(width * 0.8, height * 0.8, depth * 0.8),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
        complexity: 0.5
      },
      {
        distance: 300,
        geometry: new THREE.BoxGeometry(width * 0.5, height * 0.5, depth * 0.5),
        material: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }),
        complexity: 0.25
      }
    ];
  }

  /**
   * Dispose of LOD manager and clean up resources
   */
  public dispose(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    for (const [id, lodData] of this.lodObjects) {
      // Dispose of LOD level resources
      for (const level of lodData.levels) {
        if (level.geometry !== lodData.mesh.geometry) {
          level.geometry.dispose();
        }
        if (level.material !== lodData.mesh.material) {
          level.material.dispose();
        }
      }
    }

    this.lodObjects.clear();
  }
}
```

#### 2.2 LOD Integration with Element Actors

```typescript
// Enhanced BaseElementActor with LOD support
export abstract class BaseElementActor {
  protected lodManager?: LODManager;
  protected lodId?: string;

  /**
   * Set LOD manager for this actor
   */
  public setLODManager(lodManager: LODManager, lodLevels: LODLevel[]): void {
    this.lodManager = lodManager;
    
    if (this.threeObject && this.lodId) {
      this.lodManager.registerObject(this.lodId, this.threeObject as THREE.Mesh, lodLevels);
    }
  }

  /**
   * Create LOD levels for this actor type
   */
  protected abstract createLODLayers(): LODLevel[];

  /**
   * Initialize LOD system for this actor
   */
  protected initializeLOD(): void {
    if (this.lodManager && this.threeObject) {
      this.lodId = `${this.elementState.id}_lod`;
      const lodLevels = this.createLODLayers();
      this.lodManager.registerObject(this.lodId, this.threeObject as THREE.Mesh, lodLevels);
    }
  }

  /**
   * Clean up LOD resources
   */
  protected cleanupLOD(): void {
    if (this.lodManager && this.lodId) {
      this.lodManager.unregisterObject(this.lodId);
      this.lodId = undefined;
    }
  }
}

// Enhanced SphereElementActor with LOD
export class SphereElementActor extends BaseElementActor {
  protected createLODLayers(): LODLevel[] {
    return LODManager.createSphereLODs(0.5); // Default sphere radius
  }

  public init(): void {
    // ... existing initialization
    this.initializeLOD();
  }

  public dispose(): void {
    this.cleanupLOD();
    // ... existing disposal
  }
}
```

### Phase 3: Advanced Culling System

#### 3.1 Culling Manager

```typescript
// src/utils/CullingManager.ts
import * as THREE from 'three';
import { SpaceGraph } from '../core/SpaceGraph';

export interface CullingConfig {
  frustumCulling: boolean;
  occlusionCulling: boolean;
  distanceCulling: boolean;
  updateInterval: number;
  frustumFovMultiplier: number;
  occlusionThreshold: number;
  maxDistance: number;
}

export interface CullableObject {
  id: string;
  object: THREE.Object3D;
  boundingBox: THREE.Box3;
  boundingSphere: THREE.Sphere;
  layers: number;
  alwaysVisible?: boolean;
}

export class CullingManager {
  private graph: SpaceGraph;
  private config: CullingConfig;
  private objects: Map<string, CullableObject> = new Map();
  private visibleObjects: Set<string> = new Set();
  private frustum: THREE.Frustum;
  private cameraMatrix: THREE.Matrix4;
  private updateTimer?: NodeJS.Timeout;

  constructor(graph: SpaceGraph, config: CullingConfig) {
    this.graph = graph;
    this.config = config;
    this.frustum = new THREE.Frustum();
    this.cameraMatrix = new THREE.Matrix4();
  }

  /**
   * Register an object for culling
   */
  public registerObject(object: CullableObject): void {
    this.objects.set(object.id, object);
    this.updateObjectVisibility(object.id);
  }

  /**
   * Unregister an object from culling
   */
  public unregisterObject(id: string): void {
    this.objects.delete(id);
    this.visibleObjects.delete(id);
  }

  /**
   * Update visibility for all objects
   */
  private updateAllObjectsVisibility(): void {
    this.updateFrustum();
    
    for (const [id] of this.objects) {
      this.updateObjectVisibility(id);
    }
  }

  /**
   * Update visibility for a specific object
   */
  private updateObjectVisibility(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    const wasVisible = this.visibleObjects.has(id);
    const isVisible = this.isObjectVisible(object);

    if (wasVisible !== isVisible) {
      if (isVisible) {
        this.visibleObjects.add(id);
        object.object.visible = true;
      } else {
        this.visibleObjects.delete(id);
        object.object.visible = false;
      }
    }
  }

  /**
   * Check if an object is visible
   */
  private isObjectVisible(object: CullableObject): boolean {
    if (object.alwaysVisible) return true;

    let visible = true;

    // Frustum culling
    if (this.config.frustumCulling && visible) {
      visible = this.isInFrustum(object);
    }

    // Distance culling
    if (this.config.distanceCulling && visible) {
      visible = this.isWithinDistance(object);
    }

    // Occlusion culling (simplified implementation)
    if (this.config.occlusionCulling && visible) {
      visible = !this.isOccluded(object);
    }

    return visible;
  }

  /**
   * Check if object is within camera frustum
   */
  private isInFrustum(object: CullableObject): boolean {
    const sphere = object.boundingSphere;
    
    // Check sphere against frustum planes
    return this.frustum.intersectsSphere(sphere);
  }

  /**
   * Check if object is within maximum distance
   */
  private isWithinDistance(object: CullableObject): boolean {
    const cameraPosition = this.getCameraPosition();
    const distance = cameraPosition.distanceTo(object.boundingSphere.center);
    
    return distance <= this.config.maxDistance;
  }

  /**
   * Simple occlusion culling (can be enhanced with depth buffer)
   */
  private isOccluded(object: CullableObject): boolean {
    // Simplified occlusion test based on distance and size
    const cameraPosition = this.getCameraPosition();
    const distance = cameraPosition.distanceTo(object.boundingSphere.center);
    const apparentSize = object.boundingSphere.radius / distance;
    
    // Object is considered occluded if it's too small to be visible
    return apparentSize < this.config.occlusionThreshold;
  }

  /**
   * Update camera frustum for culling
   */
  private updateFrustum(): void {
    const camera = this.graph.camera;
    const projectionMatrix = camera.projectionMatrix;
    const viewMatrix = camera.matrixWorldInverse;
    
    this.cameraMatrix.multiplyMatrices(projectionMatrix, viewMatrix);
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Get current camera position
   */
  private getCameraPosition(): THREE.Vector3 {
    const cameraState = this.graph.state.camera;
    const direction = this.calculateCameraDirection(cameraState);
    
    return new THREE.Vector3(
      cameraState.target.x + direction.x * cameraState.distance,
      cameraState.target.y + direction.y * cameraState.distance,
      cameraState.target.z + direction.z * cameraState.distance
    );
  }

  /**
   * Calculate camera direction from camera state
   */
  private calculateCameraDirection(cameraState: any): THREE.Vector3 {
    const phi = cameraState.phi * Math.PI / 180;
    const theta = cameraState.theta * Math.PI / 180;
    
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );
  }

  /**
   * Start update timer for culling updates
   */
  private startUpdateTimer(): void {
    this.updateTimer = setInterval(() => {
      this.updateAllObjectsVisibility();
    }, this.config.updateInterval);
  }

  /**
   * Get culling statistics
   */
  public getStats(): {
    totalObjects: number;
    visibleObjects: number;
    culledObjects: number;
    cullingEfficiency: number;
  } {
    const totalObjects = this.objects.size;
    const visibleObjects = this.visibleObjects.size;
    const culledObjects = totalObjects - visibleObjects;
    const cullingEfficiency = totalObjects > 0 ? culledObjects / totalObjects : 0;

    return {
      totalObjects,
      visibleObjects,
      culledObjects,
      cullingEfficiency
    };
  }

  /**
   * Dispose of culling manager and clean up resources
   */
  public dispose(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    this.objects.clear();
    this.visibleObjects.clear();
  }
}
```

#### 3.2 Hierarchical Culling for Large Scenes

```typescript
// src/utils/HierarchicalCulling.ts
import * as THREE from 'three';
import { CullingManager, CullableObject } from './CullingManager';

export interface HierarchicalNode {
  id: string;
  boundingBox: THREE.Box3;
  boundingSphere: THREE.Sphere;
  objects: CullableObject[];
  children: HierarchicalNode[];
  parent?: HierarchicalNode;
  level: number;
}

export class HierarchicalCulling extends CullingManager {
  private hierarchy: HierarchicalNode;
  private maxDepth: number;
  private objectsPerNode: number;

  constructor(graph: SpaceGraph, config: CullingConfig, maxDepth = 4, objectsPerNode = 50) {
    super(graph, config);
    this.maxDepth = maxDepth;
    this.objectsPerNode = objectsPerNode;
    this.hierarchy = this.createHierarchy();
  }

  /**
   * Create spatial hierarchy for efficient culling
   */
  private createHierarchy(): HierarchicalNode {
    const root: HierarchicalNode = {
      id: 'root',
      boundingBox: new THREE.Box3(),
      boundingSphere: new THREE.Sphere(),
      objects: [],
      children: [],
      level: 0
    };

    // Build hierarchy from all registered objects
    const objects = Array.from(this.objects.values());
    this.buildHierarchyRecursive(root, objects, 0);

    return root;
  }

  /**
   * Recursively build spatial hierarchy
   */
  private buildHierarchyRecursive(node: HierarchicalNode, objects: CullableObject[], level: number): void {
    if (objects.length <= this.objectsPerNode || level >= this.maxDepth) {
      // Leaf node - add objects directly
      node.objects = objects;
      this.updateNodeBounds(node);
      return;
    }

    // Split space and create child nodes
    const subregions = this.splitSpace(node.boundingBox);
    
    for (const subregion of subregions) {
      const childNode: HierarchicalNode = {
        id: `${node.id}_child_${node.children.length}`,
        boundingBox: subregion,
        boundingSphere: new THREE.Sphere(),
        objects: [],
        children: [],
        parent: node,
        level: level + 1
      };

      // Find objects in this subregion
      const objectsInSubregion = objects.filter(obj => 
        subregion.intersectsBox(new THREE.Box3().setFromObject(obj.object))
      );

      if (objectsInSubregion.length > 0) {
        node.children.push(childNode);
        this.buildHierarchyRecursive(childNode, objectsInSubregion, level + 1);
      }
    }

    // Handle objects that don't fit neatly into subregions
    const assignedObjects = new Set(node.children.flatMap(child => child.objects));
    const remainingObjects = objects.filter(obj => !assignedObjects.has(obj));
    
    if (remainingObjects.length > 0) {
      node.objects = remainingObjects;
      this.updateNodeBounds(node);
    }
  }

  /**
   * Split bounding box into subregions
   */
  private splitSpace(box: THREE.Box3): THREE.Box3[] {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const subregions: THREE.Box3[] = [];

    // Split into 8 octants (3D) or 4 quadrants (2D)
    const dimensions = size.x > 0 && size.z > 0 ? 3 : 2; // Determine if 3D or 2D
    
    if (dimensions === 3) {
      // 3D octree subdivision
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          for (let z = 0; z < 2; z++) {
            const min = new THREE.Vector3(
              x === 0 ? box.min.x : center.x,
              y === 0 ? box.min.y : center.y,
              z === 0 ? box.min.z : center.z
            );
            const max = new THREE.Vector3(
              x === 0 ? center.x : box.max.x,
              y === 0 ? center.y : box.max.y,
              z === 0 ? center.z : box.max.z
            );
            subregions.push(new THREE.Box3(min, max));
          }
        }
      }
    } else {
      // 2D quadtree subdivision
      subregions.push(
        new THREE.Box3(
          new THREE.Vector3(box.min.x, box.min.y, box.min.z),
          new THREE.Vector3(center.x, center.y, box.max.z)
        ),
        new THREE.Box3(
          new THREE.Vector3(center.x, box.min.y, box.min.z),
          new THREE.Vector3(box.max.x, center.y, box.max.z)
        ),
        new THREE.Box3(
          new THREE.Vector3(box.min.x, center.y, box.min.z),
          new THREE.Vector3(center.x, box.max.y, box.max.z)
        ),
        new THREE.Box3(
          new THREE.Vector3(center.x, center.y, box.min.z),
          new THREE.Vector3(box.max.x, box.max.y, box.max.z)
        )
      );
    }

    return subregions;
  }

  /**
   * Update node bounds based on contained objects
   */
  private updateNodeBounds(node: HierarchicalNode): void {
    if (node.objects.length === 0 && node.children.length === 0) {
      node.boundingBox.makeEmpty();
      node.boundingSphere.makeEmpty();
      return;
    }

    node.boundingBox.makeEmpty();

    // Include direct objects
    for (const obj of node.objects) {
      node.boundingBox.expandByObject(obj.object);
    }

    // Include child nodes
    for (const child of node.children) {
      node.boundingBox.expandByBox(child.boundingBox);
    }

    // Update bounding sphere
    node.boundingBox.getBoundingSphere(node.boundingSphere);
  }

  /**
   * Override visibility update to use hierarchy
   */
  protected updateAllObjectsVisibility(): void {
    this.updateFrustum();
    
    // Test hierarchy from top down
    this.updateNodeVisibility(this.hierarchy);
  }

  /**
   * Update visibility for a hierarchical node
   */
  private updateNodeVisibility(node: HierarchicalNode): void {
    // Test if node bounding box is visible
    const nodeVisible = this.isNodeVisible(node);
    
    if (!nodeVisible) {
      // Node and all children are culled
      this.setNodeVisibility(node, false);
      return;
    }

    // Node is visible, check children
    if (node.children.length > 0) {
      for (const child of node.children) {
        this.updateNodeVisibility(child);
      }
    }

    // Check direct objects in this node
    for (const obj of node.objects) {
      this.updateObjectVisibility(obj.id);
    }
  }

  /**
   * Check if a hierarchical node is visible
   */
  private isNodeVisible(node: HierarchicalNode): boolean {
    if (node.boundingBox.isEmpty()) return false;

    // Test against frustum
    if (this.config.frustumCulling) {
      return this.frustum.intersectsBox(node.boundingBox);
    }

    return true;
  }

  /**
   * Set visibility for all objects in a node
   */
  private setNodeVisibility(node: HierarchicalNode, visible: boolean): void {
    // Set visibility for direct objects
    for (const obj of node.objects) {
      const wasVisible = this.visibleObjects.has(obj.id);
      if (wasVisible !== visible) {
        if (visible) {
          this.visibleObjects.add(obj.id);
          obj.object.visible = true;
        } else {
          this.visibleObjects.delete(obj.id);
          obj.object.visible = false;
        }
      }
    }

    // Recursively set visibility for children
    for (const child of node.children) {
      this.setNodeVisibility(child, visible);
    }
  }

  /**
   * Get hierarchical culling statistics
   */
  public getHierarchyStats(): {
    totalNodes: number;
    maxDepth: number;
    objectsPerNode: number;
    totalObjects: number;
    visibleObjects: number;
    cullingEfficiency: number;
  } {
    const stats = this.traverseHierarchy(this.hierarchy);
    
    return {
      ...stats,
      visibleObjects: this.visibleObjects.size,
      cullingEfficiency: stats.totalObjects > 0 ? 
        (stats.totalObjects - this.visibleObjects.size) / stats.totalObjects : 0
    };
  }

  /**
   * Traverse hierarchy and collect statistics
   */
  private traverseHierarchy(node: HierarchicalNode): {
    totalNodes: number;
    maxDepth: number;
    objectsPerNode: number;
    totalObjects: number;
  } {
    let totalNodes = 1;
    let maxDepth = node.level;
    let totalObjects = node.objects.length;

    for (const child of node.children) {
      const childStats = this.traverseHierarchy(child);
      totalNodes += childStats.totalNodes;
      maxDepth = Math.max(maxDepth, childStats.maxDepth);
      totalObjects += childStats.totalObjects;
    }

    const objectsPerNode = totalNodes > 0 ? totalObjects / totalNodes : 0;

    return {
      totalNodes,
      maxDepth,
      objectsPerNode,
      totalObjects
    };
  }
}
```

### Phase 4: Memory Management System

#### 4.1 Memory Manager

```typescript
// src/utils/MemoryManager.ts
export interface MemoryConfig {
  maxMemoryMB: number;
  warningThreshold: number;
  cleanupInterval: number;
  aggressiveCleanup: boolean;
}

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  textureMemory: number;
  geometryMemory: number;
  materialMemory: number;
  timestamp: number;
}

export class MemoryManager {
  private graph: SpaceGraph;
  private config: MemoryConfig;
  private stats: MemoryStats;
  private updateTimer?: NodeJS.Timeout;
  private textureMemory: number = 0;
  private geometryMemory: number = 0;
  private materialMemory: number = 0;

  constructor(graph: SpaceGraph, config: MemoryConfig) {
    this.graph = graph;
    this.config = config;
    this.stats = this.getInitialMemoryStats();
    this.startMonitoring();
  }

  /**
   * Get initial memory statistics
   */
  private getInitialMemoryStats(): MemoryStats {
    const memoryInfo = (performance as any).memory;
    
    return {
      usedJSHeapSize: memoryInfo?.usedJSHeapSize || 0,
      totalJSHeapSize: memoryInfo?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memoryInfo?.jsHeapSizeLimit || 0,
      textureMemory: 0,
      geometryMemory: 0,
      materialMemory: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    this.updateTimer = setInterval(() => {
      this.updateMemoryStats();
      this.checkMemoryThresholds();
    }, this.config.cleanupInterval);
  }

  /**
   * Update memory statistics
   */
  private updateMemoryStats(): void {
    const memoryInfo = (performance as any).memory;
    
    if (memoryInfo) {
      this.stats = {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        textureMemory: this.textureMemory,
        geometryMemory: this.geometryMemory,
        materialMemory: this.materialMemory,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check memory thresholds and trigger cleanup if necessary
   */
  private checkMemoryThresholds(): void {
    const usedMB = this.stats.usedJSHeapSize / (1024 * 1024);
    const maxMB = this.config.maxMemoryMB;
    const threshold = maxMB * this.config.warningThreshold;

    if (usedMB > maxMB) {
      // Critical memory usage - aggressive cleanup
      this.performAggressiveCleanup();
    } else if (usedMB > threshold) {
      // Warning threshold - standard cleanup
      this.performStandardCleanup();
    }
  }

  /**
   * Perform standard memory cleanup
   */
  private performStandardCleanup(): void {
    console.log('Performing standard memory cleanup...');
    
    // Clean up unused resources
    this.cleanupUnusedResources();
    
    // Trigger garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Perform aggressive memory cleanup
   */
  private performAggressiveCleanup(): void {
    console.warn('Performing aggressive memory cleanup...');
    
    // Clean up all unused resources
    this.cleanupUnusedResources();
    
    // Clear object pools
    this.clearObjectPools();
    
    // Dispose of distant LOD levels
    this.cleanupLODLevels();
    
    // Force garbage collection
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Clean up unused Three.js resources
   */
  private cleanupUnusedResources(): void {
    const scene = this.graph.scene;
    
    // Traverse scene and identify unused resources
    const unusedResources = this.identifyUnusedResources(scene);
    
    // Dispose of unused resources
    for (const resource of unusedResources) {
      this.disposeResource(resource);
    }
  }

  /**
   * Identify unused resources in the scene
   */
  private identifyUnusedResources(scene: THREE.Scene): any[] {
    const unusedResources: any[] = [];
    
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Check if geometry is used by other meshes
        const geometryUsed = this.isGeometryUsed(object.geometry, scene);
        if (!geometryUsed) {
          unusedResources.push({ type: 'geometry', resource: object.geometry });
        }
        
        // Check if material is used by other meshes
        const materialUsed = this.isMaterialUsed(object.material, scene);
        if (!materialUsed) {
          unusedResources.push({ type: 'material', resource: object.material });
        }
      }
    });
    
    return unusedResources;
  }

  /**
   * Check if geometry is used by other meshes
   */
  private isGeometryUsed(geometry: THREE.BufferGeometry, scene: THREE.Scene): boolean {
    let usageCount = 0;
    
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry === geometry) {
        usageCount++;
      }
    });
    
    return usageCount > 1; // More than current mesh
  }

  /**
   * Check if material is used by other meshes
   */
  private isMaterialUsed(material: THREE.Material | THREE.Material[], scene: THREE.Scene): boolean {
    const materials = Array.isArray(material) ? material : [material];
    const usageCounts = new Map<THREE.Material, number>();
    
    // Initialize usage counts
    for (const mat of materials) {
      usageCounts.set(mat, 0);
    }
    
    // Count usage
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
        for (const mat of meshMaterials) {
          if (usageCounts.has(mat)) {
            usageCounts.set(mat, usageCounts.get(mat)! + 1);
          }
        }
      }
    });
    
    // Check if any material is used by other meshes
    for (const count of usageCounts.values()) {
      if (count > 1) return true;
    }
    
    return false;
  }

  /**
   * Dispose of a resource
   */
  private disposeResource(resource: any): void {
    try {
      switch (resource.type) {
        case 'geometry':
          if (resource.resource.dispose) {
            resource.resource.dispose();
          }
          break;
        case 'material':
          if (resource.resource.dispose) {
            resource.resource.dispose();
          }
          break;
        case 'texture':
          if (resource.resource.dispose) {
            resource.resource.dispose();
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to dispose resource:', error);
    }
  }

  /**
   * Clear all object pools
   */
  private clearObjectPools(): void {
    const poolManager = ThreeObjectPoolManager.getInstance();
    poolManager.dispose();
    poolManager.initializeDefaultPools();
  }

  /**
   * Clean up distant LOD levels
   */
  private cleanupLODLevels(): void {
    // This would integrate with the LOD system to remove distant levels
    // Implementation depends on specific LOD system integration
  }

  /**
   * Get current memory statistics
   */
  public getMemoryStats(): MemoryStats {
    return { ...this.stats };
  }

  /**
   * Get memory usage as percentage
   */
  public getMemoryUsagePercentage(): number {
    if (this.stats.jsHeapSizeLimit === 0) return 0;
    return (this.stats.usedJSHeapSize / this.stats.jsHeapSizeLimit) * 100;
  }

  /**
   * Check if memory usage is critical
   */
  public isMemoryCritical(): boolean {
    const usedMB = this.stats.usedJSHeapSize / (1024 * 1024);
    return usedMB > this.config.maxMemoryMB;
  }

  /**
   * Force garbage collection (if available)
   */
  public forceGarbageCollection(): void {
    if ((window as any).gc) {
      (window as any).gc();
    } else {
      console.warn('Garbage collection not available. Run with --expose-gc flag.');
    }
  }

  /**
   * Dispose of memory manager
   */
  public dispose(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
  }
}
```

## Integration with Existing Systems

### Performance-Aware Rendering Manager

```typescript
// Enhanced RenderingManager with performance optimizations
export class RenderingManager {
  private objectPoolManager: ThreeObjectPoolManager;
  private lodManager?: LODManager;
  private cullingManager?: CullingManager;
  private memoryManager?: MemoryManager;

  constructor(graph: SpaceGraph, container: HTMLElement) {
    // ... existing initialization
    this.objectPoolManager = ThreeObjectPoolManager.getInstance();
    this.setupPerformanceSystems();
  }

  private setupPerformanceSystems(): void {
    // Setup LOD system
    if (this.graph.state.performance?.enableLOD) {
      this.lodManager = new LODManager(this.graph, {
        levels: [],
        transitionSmoothing: true,
        smoothingDistance: 10,
        updateInterval: 100
      });
    }

    // Setup culling system
    if (this.graph.state.performance?.enableCulling) {
      this.cullingManager = new CullingManager(this.graph, {
        frustumCulling: true,
        occlusionCulling: true,
        distanceCulling: true,
        updateInterval: 100,
        frustumFovMultiplier: 1.1,
        occlusionThreshold: 0.01,
        maxDistance: 1000
      });
    }

    // Setup memory management
    if (this.graph.state.performance?.enableMemoryManagement) {
      this.memoryManager = new MemoryManager(this.graph, {
        maxMemoryMB: 512,
        warningThreshold: 0.8,
        cleanupInterval: 30000,
        aggressiveCleanup: true
      });
    }
  }

  /**
   * Create node with performance optimizations
   */
  public createNode(node: NodeSpec): void {
    // Use object pools for geometries and materials
    const geometry = this.objectPoolManager.getSphereGeometry();
    const material = this.objectPoolManager.getMaterial();
    
    // Create mesh with pooled resources
    const mesh = new THREE.Mesh(geometry, material);
    
    // Register with LOD system if enabled
    if (this.lodManager) {
      const lodLevels = LODManager.createSphereLODs(0.5);
      this.lodManager.registerObject(node.id, mesh, lodLevels);
    }
    
    // Register with culling system if enabled
    if (this.cullingManager) {
      const cullableObject: CullableObject = {
        id: node.id,
        object: mesh,
        boundingBox: new THREE.Box3().setFromObject(mesh),
        boundingSphere: new THREE.Sphere().setFromObject(mesh),
        layers: 1
      };
      this.cullingManager.registerObject(cullableObject);
    }
    
    // ... rest of node creation
  }
}
```

## Performance Monitoring and Metrics

### Performance Metrics Collection

```typescript
// src/utils/PerformanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  public startMeasurement(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  public endMeasurement(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.recordMetric(name, duration);
    this.startTimes.delete(name);
    
    return duration;
  }

  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  public getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  public getMetricsReport(): Record<string, {
    average: number;
    min: number;
    max: number;
    count: number;
  }> {
    const report: Record<string, any> = {};
    
    for (const [name, values] of this.metrics) {
      if (values.length === 0) continue;
      
      report[name] = {
        average: this.getAverageMetric(name),
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
    
    return report;
  }
}
```

## Usage Examples

### Basic Performance Setup

```typescript
const graph = new SpaceGraph('#container', {
  data: { /* your data */ },
  performance: {
    enableLOD: true,
    enableCulling: true,
    enableMemoryManagement: true,
    instancingThreshold: 100
  }
});
```

### Custom LOD Configuration

```typescript
// Create custom LOD levels
const customLODs: LODLevel[] = [
  {
    distance: 0,
    geometry: new THREE.SphereGeometry(1, 32, 32),
    material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    complexity: 1.0
  },
  {
    distance: 100,
    geometry: new THREE.SphereGeometry(1, 16, 16),
    material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    complexity: 0.5
  },
  {
    distance: 200,
    geometry: new THREE.SphereGeometry(1, 8, 8),
    material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    complexity: 0.25
  }
];

// Apply to specific objects
lodManager.registerObject('node1', mesh, customLODs);
```

### Performance Monitoring

```typescript
// Monitor performance metrics
const monitor = new PerformanceMonitor();

monitor.startMeasurement('frameTime');
// ... rendering code ...
const frameTime = monitor.endMeasurement('frameTime');

console.log(`Frame time: ${frameTime}ms`);

// Get comprehensive performance report
const report = monitor.getMetricsReport();
console.log('Performance Report:', report);
```

### Memory Management

```typescript
// Check memory usage
const memoryStats = memoryManager.getMemoryStats();
console.log(`Memory usage: ${(memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);

// Force cleanup if needed
if (memoryManager.isMemoryCritical()) {
  memoryManager.performAggressiveCleanup();
}
```

This comprehensive performance optimization specification provides a complete blueprint for implementing advanced
performance features that will enable SpaceGraphJS3 to handle large-scale visualizations while maintaining excellent
performance and user experience.