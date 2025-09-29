# SpaceGraphJS3 Enhanced Camera Features Specification

## Overview

This document specifies the implementation of advanced camera features for SpaceGraphJS3, including auto-zoom capabilities, camera presets and bookmarks, smooth rotation controls, and advanced framing options. These enhancements build upon the existing solid camera foundation to provide professional-grade camera control and animation capabilities.

## Current Camera System Analysis

### ✅ Existing Camera Features
- **Basic Camera Controls**: Pan, zoom, orbit via mouse/touch/keyboard
- **flyTo() Animation**: Smooth camera transitions to target states
- **frame() Method**: Basic framing of elements
- **Reactive Integration**: Camera state synchronized with Data Plane
- **Keyboard Controls**: WASD movement, arrow key orbit, +/- zoom

### 🔧 Missing Advanced Features
- Auto-zoom to selected elements with intelligent framing
- Camera presets and bookmarks system
- Advanced rotation controls and constraints
- Sophisticated framing options with padding and aspect ratios
- Camera path animations and tours
- Enhanced animation curves and easing

## Enhanced Camera Architecture

### Core Enhancement Areas

#### 1. Auto-Zoom System
**File**: [`src/plugins/CameraPlugin.ts`](src/plugins/CameraPlugin.ts) (enhancement)

**Features**:
- Intelligent framing of selected elements
- Configurable padding and margins
- Aspect ratio considerations
- Multi-element framing strategies
- Smooth animated transitions

#### 2. Camera Presets & Bookmarks
**New File**: `src/utils/CameraPresets.ts`

**Features**:
- Named camera position storage
- JSON serialization/deserialization
- Category organization
- Thumbnail generation
- Quick access methods

#### 3. Advanced Rotation Controls
**File**: [`src/plugins/CameraPlugin.ts`](src/plugins/CameraPlugin.ts) (enhancement)

**Features**:
- Rotation constraints and limits
- Smooth rotation animations
- Quaternion-based rotations
- Gimbal lock prevention
- Custom rotation pivots

#### 4. Enhanced Framing Options
**File**: [`src/plugins/CameraPlugin.ts`](src/plugins/CameraPlugin.ts) (enhancement)

**Features**:
- Multiple framing strategies
- Configurable padding and margins
- Aspect ratio handling
- View angle optimization
- Distance calculation improvements

## Detailed Implementation

### Phase 1: Enhanced Auto-Zoom System

#### 1.1 Intelligent Element Framing
```typescript
export interface FramingOptions {
  padding?: number | { top: number; right: number; bottom: number; left: number }; // Padding in world units
  aspectRatio?: number; // Target aspect ratio (width/height)
  minDistance?: number; // Minimum camera distance
  maxDistance?: number; // Maximum camera distance
  strategy?: 'tight' | 'loose' | 'optimal' | 'custom'; // Framing strategy
  viewAngle?: number; // Target viewing angle in degrees
  animation?: {
    duration?: number;
    easing?: string;
    curve?: string;
  };
  focusPoint?: 'center' | 'centroid' | 'weighted' | Vector3; // Focus calculation method
  upVector?: Vector3; // Up vector for camera orientation
}

export class CameraPlugin implements ISpaceGraphPlugin {
  // ... existing implementation

  /**
   * Enhanced frame method with intelligent framing options
   */
  public async frame(
    elements: Array<{ position: Vector3; size?: number }>, 
    options: FramingOptions = {}
  ): Promise<void> {
    if (elements.length === 0) return;

    const config = this.mergeFramingOptions(options);
    const boundingInfo = this.calculateBoundingInfo(elements);
    const cameraState = this.calculateOptimalCameraState(boundingInfo, config);
    
    await this.flyTo(cameraState, config.animation);
  }

  private mergeFramingOptions(options: FramingOptions): Required<FramingOptions> {
    return {
      padding: options.padding ?? 2.0,
      aspectRatio: options.aspectRatio ?? this.getViewportAspectRatio(),
      minDistance: options.minDistance ?? 1.0,
      maxDistance: options.maxDistance ?? 1000.0,
      strategy: options.strategy ?? 'optimal',
      viewAngle: options.viewAngle ?? 60,
      animation: {
        duration: options.animation?.duration ?? 1000,
        easing: options.animation?.easing ?? 'easeInOut',
        curve: options.animation?.curve ?? 'sine'
      },
      focusPoint: options.focusPoint ?? 'center',
      upVector: options.upVector ?? new Vector3(0, 1, 0)
    };
  }

  private calculateBoundingInfo(elements: Array<{ position: Vector3; size?: number }>): {
    center: Vector3;
    size: Vector3;
    radius: number;
    min: Vector3;
    max: Vector3;
  } {
    if (elements.length === 0) {
      return {
        center: new Vector3(0, 0, 0),
        size: new Vector3(0, 0, 0),
        radius: 0,
        min: new Vector3(0, 0, 0),
        max: new Vector3(0, 0, 0)
      };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const element of elements) {
      const pos = element.position;
      const size = element.size || 1.0;
      const halfSize = size * 0.5;

      minX = Math.min(minX, pos.x - halfSize);
      minY = Math.min(minY, pos.y - halfSize);
      minZ = Math.min(minZ, pos.z - halfSize);
      maxX = Math.max(maxX, pos.x + halfSize);
      maxY = Math.max(maxY, pos.y + halfSize);
      maxZ = Math.max(maxZ, pos.z + halfSize);
    }

    const min = new Vector3(minX, minY, minZ);
    const max = new Vector3(maxX, maxY, maxZ);
    const center = new Vector3().addVectors(min, max).multiplyScalar(0.5);
    const size = new Vector3().subVectors(max, min);
    const radius = center.distanceTo(max);

    return { center, size, radius, min, max };
  }

  private calculateOptimalCameraState(
    boundingInfo: ReturnType<typeof this.calculateBoundingInfo>,
    options: Required<FramingOptions>
  ): CameraSpec {
    const { center, size, radius, min, max } = boundingInfo;
    
    // Calculate required distance based on field of view and bounding size
    const fovRad = (options.viewAngle * Math.PI) / 180;
    const aspectRatio = options.aspectRatio;
    
    // Calculate the required distance to fit the bounding box
    let requiredDistance: number;
    
    switch (options.strategy) {
      case 'tight':
        requiredDistance = this.calculateTightDistance(size, fovRad, aspectRatio);
        break;
      case 'loose':
        requiredDistance = this.calculateLooseDistance(size, fovRad, aspectRatio, 1.5);
        break;
      case 'optimal':
      default:
        requiredDistance = this.calculateOptimalDistance(size, fovRad, aspectRatio);
        break;
    }

    // Apply padding
    const padding = this.normalizePadding(options.padding);
    const paddedRadius = radius + Math.max(padding.top, padding.right, padding.bottom, padding.left);
    const paddedDistance = Math.max(requiredDistance, paddedRadius / Math.tan(fovRad * 0.5));

    // Clamp to min/max distance
    const finalDistance = Math.max(options.minDistance, Math.min(options.maxDistance, paddedDistance));

    // Calculate focus point
    let focusPoint: Vector3;
    if (typeof options.focusPoint === 'string') {
      switch (options.focusPoint) {
        case 'centroid':
          focusPoint = this.calculateCentroid(elements);
          break;
        case 'weighted':
          focusPoint = this.calculateWeightedCenter(elements);
          break;
        case 'center':
        default:
          focusPoint = center;
          break;
      }
    } else {
      focusPoint = options.focusPoint;
    }

    // Calculate camera position
    const currentCameraState = this.graph.state.camera;
    const currentDirection = this.calculateCameraDirection(currentCameraState);
    
    const cameraPosition = focusPoint.clone().add(
      currentDirection.multiplyScalar(finalDistance)
    );

    return {
      target: { x: focusPoint.x, y: focusPoint.y, z: focusPoint.z },
      phi: currentCameraState.phi,
      theta: currentCameraState.theta,
      distance: finalDistance
    };
  }

  private calculateTightDistance(size: Vector3, fovRad: number, aspectRatio: number): number {
    // Calculate minimum distance to fit the bounding box tightly
    const maxDimension = Math.max(size.x, size.y, size.z);
    return maxDimension / (2 * Math.tan(fovRad * 0.5));
  }

  private calculateLooseDistance(size: Vector3, fovRad: number, aspectRatio: number, multiplier: number): number {
    // Calculate distance with additional margin
    return this.calculateTightDistance(size, fovRad, aspectRatio) * multiplier;
  }

  private calculateOptimalDistance(size: Vector3, fovRad: number, aspectRatio: number): number {
    // Calculate optimal distance considering viewing comfort
    const tightDistance = this.calculateTightDistance(size, fovRad, aspectRatio);
    return tightDistance * 1.2; // 20% additional margin
  }

  private normalizePadding(padding: number | { top: number; right: number; bottom: number; left: number }): {
    top: number; right: number; bottom: number; left: number;
  } {
    if (typeof padding === 'number') {
      return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return padding;
  }

  private getViewportAspectRatio(): number {
    const container = this.graph.getContainer();
    return container.clientWidth / container.clientHeight;
  }

  private calculateCameraDirection(cameraState: CameraSpec): Vector3 {
    const phi = cameraState.phi * Math.PI / 180;
    const theta = cameraState.theta * Math.PI / 180;
    
    return new Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );
  }
}
```

#### 1.2 Auto-Zoom to Selected Elements
```typescript
export class CameraPlugin implements ISpaceGraphPlugin {
  // ... existing implementation

  /**
   * Automatically frame all selected elements
   */
  public async frameSelected(options: FramingOptions = {}): Promise<void> {
    const selectedIds = this.graph.state.interaction.selectedElementIds;
    if (selectedIds.length === 0) return;

    const selectedElements = this.getElementsByIds(selectedIds);
    await this.frame(selectedElements, options);
  }

  /**
   * Watch for selection changes and auto-frame
   */
  private setupAutoFrameWatcher(): void {
    createEffect(() => {
      const selectedIds = this.graph.state.interaction.selectedElementIds;
      const autoFrameEnabled = this.graph.state.camera.autoFrameEnabled ?? false;
      
      if (autoFrameEnabled && selectedIds.length > 0) {
        // Debounce to avoid rapid framing during multi-selection
        this.debouncedFrameSelected();
      }
    });
  }

  private debouncedFrameSelected = this.debounce(async () => {
    await this.frameSelected({
      animation: { duration: 500 },
      strategy: 'optimal'
    });
  }, 300);

  private debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  private getElementsByIds(ids: string[]): Array<{ position: Vector3; size?: number }> {
    return ids.map(id => {
      const element = this.graph.state.data.nodes.find(n => n.id === id) ||
                     this.graph.state.data.edges.find(e => e.id === id);
      
      if (!element) return null;

      return {
        position: new Vector3(
          element.position?.x || 0,
          element.position?.y || 0,
          element.position?.z || 0
        ),
        size: (element as any).size || 1.0
      };
    }).filter(Boolean) as Array<{ position: Vector3; size?: number }>;
  }
}
```

### Phase 2: Camera Presets and Bookmarks

#### 2.1 Camera Presets Manager
```typescript
// src/utils/CameraPresets.ts
export interface CameraPreset {
  id: string;
  name: string;
  description?: string;
  cameraState: CameraSpec;
  thumbnail?: string; // Base64 encoded thumbnail
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CameraPresetsCollection {
  version: string;
  presets: CameraPreset[];
  categories: string[];
}

export class CameraPresetsManager {
  private graph: SpaceGraph;
  private presets: Map<string, CameraPreset> = new Map();
  private categories: Set<string> = new Set();
  private storageKey: string;

  constructor(graph: SpaceGraph, storageKey = 'spacegraph-camera-presets') {
    this.graph = graph;
    this.storageKey = storageKey;
    this.loadPresets();
  }

  /**
   * Create a new camera preset from current camera state
   */
  public async createPreset(name: string, options: {
    description?: string;
    category?: string;
    tags?: string[];
    generateThumbnail?: boolean;
  } = {}): Promise<CameraPreset> {
    const currentState = this.graph.state.camera;
    const thumbnail = options.generateThumbnail 
      ? await this.generateThumbnail()
      : undefined;

    const preset: CameraPreset = {
      id: this.generateId(),
      name,
      description: options.description,
      cameraState: { ...currentState },
      thumbnail,
      category: options.category,
      tags: options.tags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.presets.set(preset.id, preset);
    
    if (preset.category) {
      this.categories.add(preset.category);
    }

    this.savePresets();
    return preset;
  }

  /**
   * Apply a camera preset
   */
  public async applyPreset(presetId: string, animation: boolean = true): Promise<void> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Camera preset with ID ${presetId} not found`);
    }

    if (animation) {
      await this.graph.cameraPlugin?.flyTo(preset.cameraState, {
        duration: 1000,
        easing: 'easeInOut'
      });
    } else {
      this.graph.update({ camera: preset.cameraState });
    }
  }

  /**
   * Generate a thumbnail for the current view
   */
  private async generateThumbnail(): Promise<string> {
    // Render current scene to canvas
    const renderer = this.graph.render.getRenderer();
    const canvas = renderer.domElement;
    
    // Create thumbnail at reduced resolution
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = 200;
    thumbnailCanvas.height = 150;
    
    const ctx = thumbnailCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
    
    return thumbnailCanvas.toDataURL('image/png');
  }

  /**
   * Get presets by category
   */
  public getPresetsByCategory(category: string): CameraPreset[] {
    return Array.from(this.presets.values())
      .filter(preset => preset.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search presets by name, description, or tags
   */
  public searchPresets(query: string): CameraPreset[] {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.presets.values())
      .filter(preset => 
        preset.name.toLowerCase().includes(lowercaseQuery) ||
        preset.description?.toLowerCase().includes(lowercaseQuery) ||
        preset.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Export presets to JSON
   */
  public exportPresets(): string {
    const collection: CameraPresetsCollection = {
      version: '1.0',
      presets: Array.from(this.presets.values()),
      categories: Array.from(this.categories)
    };
    
    return JSON.stringify(collection, null, 2);
  }

  /**
   * Import presets from JSON
   */
  public importPresets(jsonString: string): void {
    try {
      const collection: CameraPresetsCollection = JSON.parse(jsonString);
      
      if (collection.presets) {
        for (const preset of collection.presets) {
          this.presets.set(preset.id, preset);
          
          if (preset.category) {
            this.categories.add(preset.category);
          }
        }
      }
      
      if (collection.categories) {
        for (const category of collection.categories) {
          this.categories.add(category);
        }
      }
      
      this.savePresets();
    } catch (error) {
      throw new Error(`Failed to import camera presets: ${error.message}`);
    }
  }

  /**
   * Save presets to localStorage
   */
  private savePresets(): void {
    try {
      const collection: CameraPresetsCollection = {
        version: '1.0',
        presets: Array.from(this.presets.values()),
        categories: Array.from(this.categories)
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(collection));
    } catch (error) {
      console.warn('Failed to save camera presets:', error);
    }
  }

  /**
   * Load presets from localStorage
   */
  private loadPresets(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const collection: CameraPresetsCollection = JSON.parse(stored);
      
      if (collection.presets) {
        for (const preset of collection.presets) {
          this.presets.set(preset.id, preset);
          
          if (preset.category) {
            this.categories.add(preset.category);
          }
        }
      }
      
      if (collection.categories) {
        for (const category of collection.categories) {
          this.categories.add(category);
        }
      }
    } catch (error) {
      console.warn('Failed to load camera presets:', error);
    }
  }

  private generateId(): string {
    return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 2.2 Camera Presets UI Integration
```typescript
// Enhanced CameraPlugin with preset management
export class CameraPlugin implements ISpaceGraphPlugin {
  private presetsManager!: CameraPresetsManager;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.presetsManager = new CameraPresetsManager(graph);
    
    // ... existing initialization
    this.setupPresetCommands();
  }

  private setupPresetCommands(): void {
    // Add REPL commands for camera presets
    if (this.graph.cameraPlugin) {
      const commands = {
        'preset-save': async (args: string) => {
          const [name, ...options] = args.split(' ');
          const preset = await this.presetsManager.createPreset(name, {
            generateThumbnail: options.includes('--thumbnail')
          });
          return `Camera preset saved: ${preset.name} (ID: ${preset.id})`;
        },
        
        'preset-load': async (args: string) => {
          const presetId = args.trim();
          await this.presetsManager.applyPreset(presetId);
          return `Applied camera preset: ${presetId}`;
        },
        
        'preset-list': () => {
          const presets = this.presetsManager.getAllPresets();
          return presets.map(p => `${p.name} (${p.id})`).join('\n');
        },
        
        'preset-search': (args: string) => {
          const query = args.trim();
          const results = this.presetsManager.searchPresets(query);
          return results.map(p => `${p.name} - ${p.description || 'No description'}`).join('\n');
        }
      };

      // Register commands with REPL (assuming REPL system exists)
      Object.entries(commands).forEach(([name, handler]) => {
        this.registerREPLCommand(name, handler);
      });
    }
  }

  /**
   * Quick access to common camera presets
   */
  public async applyQuickPreset(presetName: 'top' | 'front' | 'side' | 'isometric'): Promise<void> {
    const presets = {
      top: {
        target: { x: 0, y: 0, z: 0 },
        phi: 0,
        theta: 0,
        distance: 10
      },
      front: {
        target: { x: 0, y: 0, z: 0 },
        phi: 90,
        theta: 0,
        distance: 10
      },
      side: {
        target: { x: 0, y: 0, z: 0 },
        phi: 90,
        theta: 90,
        distance: 10
      },
      isometric: {
        target: { x: 0, y: 0, z: 0 },
        phi: 45,
        theta: 45,
        distance: 15
      }
    };

    const preset = presets[presetName];
    if (preset) {
      await this.flyTo(preset, { duration: 800 });
    }
  }
}
```

### Phase 3: Advanced Rotation Controls

#### 3.1 Enhanced Rotation System
```typescript
export interface RotationConstraints {
  minPhi?: number; // Minimum phi angle in degrees
  maxPhi?: number; // Maximum phi angle in degrees
  minTheta?: number; // Minimum theta angle in degrees
  maxTheta?: number; // Maximum theta angle in degrees
  constrainPhi?: boolean; // Whether to constrain phi
  constrainTheta?: boolean; // Whether to constrain theta
  snapAngles?: number[]; // Angles to snap to (in degrees)
  snapThreshold?: number; // Threshold for snapping (in degrees)
}

export class CameraPlugin implements ISpaceGraphPlugin {
  private rotationConstraints: RotationConstraints = {};
  private rotationPivot: Vector3 = new Vector3(0, 0, 0);

  /**
   * Set rotation constraints
   */
  public setRotationConstraints(constraints: RotationConstraints): void {
    this.rotationConstraints = { ...constraints };
  }

  /**
   * Set custom rotation pivot point
   */
  public setRotationPivot(pivot: Vector3 | string): void {
    if (typeof pivot === 'string') {
      // Pivot around a specific element
      const element = this.graph.getElement(pivot);
      if (element && element.position) {
        this.rotationPivot.set(element.position.x, element.position.y, element.position.z);
      }
    } else {
      this.rotationPivot.copy(pivot);
    }
  }

  /**
   * Smooth rotation animation
   */
  public async rotateTo(
    phi: number, 
    theta: number, 
    options: {
      duration?: number;
      easing?: string;
      relative?: boolean; // If true, rotate relative to current position
    } = {}
  ): Promise<void> {
    const currentState = this.graph.state.camera;
    let targetPhi = phi;
    let targetTheta = theta;

    if (options.relative) {
      targetPhi = currentState.phi + phi;
      targetTheta = currentState.theta + theta;
    }

    // Apply constraints
    const constrained = this.applyRotationConstraints(targetPhi, targetTheta);
    
    await this.flyTo({
      ...currentState,
      phi: constrained.phi,
      theta: constrained.theta
    }, {
      duration: options.duration ?? 1000,
      easing: options.easing ?? 'easeInOut'
    });
  }

  /**
   * Apply rotation constraints to angles
   */
  private applyRotationConstraints(phi: number, theta: number): { phi: number; theta: number } {
    const constraints = this.rotationConstraints;
    
    let constrainedPhi = phi;
    let constrainedTheta = theta;

    // Apply angle limits
    if (constraints.constrainPhi && constraints.minPhi !== undefined) {
      constrainedPhi = Math.max(constraints.minPhi, constrainedPhi);
    }
    if (constraints.constrainPhi && constraints.maxPhi !== undefined) {
      constrainedPhi = Math.min(constraints.maxPhi, constrainedPhi);
    }
    if (constraints.constrainTheta && constraints.minTheta !== undefined) {
      constrainedTheta = Math.max(constraints.minTheta, constrainedTheta);
    }
    if (constraints.constrainTheta && constraints.maxTheta !== undefined) {
      constrainedTheta = Math.min(constraints.maxTheta, constrainedTheta);
    }

    // Apply snapping
    if (constraints.snapAngles && constraints.snapAngles.length > 0) {
      const snapThreshold = constraints.snapThreshold ?? 5;
      constrainedPhi = this.snapToAngles(constrainedPhi, constraints.snapAngles, snapThreshold);
      constrainedTheta = this.snapToAngles(constrainedTheta, constraints.snapAngles, snapThreshold);
    }

    return { phi: constrainedPhi, theta: constrainedTheta };
  }

  /**
   * Snap angle to nearest angle in array
   */
  private snapToAngles(angle: number, snapAngles: number[], threshold: number): number {
    for (const snapAngle of snapAngles) {
      const diff = Math.abs(angle - snapAngle);
      if (diff <= threshold) {
        return snapAngle;
      }
    }
    return angle;
  }

  /**
   * Orbit camera around pivot point
   */
  public async orbitAround(
    axis: 'x' | 'y' | 'z' | Vector3,
    angle: number,
    options: {
      duration?: number;
      easing?: string;
      pivot?: Vector3 | string; // Pivot point or element ID
    } = {}
  ): Promise<void> {
    const pivot = options.pivot ? this.resolvePivot(options.pivot) : this.rotationPivot;
    const currentState = this.graph.state.camera;
    
    // Calculate new camera position
    const currentPos = this.calculateCameraPosition(currentState);
    const newPos = this.rotatePointAroundAxis(currentPos, pivot, axis, angle);
    
    // Calculate new target (keep looking at pivot)
    const newDirection = new Vector3().subVectors(pivot, newPos).normalize();
    const newPhi = Math.acos(newDirection.y) * 180 / Math.PI;
    const newTheta = Math.atan2(newDirection.z, newDirection.x) * 180 / Math.PI;
    
    const distance = newPos.distanceTo(pivot);
    
    await this.flyTo({
      target: { x: pivot.x, y: pivot.y, z: pivot.z },
      phi: newPhi,
      theta: newTheta,
      distance
    }, {
      duration: options.duration ?? 1000,
      easing: options.easing ?? 'easeInOut'
    });
  }

  private resolvePivot(pivot: Vector3 | string): Vector3 {
    if (typeof pivot === 'string') {
      const element = this.graph.getElement(pivot);
      if (element && element.position) {
        return new Vector3(element.position.x, element.position.y, element.position.z);
      }
      return new Vector3(0, 0, 0);
    }
    return pivot;
  }

  private rotatePointAroundAxis(
    point: Vector3, 
    center: Vector3, 
    axis: 'x' | 'y' | 'z' | Vector3, 
    angle: number
  ): Vector3 {
    const translated = point.clone().sub(center);
    const rotation = new THREE.Matrix4();
    const angleRad = angle * Math.PI / 180;

    if (typeof axis === 'string') {
      switch (axis) {
        case 'x':
          rotation.makeRotationX(angleRad);
          break;
        case 'y':
          rotation.makeRotationY(angleRad);
          break;
        case 'z':
          rotation.makeRotationZ(angleRad);
          break;
      }
    } else {
      rotation.makeRotationAxis(axis.normalize(), angleRad);
    }

    const rotated = translated.applyMatrix4(rotation);
    return rotated.add(center);
  }
}
```

### Phase 4: Enhanced Animation System

#### 4.1 Advanced Animation Curves
```typescript
export interface AnimationCurve {
  name: string;
  easing: (t: number) => number;
}

export const AnimationCurves: Record<string, AnimationCurve> = {
  linear: { name: 'Linear', easing: t => t },
  easeInOut: { name: 'Ease In Out', easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
  easeIn: { name: 'Ease In', easing: t => t * t },
  easeOut: { name: 'Ease Out', easing: t => t * (2 - t) },
  bounce: { 
    name: 'Bounce', 
    easing: t => {
      if (t < 1/2.75) return 7.5625 * t * t;
      if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
      if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
    }
  },
  elastic: {
    name: 'Elastic',
    easing: t => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      const p = 0.3;
      const s = p / 4;
      return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    }
  }
};

export class CameraPlugin implements ISpaceGraphPlugin {
  /**
   * Enhanced flyTo with custom animation curves
   */
  public async flyTo(
    targetState: Partial<CameraSpec>,
    options: {
      duration?: number;
      easing?: string | AnimationCurve;
      onUpdate?: (progress: number) => void;
      onComplete?: () => void;
      interruptible?: boolean; // Whether animation can be interrupted
    } = {}
  ): Promise<void> {
    const startState = { ...this.graph.state.camera };
    const endState = { ...startState, ...targetState };
    
    const duration = options.duration ?? 1000;
    const easing = typeof options.easing === 'string' 
      ? AnimationCurves[options.easing]?.easing ?? AnimationCurves.easeInOut.easing
      : options.easing?.easing ?? AnimationCurves.easeInOut.easing;

    // Handle interruptible animations
    if (this.currentAnimation && options.interruptible !== false) {
      this.currentAnimation.cancel();
    }

    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        // Interpolate camera state
        const currentState = this.interpolateCameraState(startState, endState, easedProgress);
        
        // Update camera
        this.graph.update({ camera: currentState });
        
        // Call update callback
        options.onUpdate?.(easedProgress);

        if (progress < 1) {
          this.currentAnimation = { cancel: () => resolve() };
          requestAnimationFrame(animate);
        } else {
          this.currentAnimation = null;
          options.onComplete?.();
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private interpolateCameraState(
    start: CameraSpec,
    end: CameraSpec,
    progress: number
  ): CameraSpec {
    return {
      target: {
        x: this.lerp(start.target.x, end.target.x, progress),
        y: this.lerp(start.target.y, end.target.y, progress),
        z: this.lerp(start.target.z, end.target.z, progress)
      },
      phi: this.lerp(start.phi, end.phi, progress),
      theta: this.lerp(start.theta, end.theta, progress),
      distance: this.lerp(start.distance, end.distance, progress)
    };
  }

  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }
}
```

## Usage Examples

### Basic Auto-Zoom
```typescript
const graph = new SpaceGraph('#container', {
  data: { /* your data */ },
  camera: {
    autoFrameEnabled: true // Enable automatic framing on selection
  }
});

// Frame specific elements
await graph.camera.frame([
  { position: new Vector3(0, 0, 0), size: 1 },
  { position: new Vector3(10, 10, 10), size: 2 }
], {
  padding: 5,
  strategy: 'optimal',
  animation: { duration: 1000 }
});
```

### Camera Presets
```typescript
// Save current view as preset
const preset = await graph.camera.presetsManager.createPreset('My View', {
  description: 'Overview of the main cluster',
  category: 'Analysis',
  generateThumbnail: true
});

// Apply preset later
await graph.camera.presetsManager.applyPreset(preset.id);

// Quick standard views
await graph.camera.applyQuickPreset('isometric');
await graph.camera.applyQuickPreset('top');
await graph.camera.applyQuickPreset('front');
```

### Advanced Rotation
```typescript
// Set rotation constraints
graph.camera.setRotationConstraints({
  minPhi: 10,
  maxPhi: 170,
  constrainPhi: true,
  snapAngles: [0, 45, 90, 135, 180, 225, 270, 315],
  snapThreshold: 5
});

// Smooth rotation animation
await graph.camera.rotateTo(45, 90, {
  duration: 2000,
  easing: 'bounce',
  relative: false
});

// Orbit around specific point
await graph.camera.orbitAround('y', 360, {
  duration: 3000,
  pivot: new Vector3(5, 5, 5),
  easing: 'linear'
});
```

### Custom Animation Curves
```typescript
// Use custom animation curves
await graph.camera.flyTo({
  target: { x: 10, y: 10, z: 10 },
  phi: 45,
  theta: 45,
  distance: 20
}, {
  duration: 2000,
  easing: 'elastic',
  onUpdate: (progress) => {
    console.log(`Animation progress: ${(progress * 100).toFixed(1)}%`);
  },
  onComplete: () => {
    console.log('Camera animation completed');
  }
});
```

This specification provides a comprehensive blueprint for implementing advanced camera features that enhance the user experience while maintaining the performance and architectural standards of SpaceGraphJS3.