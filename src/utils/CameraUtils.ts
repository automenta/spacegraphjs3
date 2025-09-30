/**
 * Camera Utilities - Common camera operations and abstractions
 * Provides reusable utilities for camera management and animations
 */

import * as THREE from 'three';
import { AnimationCurves } from './AnimationUtils';

export interface CameraAnimationConfig {
  duration?: number;
  easing?: string;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export interface CameraTarget {
  position?: THREE.Vector3;
  target?: THREE.Vector3;
  distance?: number;
  phi?: number;
  theta?: number;
}

export interface FramingOptions {
  padding?: number;
  focusMode?: 'all' | 'center' | 'weighted' | 'selection';
  animate?: boolean;
  duration?: number;
}

export class CameraUtils {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;

  constructor(camera?: THREE.Camera, scene?: THREE.Scene) {
    this.camera = camera || new THREE.PerspectiveCamera();
    this.scene = scene || new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Set camera and scene for utility operations
   */
  setCameraAndScene(camera: THREE.Camera, scene: THREE.Scene): void {
    this.camera = camera;
    this.scene = scene;
  }
  /**
   * Calculate optimal camera position to frame a set of targets
   */
  static calculateOptimalPosition(
    targets: Array<{ position: THREE.Vector3 }>,
    camera: THREE.Camera,
    options: FramingOptions = {}
  ): CameraTarget {
    const {
      padding = 1.2,
      focusMode = 'all'
    } = options;

    if (targets.length === 0) {
      return {
        position: new THREE.Vector3(0, 0, 30),
        target: new THREE.Vector3(0, 0, 0),
        distance: 30
      };
    }

    // Calculate bounding sphere
    const positions = targets.map(t => t.position);
    const center = new THREE.Vector3();
    positions.forEach(pos => center.add(pos));
    center.divideScalar(positions.length);

    let maxDistance = 0;
    positions.forEach(pos => {
      const distance = pos.distanceTo(center);
      maxDistance = Math.max(maxDistance, distance);
    });

    // Apply padding
    maxDistance *= padding;

    // Calculate camera position based on focus mode
    let cameraPosition: THREE.Vector3;
    let distance: number;

    switch (focusMode) {
      case 'center': {
        cameraPosition = center.clone().add(new THREE.Vector3(0, 0, maxDistance * 2));
        distance = maxDistance * 2;
        break;
      }
      
      case 'weighted': {
        // Weighted center considering node importance/distance
        const weightedCenter = CameraUtils.calculateWeightedCenter(positions);
        cameraPosition = weightedCenter.clone().add(new THREE.Vector3(0, maxDistance * 0.5, maxDistance * 1.5));
        distance = maxDistance * 1.8;
        break;
      }
      
      case 'selection': {
        // Focus on selected elements with closer view
        cameraPosition = center.clone().add(new THREE.Vector3(maxDistance * 0.3, maxDistance * 0.2, maxDistance));
        distance = maxDistance * 1.2;
        break;
      }
      
      case 'all':
      default: {
        // Traditional bounding sphere approach
        const fov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
        const aspect = (camera as THREE.PerspectiveCamera).aspect;
        const verticalFov = fov;
        const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
        
        distance = maxDistance / Math.sin(Math.min(verticalFov, horizontalFov) / 2);
        cameraPosition = center.clone().add(new THREE.Vector3(0, 0, distance));
        break;
      }
    }

    return {
      position: cameraPosition,
      target: center.clone(),
      distance: distance
    };
  }

  /**
   * Calculate weighted center for non-uniform distributions
   */
  static calculateWeightedCenter(positions: THREE.Vector3[]): THREE.Vector3 {
    if (positions.length === 0) return new THREE.Vector3();

    // Simple weighted center - can be enhanced with actual node weights
    const center = new THREE.Vector3();
    let totalWeight = 0;

    positions.forEach(pos => {
      // Weight based on distance from origin (nodes further away get more weight)
      const weight = 1 + pos.length() * 0.1;
      center.add(pos.clone().multiplyScalar(weight));
      totalWeight += weight;
    });

    return center.divideScalar(totalWeight);
  }

  /**
   * Smooth camera animation with easing
   */
  static animateCameraToTarget(
    camera: THREE.Camera,
    target: CameraTarget,
    config: CameraAnimationConfig = {}
  ): Promise<void> {
    const {
      duration = 1000,
      easing = 'ease-out',
      onComplete,
      onUpdate
    } = config;

    return new Promise((resolve) => {
      const startPosition = camera.position.clone();
      const startTarget = CameraUtils.getCameraTarget(camera);
      
      const endPosition = target.position || startPosition;
      const endTarget = target.target || startTarget;

      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Apply easing
        const easedProgress = CameraUtils.applyEasing(progress, easing);

        // Interpolate position
        camera.position.lerpVectors(startPosition, endPosition, easedProgress);

        // Update camera look-at if target is provided
        if (target.target && camera instanceof THREE.PerspectiveCamera) {
          const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, easedProgress);
          camera.lookAt(currentTarget);
        }

        if (onUpdate) {
          onUpdate(easedProgress);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (onComplete) onComplete();
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Apply easing function to progress
   */
  private static applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'linear':
      default:
        return progress;
    }
  }

  /**
   * Get current camera target (look-at point)
   */
  static getCameraTarget(camera: THREE.Camera): THREE.Vector3 {
    if (camera instanceof THREE.PerspectiveCamera) {
      // Extract look-at direction from camera matrix
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      
      // Assume target is 100 units in front of camera (common convention)
      return camera.position.clone().add(direction.multiplyScalar(100));
    }
    
    // Fallback for other camera types
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * Convert spherical coordinates to Cartesian
   */
  static sphericalToCartesian(
    radius: number,
    phi: number,
    theta: number,
    target: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Vector3 {
    return target.setFromSphericalCoords(radius, phi, theta);
  }

  /**
   * Convert Cartesian coordinates to spherical
   */
  static cartesianToSpherical(
    position: THREE.Vector3,
    target: THREE.Spherical = new THREE.Spherical()
  ): THREE.Spherical {
    return target.setFromVector3(position);
  }

  /**
   * Clamp camera position within bounds
   */
  static clampCameraPosition(
    position: THREE.Vector3,
    minBounds: THREE.Vector3,
    maxBounds: THREE.Vector3
  ): THREE.Vector3 {
    return position.clamp(minBounds, maxBounds);
  }

  /**
   * Check if camera position is within valid bounds
   */
  static isPositionValid(
    position: THREE.Vector3,
    minBounds: THREE.Vector3,
    maxBounds: THREE.Vector3
  ): boolean {
    return position.x >= minBounds.x && position.x <= maxBounds.x &&
           position.y >= minBounds.y && position.y <= maxBounds.y &&
           position.z >= minBounds.z && position.z <= maxBounds.z;
  }

  /**
   * Calculate smooth camera path between two points
   */
  static calculateCameraPath(
    start: THREE.Vector3,
    end: THREE.Vector3,
    controlPoints: THREE.Vector3[] = []
  ): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    const segments = 20; // Number of path segments
    
    // Simple linear interpolation if no control points
    if (controlPoints.length === 0) {
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = new THREE.Vector3().lerpVectors(start, end, t);
        path.push(point);
      }
      return path;
    }
    
    // Bezier curve with control points
    const allPoints = [start, ...controlPoints, end];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = CameraUtils.evaluateBezier(allPoints, t);
      path.push(point);
    }
    
    return path;
  }

  /**
   * Calculate optimal distance for camera to fit a bounding radius
   * @param boundingRadius - The radius of the bounding sphere
   * @param camera - The camera to calculate for
   * @returns The optimal distance
   */
  static calculateOptimalDistance(boundingRadius: number, camera: THREE.Camera): number {
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      // For orthographic or other camera types, return a reasonable default
      return boundingRadius * 2;
    }
    
    // Calculate distance based on field of view
    const fov = camera.fov * Math.PI / 180; // Convert to radians
    const distance = boundingRadius / Math.tan(fov / 2);
    
    // Add some padding to ensure the object fits comfortably
    return distance * 1.2;
  }

  /**
   * Evaluate Bezier curve at given parameter
   */
  private static evaluateBezier(points: THREE.Vector3[], t: number): THREE.Vector3 {
    if (points.length === 1) return points[0].clone();
    
    const newPoints: THREE.Vector3[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const point = new THREE.Vector3().lerpVectors(points[i], points[i + 1], t);
      newPoints.push(point);
    }
    
    return CameraUtils.evaluateBezier(newPoints, t);
  }

  /**
   * Create camera preset from current state
   */
  static createCameraPreset(
    camera: THREE.Camera,
    name: string,
    description?: string
  ): CameraTarget & { name: string; description?: string } {
    const target = CameraUtils.getCameraTarget(camera);
    
    return {
      name,
      description,
      position: camera.position.clone(),
      target: target,
      distance: camera.position.distanceTo(target)
    };
  }

  /**
   * Apply camera preset
   */
  static applyCameraPreset(
    camera: THREE.Camera,
    preset: CameraTarget,
    animate: boolean = true,
    duration: number = 1000
  ): Promise<void> {
    if (!animate) {
      camera.position.copy(preset.position || camera.position);
      if (preset.target && camera instanceof THREE.PerspectiveCamera) {
        camera.lookAt(preset.target);
      }
      return Promise.resolve();
    }

    return CameraUtils.animateCameraToTarget(camera, preset, { duration });
  }

  /**
   * Calculate field of view for given distance and size
   */
  static calculateFOV(distance: number, size: number): number {
    return 2 * Math.atan(size / (2 * distance)) * (180 / Math.PI);
  }

  /**
   * Convert between different camera coordinate systems
   */
  static convertCoordinateSystem(
    position: THREE.Vector3,
    fromSystem: 'cartesian' | 'spherical',
    toSystem: 'cartesian' | 'spherical'
  ): THREE.Vector3 | THREE.Spherical {
    if (fromSystem === toSystem) return position.clone();

    if (fromSystem === 'cartesian' && toSystem === 'spherical') {
      return CameraUtils.cartesianToSpherical(position);
    }

    if (fromSystem === 'spherical' && toSystem === 'cartesian') {
      const spherical = position as unknown as THREE.Spherical;
      return CameraUtils.sphericalToCartesian(spherical.radius, spherical.phi, spherical.theta);
    }

    return position.clone();
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: THREE.Vector2, distance: number = 1): THREE.Vector3 {
    const vector = new THREE.Vector3(
      (screenPos.x / window.innerWidth) * 2 - 1,
      -(screenPos.y / window.innerHeight) * 2 + 1,
      0.5
    );

    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    return this.camera.position.clone().add(dir.multiplyScalar(distance));
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: THREE.Vector3): THREE.Vector2 {
    const vector = worldPos.clone();
    vector.project(this.camera);
    
    return new THREE.Vector2(
      (vector.x + 1) / 2 * window.innerWidth,
      -(vector.y - 1) / 2 * window.innerHeight
    );
  }

  /**
   * Raycast from screen position
   */
  raycastFromScreen(screenPos: THREE.Vector2, objects: THREE.Object3D[] = []): THREE.Intersection[] {
    const mouse = new THREE.Vector2(
      (screenPos.x / window.innerWidth) * 2 - 1,
      -(screenPos.y / window.innerHeight) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);
    
    const targetObjects = objects.length > 0 ? objects : this.scene.children;
    return this.raycaster.intersectObjects(targetObjects, true);
  }

  /**
   * Get object at screen position
   */
  getObjectAtPosition(screenPos: THREE.Vector2, objects: THREE.Object3D[] = []): THREE.Object3D | null {
    const intersections = this.raycastFromScreen(screenPos, objects);
    return intersections.length > 0 ? intersections[0].object : null;
  }

  /**
   * Calculate distance between two screen positions
   */
  calculateDistance(pos1: THREE.Vector2, pos2: THREE.Vector2): number {
    return pos1.distanceTo(pos2);
  }

  /**
   * Apply camera shake effect
   */
  applyCameraShake(intensity: number, duration: number = 500): void {
    const startTime = Date.now();
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      if (progress >= 1) return;
      
      // Apply diminishing shake effect
      const shakeAmount = intensity * (1 - progress) * 0.5;
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * shakeAmount,
        (Math.random() - 0.5) * shakeAmount,
        (Math.random() - 0.5) * shakeAmount
      );
      
      this.camera.position.add(offset);
      
      setTimeout(() => {
        this.camera.position.sub(offset);
        if (progress < 1) shake();
      }, 16); // ~60fps
    };
    
    shake();
  }

  /**
   * Calculate optimal autozoom parameters
   */
  calculateAutozoomParameters(
    elements: Array<{ position: THREE.Vector3 }>,
    focusMode: 'all' | 'center' | 'weighted' | 'selection' = 'all',
    strategy: 'tight' | 'loose' | 'optimal' | 'smart' = 'optimal'
  ): { target: THREE.Vector3; distance: number } {
    if (elements.length === 0) {
      return { target: new THREE.Vector3(0, 0, 0), distance: 50 };
    }

    // Calculate center
    const center = new THREE.Vector3();
    elements.forEach(el => center.add(el.position));
    center.divideScalar(elements.length);

    // Calculate maximum distance from center
    let maxDistance = 0;
    elements.forEach(el => {
      const distance = el.position.distanceTo(center);
      maxDistance = Math.max(maxDistance, distance);
    });

    // Apply strategy multiplier
    let distanceMultiplier = 1.5;
    switch (strategy) {
      case 'tight':
        distanceMultiplier = 1.2;
        break;
      case 'loose':
        distanceMultiplier = 3.0;
        break;
      case 'smart': {
        // Calculate distribution factor
        const distributionFactor = this.calculateDistributionFactor(elements, center);
        distanceMultiplier = 1 + distributionFactor * 0.5;
        break;
      }
      case 'optimal':
      default:
        distanceMultiplier = 1.5;
        break;
    }

    // Calculate final distance based on camera FOV
    let finalDistance = maxDistance * distanceMultiplier;
    if (this.camera instanceof THREE.PerspectiveCamera) {
      const fov = this.camera.fov * Math.PI / 180;
      finalDistance = (maxDistance * distanceMultiplier) / Math.sin(fov / 2);
    }

    return { target: center, distance: finalDistance };
  }

  /**
   * Calculate distribution factor for smart framing
   */
  private calculateDistributionFactor(
    elements: Array<{ position: THREE.Vector3 }>,
    center: THREE.Vector3
  ): number {
    if (elements.length <= 1) return 0;

    // Calculate standard deviation of distances from center
    const distances = elements.map(el => el.position.distanceTo(center));
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    // Normalize by average distance
    return stdDev / (avgDistance || 1);
  }

  /**
   * Smooth zoom with constraints
   */
  smoothZoom(zoomDirection: 'in' | 'out', speed: number = 0.1, constraints?: { minDistance?: number; maxDistance?: number }): void {
    if (!(this.camera instanceof THREE.PerspectiveCamera)) return;

    const currentDistance = this.camera.position.length();
    const zoomFactor = zoomDirection === 'in' ? 1 - speed : 1 + speed;
    let newDistance = currentDistance * zoomFactor;

    // Apply constraints
    if (constraints) {
      if (constraints.minDistance !== undefined) {
        newDistance = Math.max(constraints.minDistance, newDistance);
      }
      if (constraints.maxDistance !== undefined) {
        newDistance = Math.min(constraints.maxDistance, newDistance);
      }
    }

    // Calculate new position
    const positionDirection = this.camera.position.clone().normalize();
    this.camera.position.copy(positionDirection.multiplyScalar(newDistance));
  }

  /**
   * Handle touch gestures (pinch to zoom, tap to focus)
   */
  handleTouchGesture(
    gesture: 'pinch' | 'tap' | 'swipe',
    data: { startPos?: THREE.Vector2; endPos?: THREE.Vector2; distance?: number; scale?: number }
  ): void {
    switch (gesture) {
      case 'pinch':
        if (data.scale !== undefined) {
          const zoomDirection = data.scale > 1 ? 'out' : 'in';
          const speed = Math.abs(data.scale - 1) * 0.1;
          this.smoothZoom(zoomDirection, speed);
        }
        break;
        
      case 'tap':
        if (data.startPos) {
          // Convert to world coordinates and potentially focus on object
          const worldPos = this.screenToWorld(data.startPos, 10);
          // This could trigger focus logic
        }
        break;
        
      case 'swipe':
        if (data.startPos && data.endPos) {
          const delta = data.endPos.clone().sub(data.startPos);
          // Convert to camera movement
          const sensitivity = 0.01;
          this.camera.position.x -= delta.x * sensitivity;
          this.camera.position.y += delta.y * sensitivity;
        }
        break;
    }
  }
}

export default CameraUtils;