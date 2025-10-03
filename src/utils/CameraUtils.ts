/**
 * Camera Utilities - Common camera operations and abstractions
 * Provides reusable utilities for camera management and animations
 */

import * as THREE from 'three';
import { screenToWorld, worldToScreen, raycastFromScreen, getObjectAtPosition } from './threeUtils';

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

  // ... existing code ...

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: THREE.Vector2, distance: number = 1): THREE.Vector3 {
    return screenToWorld(screenPos, this.camera, distance);
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: THREE.Vector3): THREE.Vector2 {
    return worldToScreen(worldPos, this.camera);
  }

  /**
   * Raycast from screen position
   */
  raycastFromScreen(
    screenPos: THREE.Vector2,
    objects: THREE.Object3D[] = []
  ): THREE.Intersection[] {
    return raycastFromScreen(screenPos, this.camera, this.raycaster, objects);
  }

  /**
   * Get object at screen position
   */
  getObjectAtPosition(
    screenPos: THREE.Vector2,
    objects: THREE.Object3D[] = []
  ): THREE.Object3D | null {
    return getObjectAtPosition(screenPos, this.camera, this.raycaster, objects);
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
    _focusMode: 'all' | 'center' | 'weighted' | 'selection' = 'all',
    strategy: 'tight' | 'loose' | 'optimal' | 'smart' = 'optimal'
  ): { target: THREE.Vector3; distance: number } {
    if (elements.length === 0) {
      return { target: new THREE.Vector3(0, 0, 0), distance: 50 };
    }

    // Calculate center
    const center = new THREE.Vector3();
    elements.forEach((el) => center.add(el.position));
    center.divideScalar(elements.length);

    // Calculate maximum distance from center
    let maxDistance = 0;
    elements.forEach((el) => {
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
        const distributionFactor = this.calculateDistributionFactor(
          elements,
          center
        );
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
      const fov = (this.camera.fov * Math.PI) / 180;
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
    const distances = elements.map((el) => el.position.distanceTo(center));
    const avgDistance =
      distances.reduce((sum, d) => sum + d, 0) / distances.length;

    const variance =
      distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) /
      distances.length;
    const stdDev = Math.sqrt(variance);

    // Normalize by average distance
    return stdDev / (avgDistance || 1);
  }

  /**
   * Smooth zoom with constraints
   */
  smoothZoom(
    zoomDirection: 'in' | 'out',
    speed: number = 0.1,
    constraints?: { minDistance?: number; maxDistance?: number }
  ): void {
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
    data: {
      startPos?: THREE.Vector2;
      endPos?: THREE.Vector2;
      distance?: number;
      scale?: number;
    }
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
          const _worldPos = screenToWorld(data.startPos, this.camera, 10);
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

  // Static methods from the original class
  static calculateOptimalPosition(
    targets: Array<{ position: THREE.Vector3 }>,
    camera: THREE.Camera,
    options: FramingOptions = {}
  ): CameraTarget {
    if (targets.length === 0) {
      return {
        position: new THREE.Vector3(0, 10, 10),
        target: new THREE.Vector3(0, 0, 0),
        distance: 10,
      };
    }

    // Calculate center
    const center = new THREE.Vector3();
    targets.forEach((target) => center.add(target.position));
    center.divideScalar(targets.length);

    // Calculate maximum distance from center
    let maxDistance = 0;
    targets.forEach((target) => {
      const distance = target.position.distanceTo(center);
      maxDistance = Math.max(maxDistance, distance);
    });

    // Apply padding
    const padding = options.padding || 1.2;
    const boundingRadius = maxDistance * padding;

    // Calculate distance based on camera FOV
    let distance = boundingRadius * 2;
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = (camera.fov * Math.PI) / 180;
      distance = (boundingRadius * 2) / Math.sin(fov / 2);
    }

    // Calculate position (camera position relative to target)
    const position = center.clone().add(new THREE.Vector3(0, 0, distance));

    return {
      position,
      target: center,
      distance,
    };
  }

  static calculateOptimalDistance(
    boundingRadius: number,
    camera: THREE.Camera
  ): number {
    let distance = boundingRadius * 2;
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = (camera.fov * Math.PI) / 180;
      distance = (boundingRadius * 2) / Math.sin(fov / 2);
    }
    return distance;
  }
}

export default CameraUtils;
