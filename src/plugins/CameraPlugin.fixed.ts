import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { animate } from 'popmotion';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraphCore } from '../core/SpaceGraphCore';
import { SpecUpdate, CameraSpec, RotationConstraints } from '../types';
import { InteractionLogic } from '../InteractionLogic';
import { CameraPresetsManager, CameraPreset } from '../utils/CameraPresets';
import { ObjectPoolManager } from '../utils/ObjectPoolManager';
import { AnimationCurves } from '../utils/AnimationUtils';
import { CameraUtils } from '../utils/CameraUtils';
import { Logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * Enhanced camera state with validation and atomic updates
 */
interface CameraState {
  target: THREE.Vector3;
  distance: number;
  phi: number;
  theta: number;
  isValid: boolean;
  lastUpdate: number;
  version: number;
}

/**
 * Animation operation with enhanced error handling
 */
interface AnimationOperation {
  id: string;
  targetState: Partial<CameraSpec>;
  options: AnimationOptions;
  priority: number;
  createdAt: number;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Enhanced animation options with reliability features
 */
interface AnimationOptions {
  duration: number;
  easing?: (t: number) => number | string;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  interruptible?: boolean;
  priority?: number;
  retryCount?: number;
  timeout?: number;
  validateTarget?: boolean;
}

/**
 * Touch gesture state with corruption detection
 */
interface TouchGestureState {
  isActive: boolean;
  startTime: number;
  lastUpdate: number;
  touchCount: number;
  initialDistance: number;
  initialAngle: number;
  lastDistance: number;
  lastAngle: number;
  accumulatedDelta: THREE.Vector2;
  isCorrupted: boolean;
  orientation: number;
  checksum: string;
}

/**
 * Constraint validation result
 */
interface ConstraintValidation {
  isValid: boolean;
  violations: string[];
  recoveredState?: Partial<CameraSpec>;
}

/**
 * A plugin that manages the camera and provides camera control methods.
 * Enhanced with robust state management, error handling, and reliability features.
 */
export class CameraPlugin implements ISpaceGraphPlugin {
  readonly id = 'camera-plugin';
  readonly name = 'Camera Control Plugin';
  readonly version = '2.0.0';
  readonly description =
    'Provides advanced camera controls and management for SpaceGraph with enhanced reliability';

  private graph!: SpaceGraphCore;
  private threeCamera!: THREE.PerspectiveCamera;
  private activeKeys: Set<string> = new Set();
  private boundOnKeyDown!: (event: KeyboardEvent) => void;
  private boundOnKeyUp!: (event: KeyboardEvent) => void;
  private presetsManager!: CameraPresetsManager;
  private rotationConstraints: RotationConstraints = {};
  private rotationPivot: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private poolManager: ObjectPoolManager =
    ObjectPoolManager.getInstance();
  private isAnimating: boolean = false;
  private animationQueue: AnimationOperation[] = [];
  private currentAnimation: AnimationOperation | null = null;
  private zoomConstraints: { minDistance?: number; maxDistance?: number } = {};
  private isSmoothZoomEnabled: boolean = true;
  private smoothZoomFactor: number = 0.1;
  private isPathFollowing: boolean = false;
  private cameraShakeIntensity: number = 0;
  private cameraShakeDuration: number = 0;
  private cameraShakeStartTime: number = 0;
  private cameraConstraints: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    minZ?: number;
    maxZ?: number;
  } = {};
  private isInertiaEnabled: boolean = true;
  private inertiaFactor: number = 0.9;
  private cameraVelocity: THREE.Vector3 = new THREE.Vector3();
  private targetVelocity: THREE.Vector3 = new THREE.Vector3();
  private gestureState: TouchGestureState = {
    isActive: false,
    startTime: 0,
    lastUpdate: 0,
    touchCount: 0,
    initialDistance: 0,
    initialAngle: 0,
    lastDistance: 0,
    lastAngle: 0,
    accumulatedDelta: new THREE.Vector2(),
    isCorrupted: false,
    orientation: 0,
    checksum: '',
  };
  private touchStartTime: number = 0;
  private touchStartPositions: Map<number, { x: number; y: number }> =
    new Map();
  private cameraUtils!: CameraUtils;
  private logger: Logger = Logger.getInstance();
  private errorHandler: ErrorHandler = ErrorHandler.getInstance();
  private stateLock: boolean = false;
  private currentState: CameraState;
  private stateUpdateQueue: Partial<CameraSpec>[] = [];
  private lastOrientationChange: number = 0;
  private readonly ORIENTATION_CHANGE_THRESHOLD = 1000; // ms
  private readonly GESTURE_TIMEOUT = 5000; // ms
  private readonly MAX_ANIMATION_QUEUE_SIZE = 10;
  private readonly ANIMATION_TIMEOUT = 30000; // ms
  private readonly STATE_UPDATE_BATCH_SIZE = 5;

  constructor() {
    // Initialize camera state with validation
    this.currentState = {
      target: new THREE.Vector3(0, 0, 0),
      distance: 50,
      phi: Math.PI / 4,
      theta: Math.PI / 4,
      isValid: true,
      lastUpdate: Date.now(),
      version: 0,
    };
  }

  /**
   * Validate camera state for consistency and bounds
   */
  private validateCameraState(state: Partial<CameraSpec>): ConstraintValidation {
    const violations: string[] = [];
    const recoveredState: Partial<CameraSpec> = {};

    // Validate distance
    if (state.distance !== undefined) {
      if (typeof state.distance !== 'number' || !isFinite(state.distance)) {
        violations.push('Invalid distance value');
        recoveredState.distance = Math.max(1, Math.min(1000, this.currentState.distance));
      } else if (state.distance <= 0) {
        violations.push('Distance must be positive');
        recoveredState.distance = Math.max(1, this.currentState.distance);
      } else {
        // Apply zoom constraints
        if (this.zoomConstraints.minDistance !== undefined && state.distance < this.zoomConstraints.minDistance) {
          violations.push('Distance below minimum constraint');
          recoveredState.distance = this.zoomConstraints.minDistance;
        }
        if (this.zoomConstraints.maxDistance !== undefined && state.distance > this.zoomConstraints.maxDistance) {
          violations.push('Distance above maximum constraint');
          recoveredState.distance = this.zoomConstraints.maxDistance;
        }
      }
    }

    // Validate phi (vertical rotation)
    if (state.phi !== undefined) {
      if (typeof state.phi !== 'number' || !isFinite(state.phi)) {
        violations.push('Invalid phi value');
        recoveredState.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.currentState.phi));
      } else {
        if (this.rotationConstraints.minPhi !== undefined && state.phi < this.rotationConstraints.minPhi) {
          violations.push('Phi below minimum constraint');
          recoveredState.phi = this.rotationConstraints.minPhi;
        }
        if (this.rotationConstraints.maxPhi !== undefined && state.phi > this.rotationConstraints.maxPhi) {
          violations.push('Phi above maximum constraint');
          recoveredState.phi = this.rotationConstraints.maxPhi;
        }
      }
    }

    // Validate theta (horizontal rotation)
    if (state.theta !== undefined) {
      if (typeof state.theta !== 'number' || !isFinite(state.theta)) {
        violations.push('Invalid theta value');
        recoveredState.theta = this.currentState.theta;
      } else {
        if (this.rotationConstraints.minTheta !== undefined && state.theta < this.rotationConstraints.minTheta) {
          violations.push('Theta below minimum constraint');
          recoveredState.theta = this.rotationConstraints.minTheta;
        }
        if (this.rotationConstraints.maxTheta !== undefined && state.theta > this.rotationConstraints.maxTheta) {
          violations.push('Theta above maximum constraint');
          recoveredState.theta = this.rotationConstraints.maxTheta;
        }
      }
    }

    // Validate target position
    if (state.target !== undefined) {
      if (!(state.target instanceof THREE.Vector3)) {
        violations.push('Target must be a Vector3 instance');
        recoveredState.target = this.currentState.target.clone();
      } else {
        // Apply camera constraints
        if (this.cameraConstraints.minX !== undefined && state.target.x < this.cameraConstraints.minX) {
          violations.push('Target X below minimum constraint');
          recoveredState.target = recoveredState.target || state.target.clone();
          recoveredState.target.x = this.cameraConstraints.minX;
        }
        if (this.cameraConstraints.maxX !== undefined && state.target.x > this.cameraConstraints.maxX) {
          violations.push('Target X above maximum constraint');
          recoveredState.target = recoveredState.target || state.target.clone();
          recoveredState.target.x = this.cameraConstraints.maxX;
        }
        if (this.cameraConstraints.minY !== undefined && state.target.y < this.cameraConstraints.minY) {
          violations.push('Target Y below minimum constraint');
          recoveredState.target = recoveredState.target || state.target.clone();
          recoveredState.target.y = this.cameraConstraints.minY;
        }
        if (this.cameraConstraints.maxY !== undefined && state.target.y > this.cameraConstraints.maxY) {
          violations.push('Target Y above maximum constraint');
          recoveredState.target = recoveredState.target || state.target.clone();
          recoveredState.target.y = this.cameraConstraints.maxY;
        }
        if (this.cameraConstraints.minZ !== undefined && state.target.z < this.cameraConstraints.minZ) {
          violations.push('Target Z below minimum constraint');
          recoveredState.target = recoveredState.target || state.target.clone();
          recoveredState.target.z = this.cameraConstraints.minZ;
        }
        if (this.cameraConstraints.maxZ !== undefined && state.target.z > this.cameraConstraints.maxZ) {
          violations.push('Target Z above maximum constraint');
          recoveredState.target = recoveredState.target || state.target.clone();
          recoveredState.target.z = this.cameraConstraints.maxZ;
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      recoveredState: Object.keys(recoveredState).length > 0 ? recoveredState : undefined,
    };
  }

  /**
   * Atomic state update with validation and recovery
   */
  private updateCameraState(newState: Partial<CameraSpec>, source: string = 'unknown'): boolean {
    if (this.stateLock) {
      this.logger.warn('CameraPlugin', 'State update blocked by lock', { source });
      return false;
    }

    this.stateLock = true;

    try {
      // Validate the new state
      const validation = this.validateCameraState(newState);

      if (!validation.isValid) {
        this.logger.warn('CameraPlugin', 'State validation failed', {
          source,
          violations: validation.violations,
          originalState: newState,
        });

        // Use recovered state if available, otherwise abort
        if (validation.recoveredState) {
          newState = { ...newState, ...validation.recoveredState };
          this.logger.info('CameraPlugin', 'Using recovered state', {
            source,
            recoveredState: validation.recoveredState,
          });
        } else {
          this.stateLock = false;
          return false;
        }
      }

      // Sanitize and apply state atomically
      const sanitizedState = this.sanitizeCameraState(newState);

      // Update internal state
      if (sanitizedState.target) {
        this.currentState.target.copy(sanitizedState.target);
      }
      if (sanitizedState.distance !== undefined) {
        this.currentState.distance = sanitizedState.distance;
      }
      if (sanitizedState.phi !== undefined) {
        this.currentState.phi = sanitizedState.phi;
      }
      if (sanitizedState.theta !== undefined) {
        this.currentState.theta = sanitizedState.theta;
      }

      // Update version and timestamp
      this.currentState.version++;
      this.currentState.lastUpdate = Date.now();
      this.currentState.isValid = true;

      this.logger.debug('CameraPlugin', 'State updated successfully', {
        source,
        version: this.currentState.version,
        state: sanitizedState,
      });

      return true;
    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'State update failed', error, { source, newState });
      this.currentState.isValid = false;
      this.stateLock = false;
      return false;
    } finally {
      this.stateLock = false;
    }
  }

  /**
   * Sanitize camera state input
   */
  private sanitizeCameraState(state: Partial<CameraSpec>): Partial<CameraSpec> {
    const sanitized: Partial<CameraSpec> = {};

    if (state.target !== undefined) {
      if (state.target instanceof THREE.Vector3) {
        sanitized.target = state.target.clone();
      } else if (typeof state.target === 'object' && state.target !== null) {
        sanitized.target = new THREE.Vector3(
          typeof state.target.x === 'number' ? state.target.x : this.currentState.target.x,
          typeof state.target.y === 'number' ? state.target.y : this.currentState.target.y,
          typeof state.target.z === 'number' ? state.target.z : this.currentState.target.z
        );
      }
    }

    if (state.distance !== undefined) {
      sanitized.distance = typeof state.distance === 'number' && isFinite(state.distance)
        ? Math.max(0.1, state.distance)
        : this.currentState.distance;
    }

    if (state.phi !== undefined) {
      sanitized.phi = typeof state.phi === 'number' && isFinite(state.phi)
        ? Math.max(0.01, Math.min(Math.PI - 0.01, state.phi))
        : this.currentState.phi;
    }

    if (state.theta !== undefined) {
      sanitized.theta = typeof state.theta === 'number' && isFinite(state.theta)
        ? state.theta
        : this.currentState.theta;
    }

    return sanitized;
  }

  /**
   * Generate gesture state checksum for corruption detection
   */
  private generateGestureChecksum(): string {
    const data = `${this.gestureState.isActive}-${this.gestureState.touchCount}-${this.gestureState.lastDistance}-${this.gestureState.lastAngle}-${this.gestureState.lastUpdate}`;
    return btoa(data).slice(0, 10);
  }

  /**
   * Validate gesture state for corruption
   */
  private validateGestureState(): boolean {
    const expectedChecksum = this.generateGestureChecksum();

    if (this.gestureState.checksum !== expectedChecksum) {
      this.logger.warn('CameraPlugin', 'Gesture state corruption detected', {
        expected: expectedChecksum,
        actual: this.gestureState.checksum,
      });
      this.gestureState.isCorrupted = true;
      return false;
    }

    // Check for stale gesture state
    if (this.gestureState.isActive && Date.now() - this.gestureState.lastUpdate > this.GESTURE_TIMEOUT) {
      this.logger.warn('CameraPlugin', 'Stale gesture state detected');
      this.resetGestureState();
      return false;
    }

    return true;
  }

  /**
   * Reset gesture state safely
   */
  private resetGestureState(): void {
    this.gestureState = {
      isActive: false,
      startTime: 0,
      lastUpdate: 0,
      touchCount: 0,
      initialDistance: 0,
      initialAngle: 0,
      lastDistance: 0,
      lastAngle: 0,
      accumulatedDelta: new THREE.Vector2(),
      isCorrupted: false,
      orientation: 0,
      checksum: '',
    };
    this.touchStartPositions.clear();
  }

  /**
   * Handle device orientation changes
   */
  private handleOrientationChange(): void {
    const now = Date.now();
    if (now - this.lastOrientationChange < this.ORIENTATION_CHANGE_THRESHOLD) {
      return; // Debounce orientation changes
    }

    this.lastOrientationChange = now;
    this.gestureState.orientation = window.orientation || 0;

    // Reset gesture state on orientation change if active
    if (this.gestureState.isActive) {
      this.logger.info('CameraPlugin', 'Resetting gesture state due to orientation change');
      this.resetGestureState();
    }
  }

  /**
   * Enhanced animation queue management with cleanup
   */
  private processAnimationQueue(): void {
    if (this.animationQueue.length === 0 || this.currentAnimation || this.isAnimating) {
      return;
    }

    // Sort by priority (higher priority first)
    this.animationQueue.sort((a, b) => b.priority - a.priority);

    // Limit queue size to prevent memory issues
    if (this.animationQueue.length > this.MAX_ANIMATION_QUEUE_SIZE) {
      const removedCount = this.animationQueue.length - this.MAX_ANIMATION_QUEUE_SIZE;
      const removedAnimations = this.animationQueue.splice(this.MAX_ANIMATION_QUEUE_SIZE);

      this.logger.warn('CameraPlugin', `Animation queue overflow, removed ${removedCount} animations`);

      // Clean up removed animations
      removedAnimations.forEach(anim => {
        if (anim.onError) {
          anim.onError(new Error('Animation queue overflow'));
        }
      });
    }

    const nextAnimation = this.animationQueue.shift();
    if (nextAnimation) {
      this.executeAnimation(nextAnimation);
    }
  }

  /**
   * Execute animation with enhanced error handling and timeout
   */
  private executeAnimation(animation: AnimationOperation): void {
    this.currentAnimation = animation;
    this.isAnimating = true;

    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = animation.options.retryCount || 0;
    const timeout = animation.options.timeout || this.ANIMATION_TIMEOUT;

    const execute = () => {
      try {
        // Check for timeout
        if (Date.now() - startTime > timeout) {
          throw new Error(`Animation timeout after ${timeout}ms`);
        }

        // Validate target state if requested
        if (animation.options.validateTarget) {
          const validation = this.validateCameraState(animation.targetState);
          if (!validation.isValid) {
            throw new Error(`Invalid animation target: ${validation.violations.join(', ')}`);
          }
        }

        const fromState = {
          target: this.currentState.target.clone(),
          distance: this.currentState.distance,
          phi: this.currentState.phi,
          theta: this.currentState.theta,
        };

        // Animation start event
        this.graph.events.emit('camera:animation:start');

        // Use popmotion for animation with enhanced error handling
        const animationControl = animate({
          from: fromState,
          to: animation.targetState,
          duration: animation.options.duration || 1000,
          ease: animation.options.easing as any,
          onUpdate: (latest: any) => {
            try {
              // Remove progress property before updating state
              const { progress, ...cameraState } = latest;

              // Atomic state update
              if (!this.updateCameraState(cameraState, `animation-${animation.id}`)) {
                throw new Error('Failed to update camera state during animation');
              }

              if (animation.options.onUpdate) {
                animation.options.onUpdate(progress || 0);
              }
            } catch (error) {
              this.errorHandler.handleError('CameraPlugin', 'Animation update failed', error, {
                animationId: animation.id,
                progress: latest.progress,
              });
              animationControl.stop();
              throw error;
            }
          },
          onComplete: () => {
            try {
              this.isAnimating = false;
              this.currentAnimation = null;

              // Animation end event
              this.graph.events.emit('camera:animation:end');

              if (animation.onComplete) {
                animation.onComplete();
              }

              // Process next animation in queue
              setTimeout(() => this.processAnimationQueue(), 0);
            } catch (error) {
              this.errorHandler.handleError('CameraPlugin', 'Animation completion failed', error, {
                animationId: animation.id,
              });
            }
          },
        });

      } catch (error) {
        this.isAnimating = false;
        this.currentAnimation = null;

        this.errorHandler.handleError('CameraPlugin', 'Animation execution failed', error, {
          animationId: animation.id,
          retryCount,
        });

        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++;
          this.logger.info('CameraPlugin', `Retrying animation ${animation.id}, attempt ${retryCount + 1}`);
          setTimeout(execute, 100 * retryCount); // Exponential backoff
        } else {
          if (animation.onError) {
            animation.onError(error instanceof Error ? error : new Error(String(error)));
          }

          // Process next animation even on failure
          setTimeout(() => this.processAnimationQueue(), 0);
        }
      }
    };

    execute();
  }

  /**
   * Enhanced touch gesture handling with corruption detection
   */
  private setupEnhancedTouchGestures(): void {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => this.handleOrientationChange());

    const handleTouchStart = (event: TouchEvent) => {
      try {
        // Validate gesture state before starting
        if (!this.validateGestureState()) {
          this.resetGestureState();
        }

        this.touchStartTime = Date.now();
        this.gestureState.startTime = this.touchStartTime;
        this.gestureState.lastUpdate = this.touchStartTime;
        this.gestureState.touchCount = event.touches.length;
        this.gestureState.orientation = window.orientation || 0;
        this.gestureState.accumulatedDelta.set(0, 0);
        this.gestureState.isCorrupted = false;
        this.gestureState.checksum = this.generateGestureChecksum();

        if (event.touches.length === 2) {
          // Pinch gesture start
          const touch1 = event.touches[0];
          const touch2 = event.touches[1];

          // Validate touch positions
          if (!this.isValidTouchPosition(touch1) || !this.isValidTouchPosition(touch2)) {
            this.logger.warn('CameraPlugin', 'Invalid touch positions detected');
            return;
          }

          this.gestureState.isActive = true;
          this.gestureState.initialDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          );

          this.gestureState.initialAngle = Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
          );

          this.gestureState.lastDistance = this.gestureState.initialDistance;
          this.gestureState.lastAngle = this.gestureState.initialAngle;
          this.gestureState.checksum = this.generateGestureChecksum();
        }

        // Store touch positions for multi-touch validation
        this.touchStartPositions.clear();
        for (let i = 0; i < event.touches.length; i++) {
          const touch = event.touches[i];
          this.touchStartPositions.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
        }

      } catch (error) {
        this.errorHandler.handleError('CameraPlugin', 'Touch start handling failed', error);
        this.resetGestureState();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      try {
        // Validate gesture state
        if (!this.validateGestureState() || !this.gestureState.isActive) {
          return;
        }

        this.gestureState.lastUpdate = Date.now();
        this.gestureState.touchCount = event.touches.length;

        if (event.touches.length === 2) {
          event.preventDefault();

          const touch1 = event.touches[0];
          const touch2 = event.touches[1];

          // Validate touch positions and detect corruption
          if (!this.isValidTouchPosition(touch1) || !this.isValidTouchPosition(touch2)) {
            this.logger.warn('CameraPlugin', 'Invalid touch positions during gesture');
            this.resetGestureState();
            return;
          }

          const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          );

          const currentAngle = Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
          );

          // Validate distance and angle changes for sanity
          if (!this.isValidGestureChange(currentDistance, currentAngle)) {
            this.logger.warn('CameraPlugin', 'Invalid gesture change detected');
            this.resetGestureState();
            return;
          }

          // Handle pinch zoom with enhanced bounds checking
          const distanceDelta = currentDistance - this.gestureState.initialDistance;
          const zoomFactor = distanceDelta * 0.01;

          if (Math.abs(zoomFactor) > 0.001) {
            this.handleEnhancedSmoothZoom(
              zoomFactor > 0 ? 'out' : 'in',
              Math.abs(zoomFactor),
              `gesture-${Date.now()}`
            );
          }

          // Handle rotation with constraint validation
          const angleDelta = currentAngle - this.gestureState.initialAngle;
          if (Math.abs(angleDelta) > 0.01) {
            const newTheta = this.currentState.theta + angleDelta * 0.5;
            const thetaUpdate = { theta: newTheta };

            if (this.updateCameraState(thetaUpdate, 'gesture-rotation')) {
              this.gestureState.lastAngle = currentAngle;
              this.gestureState.checksum = this.generateGestureChecksum();
            }
          }

          this.gestureState.lastDistance = currentDistance;
          this.gestureState.checksum = this.generateGestureChecksum();
        }

      } catch (error) {
        this.errorHandler.handleError('CameraPlugin', 'Touch move handling failed', error);
        this.resetGestureState();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      try {
        const touchDuration = Date.now() - this.touchStartTime;

        // Handle tap-to-focus gesture with validation
        if (
          event.changedTouches.length === 1 &&
          touchDuration < 300 &&
          !this.gestureState.isActive
        ) {
          const touch = event.changedTouches[0];
          if (this.isValidTouchPosition(touch)) {
            this.handleEnhancedTapToFocus(touch.clientX, touch.clientY);
          }
        }

        // Clean up gesture state
        if (event.touches.length === 0) {
          this.gestureState.isActive = false;
          this.touchStartPositions.clear();
        } else {
          // Remove ended touches from tracking
          for (let i = 0; i < event.changedTouches.length; i++) {
            this.touchStartPositions.delete(event.changedTouches[i].identifier);
          }
        }

        this.gestureState.checksum = this.generateGestureChecksum();

      } catch (error) {
        this.errorHandler.handleError('CameraPlugin', 'Touch end handling failed', error);
        this.resetGestureState();
      }
    };

    // Add touch event listeners with error handling
    try {
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'Failed to setup touch listeners', error);
    }
  }

  /**
   * Validate touch position for bounds and sanity
   */
  private isValidTouchPosition(touch: Touch): boolean {
    return (
      touch.clientX >= 0 &&
      touch.clientY >= 0 &&
      touch.clientX <= window.innerWidth &&
      touch.clientY <= window.innerHeight &&
      isFinite(touch.clientX) &&
      isFinite(touch.clientY)
    );
  }

  /**
   * Validate gesture change for sanity and corruption detection
   */
  private isValidGestureChange(distance: number, angle: number): boolean {
    // Check for reasonable distance changes
    const distanceChange = Math.abs(distance - this.gestureState.lastDistance);
    if (distanceChange > 1000) { // Arbitrary threshold for sanity
      return false;
    }

    // Check for reasonable angle changes
    const angleChange = Math.abs(angle - this.gestureState.lastAngle);
    if (angleChange > Math.PI) { // More than 180 degrees is suspicious
      return false;
    }

    return true;
  }

  /**
   * Enhanced smooth zoom with bounds checking and error handling
   */
  private handleEnhancedSmoothZoom(direction: 'in' | 'out', speed: number, source: string): void {
    if (!this.isSmoothZoomEnabled) return;

    try {
      // Validate inputs
      if (!isFinite(speed) || speed < 0) {
        this.logger.warn('CameraPlugin', 'Invalid zoom speed', { direction, speed, source });
        return;
      }

      const currentDistance = this.currentState.distance;
      const zoomFactor = direction === 'in' ? 1 - speed * this.smoothZoomFactor : 1 + speed * this.smoothZoomFactor;
      let newDistance = currentDistance * zoomFactor;

      // Apply enhanced bounds checking
      const minDistance = this.zoomConstraints.minDistance || 1;
      const maxDistance = this.zoomConstraints.maxDistance || 1000;

      if (newDistance < minDistance || newDistance > maxDistance) {
        this.logger.debug('CameraPlugin', 'Zoom constrained', {
          source,
          originalDistance: newDistance,
          constrainedDistance: Math.max(minDistance, Math.min(maxDistance, newDistance)),
        });
        newDistance = Math.max(minDistance, Math.min(maxDistance, newDistance));
      }

      // Atomic state update
      if (this.updateCameraState({ distance: newDistance }, source)) {
        this.logger.debug('CameraPlugin', 'Smooth zoom applied', {
          source,
          direction,
          speed,
          fromDistance: currentDistance,
          toDistance: newDistance,
        });
      }

    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'Enhanced smooth zoom failed', error, {
        direction,
        speed,
        source,
      });
    }
  }

  /**
   * Enhanced tap-to-focus with error handling and validation
   */
  private handleEnhancedTapToFocus(clientX: number, clientY: number): void {
    try {
      // Validate input coordinates
      if (!isFinite(clientX) || !isFinite(clientY) || clientX < 0 || clientY < 0) {
        this.logger.warn('CameraPlugin', 'Invalid tap coordinates', { clientX, clientY });
        return;
      }

      const screenPos = new THREE.Vector2(clientX, clientY);

      // Use CameraUtils for raycasting with error handling
      const nodeRenderer = this.graph.render.getNodeRenderer();
      const objects = nodeRenderer ? nodeRenderer.getRaycastableObjects() : [];

      let intersects: THREE.Intersection[] = [];
      try {
        intersects = this.cameraUtils.raycastFromScreen(screenPos, objects);
      } catch (error) {
        this.errorHandler.handleError('CameraPlugin', 'Raycasting failed', error, { clientX, clientY });
        return;
      }

      if (intersects.length > 0) {
        // Frame the clicked object
        const intersection = intersects[0];
        const nodeId = nodeRenderer?.getNodeIdFromIntersection(intersection);

        if (nodeId) {
          const node = this.graph.dataManager.getNode(nodeId);
          if (node && node.position) {
            this.flyToEnhanced(
              {
                target: node.position,
                distance: 20,
                phi: this.currentState.phi,
                theta: this.currentState.theta,
              },
              {
                duration: 800,
                easing: AnimationCurves.easeOut.easing,
                priority: 5, // Higher priority for user interactions
              }
            );
          }
        }
      } else {
        // If no object clicked, perform autozoom to fit all elements
        this.autoZoomEnhanced({
          duration: 800,
          strategy: 'optimal',
          focusMode: 'all',
          priority: 3,
        });
      }

    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'Enhanced tap-to-focus failed', error, {
        clientX,
        clientY,
      });
    }
  }

  /**
   * Enhanced flyTo with improved reliability and error handling
   */
  public flyToEnhanced(
    targetState: Partial<SpecUpdate['camera']>,
    options: AnimationOptions = { duration: 1000, interruptible: true, priority: 1 }
  ): void {
    try {
      // Generate unique animation ID
      const animationId = `flyto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Validate options
      const validatedOptions: AnimationOptions = {
        duration: Math.max(100, options.duration || 1000),
        easing: options.easing || AnimationCurves.easeInOut.easing,
        interruptible: options.interruptible !== false,
        priority: Math.max(0, Math.min(10, options.priority || 1)),
        retryCount: options.retryCount || 0,
        timeout: options.timeout || this.ANIMATION_TIMEOUT,
        validateTarget: options.validateTarget !== false,
        onComplete: options.onComplete,
        onError: options.onError,
        onUpdate: options.onUpdate,
      };

      const animationOperation: AnimationOperation = {
        id: animationId,
        targetState: this.sanitizeCameraState(targetState) as Partial<CameraSpec>,
        options: validatedOptions,
        priority: validatedOptions.priority!,
        createdAt: Date.now(),
        onComplete: options.onComplete,
        onError: options.onError,
      };

      // Handle animation interruption
      if (this.isAnimating && !options.interruptible) {
        // Queue the animation
        this.animationQueue.push(animationOperation);
        this.logger.debug('CameraPlugin', 'Animation queued', { animationId });
      } else if (this.isAnimating && options.interruptible) {
        // Cancel current animation and start new one
        if (this.currentAnimation && this.currentAnimation.onError) {
          this.currentAnimation.onError(new Error('Interrupted by higher priority animation'));
        }
        this.animationQueue.unshift(animationOperation);
        this.processAnimationQueue();
      } else {
        // No current animation, start immediately
        this.executeAnimation(animationOperation);
      }

    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'Enhanced flyTo failed', error, {
        targetState,
        options,
      });
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Enhanced autozoom with reliability improvements
   */
  public autoZoomEnhanced(
    options: {
      duration?: number;
      padding?: number;
      easing?: (t: number) => number | string;
      includeEdges?: boolean;
      strategy?: 'tight' | 'loose' | 'optimal' | 'smart';
      focusMode?: 'all' | 'center' | 'weighted' | 'selection';
      aspectRatio?: number;
      perspectiveCorrection?: boolean;
      distributionAware?: boolean;
      animate?: boolean;
      onComplete?: () => void;
      onError?: (error: Error) => void;
      priority?: number;
    } = {
      duration: 1000,
      padding: 1.5,
      includeEdges: true,
      strategy: 'smart',
      focusMode: 'all',
      perspectiveCorrection: true,
      distributionAware: true,
      animate: true,
      priority: 2,
    }
  ): void {
    try {
      const nodes = this.graph.state.data.nodes;
      if (nodes.length === 0) {
        if (options.onError) {
          options.onError(new Error('No nodes available for autozoom'));
        }
        return;
      }

      // Validate options
      const validatedOptions = {
        duration: Math.max(100, options.duration || 1000),
        padding: Math.max(0.1, options.padding || 1.5),
        strategy: options.strategy || 'smart',
        focusMode: options.focusMode || 'all',
        priority: Math.max(0, Math.min(10, options.priority || 2)),
        animate: options.animate !== false,
      };

      // Calculate elements with error handling
      let elements: { position: THREE.Vector3 }[] = [];

      try {
        elements = nodes.map((node) => {
          if (!node.position) {
            throw new Error(`Node ${node.id} has no position`);
          }

          return {
            position: this.poolManager
              .getVector3()
              .set(node.position.x, node.position.y, node.position.z),
          };
        });
      } catch (error) {
        this.errorHandler.handleError('CameraPlugin', 'Failed to process nodes for autozoom', error);
        if (options.onError) {
          options.onError(error instanceof Error ? error : new Error(String(error)));
        }
        return;
      }

      // Include edges if requested
      if (options.includeEdges) {
        try {
          const edges = this.graph.state.data.edges;
          for (const edge of edges) {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (sourceNode?.position && targetNode?.position) {
              elements.push({
                position: this.poolManager
                  .getVector3()
                  .set(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
              });
              elements.push({
                position: this.poolManager
                  .getVector3()
                  .set(targetNode.position.x, targetNode.position.y, targetNode.position.z),
              });
            }
          }
        } catch (error) {
          this.errorHandler.handleError('CameraPlugin', 'Failed to process edges for autozoom', error);
          // Continue without edges rather than failing completely
        }
      }

      // Use enhanced framing with error handling
      if (validatedOptions.animate) {
        this.enhancedFrameReliable(elements, {
          duration: validatedOptions.duration,
          padding: validatedOptions.padding,
          easing: options.easing,
          strategy: validatedOptions.strategy as any,
          perspectiveCorrection: options.perspectiveCorrection,
          distributionAware: options.distributionAware,
          onComplete: options.onComplete,
          onError: options.onError,
          priority: validatedOptions.priority,
        });
      } else {
        // Calculate frame without animation
        try {
          const frameResult = this.calculateFrameResult(elements, validatedOptions);
          if (this.updateCameraState(frameResult, 'autozoom-immediate')) {
            if (options.onComplete) {
              options.onComplete();
            }
          }
        } catch (error) {
          this.errorHandler.handleError('CameraPlugin', 'Immediate framing failed', error);
          if (options.onError) {
            options.onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }

      // Clean up pooled objects
      try {
        elements.forEach(el => {
          this.poolManager.releaseVector3(el.position);
        });
      } catch (error) {
        this.errorHandler.handleWarning('CameraPlugin', 'Failed to cleanup pooled objects', { error });
      }

    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'Enhanced autozoom failed', error, options);
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Calculate frame result for immediate framing
   */
  private calculateFrameResult(
    elements: { position: THREE.Vector3 }[],
    options: any
  ): Partial<CameraSpec> {
    const box = new THREE.Box3();
    for (const el of elements) {
      box.expandByPoint(el.position);
    }

    const center = this.poolManager.getVector3();
    box.getCenter(center);

    const size = this.poolManager.getVector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.threeCamera.fov * (Math.PI / 180);

    let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov * 2));
    cameraZ *= options.padding || 1.5;

    this.poolManager.releaseVector3(center);
    this.poolManager.releaseVector3(size);

    return {
      target: { x: center.x, y: center.y, z: center.z },
      distance: cameraZ,
    };
  }

  /**
   * Enhanced frame with reliability improvements
   */
  public enhancedFrameReliable(
    elements: { position: THREE.Vector3 }[],
    options: {
      duration: number;
      padding?: number;
      aspectRatio?: number;
      easing?: (t: number) => number | string;
      strategy?: 'tight' | 'loose' | 'optimal';
      perspectiveCorrection?: boolean;
      distributionAware?: boolean;
      onComplete?: () => void;
      onError?: (error: Error) => void;
      priority?: number;
    } = {
      duration: 1000,
      padding: 1.5,
      strategy: 'optimal',
      perspectiveCorrection: true,
      distributionAware: false,
      priority: 2,
    }
  ): void {
    try {
      if (elements.length === 0) {
        if (options.onError) {
          options.onError(new Error('No elements to frame'));
        }
        return;
      }

      // Validate elements
      const validElements = elements.filter(el => {
        if (!(el.position instanceof THREE.Vector3)) {
          this.logger.warn('CameraPlugin', 'Invalid element position', el);
          return false;
        }
        return isFinite(el.position.x) && isFinite(el.position.y) && isFinite(el.position.z);
      });

      if (validElements.length === 0) {
        if (options.onError) {
          options.onError(new Error('No valid elements to frame'));
        }
        return;
      }

      const box = new THREE.Box3();
      for (const el of validElements) {
        box.expandByPoint(el.position);
      }

      const center = this.poolManager.getVector3();
      box.getCenter(center);

      const size = this.poolManager.getVector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = this.threeCamera.fov * (Math.PI / 180);

      let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov * 2));

      // Apply strategy multiplier with validation
      switch (options.strategy) {
        case 'tight':
          cameraZ *= 1.2;
          break;
        case 'loose':
          cameraZ *= 2.0;
          break;
        case 'optimal':
        default:
          cameraZ *= 1.5;
          break;
      }

      // Apply padding with validation
      const padding = Math.max(0.1, options.padding || 1.5);
      cameraZ *= padding;

      // Apply aspect ratio correction if provided
      if (options.aspectRatio && isFinite(options.aspectRatio)) {
        const currentAspect = this.threeCamera.aspect;
        cameraZ *= Math.max(options.aspectRatio / currentAspect, 1);
      }

      // Apply perspective correction if enabled
      if (options.perspectiveCorrection) {
        const angleFactor = Math.abs(Math.sin(this.currentState.phi));
        cameraZ *= Math.max(0.5, angleFactor);
      }

      // Distribution-aware framing with validation
      if (options.distributionAware && validElements.length > 1) {
        let sumSquaredDistances = 0;
        for (const el of validElements) {
          const distance = el.position.distanceTo(center);
          if (isFinite(distance)) {
            sumSquaredDistances += distance * distance;
          }
        }
        const variance = sumSquaredDistances / validElements.length;
        const stdDev = Math.sqrt(variance);

        if (isFinite(stdDev)) {
          const spreadFactor = 1 + stdDev / (center.length() || 1);
          cameraZ = cameraZ * Math.min(spreadFactor, 3.0);
        }
      }

      const target = {
        target: { x: center.x, y: center.y, z: center.z },
        distance: cameraZ,
      };

      // Clean up pooled objects
      this.poolManager.releaseVector3(center);
      this.poolManager.releaseVector3(size);

      // Emit framing start event
      this.graph.events.emit('camera:framing:start');

      this.flyToEnhanced(target, {
        ...options,
        onComplete: () => {
          if (options.onComplete) {
            options.onComplete();
          }
          this.graph.events.emit('camera:framing:end');
        },
        onError: (error) => {
          if (options.onError) {
            options.onError(error);
          }
          this.graph.events.emit('camera:animation:error');
        },
      });

    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'Enhanced frame failed', error, options);
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Enhanced resource cleanup on disposal
   */
  public dispose(): void {
    try {
      // Cancel all animations and clear queue
      this.isAnimating = false;
      if (this.currentAnimation && this.currentAnimation.onError) {
        this.currentAnimation.onError(new Error('Plugin disposed'));
      }
      this.currentAnimation = null;
      this.animationQueue.length = 0;

      // Reset gesture state
      this.resetGestureState();

      // Remove event listeners with error handling
      if (this.boundOnKeyDown) {
        try {
          window.removeEventListener('keydown', this.boundOnKeyDown);
        } catch (error) {
          this.errorHandler.handleWarning('CameraPlugin', 'Failed to remove keydown listener', { error });
        }
      }
      if (this.boundOnKeyUp) {
        try {
          window.removeEventListener('keyup', this.boundOnKeyUp);
        } catch (error) {
          this.errorHandler.handleWarning('CameraPlugin', 'Failed to remove keyup listener', { error });
        }
      }

      // Clear touch positions
      this.touchStartPositions.clear();

      // Reset state
      this.currentState.isValid = false;
      this.stateLock = false;
      this.stateUpdateQueue.length = 0;

      this.logger.info('CameraPlugin', 'Plugin disposed successfully');

    } catch (error) {
      this.errorHandler.handleError('CameraPlugin', 'Disposal failed', error);
    }
  }

  public init(graph: SpaceGraphCore): void {
    this.graph = graph;
    this.threeCamera = graph.render.getCamera();
    this.presetsManager = new CameraPresetsManager(graph);
    this.cameraUtils = new CameraUtils(
      this.threeCamera,
      graph.render.getScene()
    );
    this.logger.setGraph(graph);
    this.syncCameraToState();
    this.initKeyboardControls();
    this.setupAutoFrameWatcher();
    this.setupPresetCommands();
    this.setupEnhancedTouchGestures(); // Use enhanced touch gestures
    this.setupInertiaSystem();
  }

  /**
   * Enhanced flyTo method (replaces original)
   */
  public flyTo(
    targetState: Partial<SpecUpdate['camera']>,
    options: {
      duration: number;
      easing?: (t: number) => number | string;
      onUpdate?: (progress: number) => void;
      onComplete?: () => void;
      interruptible?: boolean;
    } = { duration: 1000, interruptible: true }
  ) {
    // Use enhanced flyTo for better reliability
    this.flyToEnhanced(targetState, {
      duration: options.duration,
      easing: options.easing,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      interruptible: options.interruptible,
      priority: 1,
    });
  }

  /**
   * Enhanced autoZoom method (replaces original)
   */
  public autoZoom(
    options: {
      duration?: number;
      padding?: number;
      easing?: (t: number) => number | string;
      includeEdges?: boolean;
      strategy?: 'tight' | 'loose' | 'optimal' | 'smart';
      focusMode?: 'all' | 'center' | 'weighted' | 'selection';
      aspectRatio?: number;
      perspectiveCorrection?: boolean;
      distributionAware?: boolean;
      animate?: boolean;
      onComplete?: () => void;
    } = {
      duration: 1000,
      padding: 1.5,
      includeEdges: true,
      strategy: 'smart',
      focusMode: 'all',
      perspectiveCorrection: true,
      distributionAware: true,
      animate: true,
    }
  ): void {
    // Use enhanced autoZoom for better reliability
    this.autoZoomEnhanced(options);
  }

  /**
   * Enhanced frame method (replaces original)
   */
  public frame(
    elements: { position: THREE.Vector3 }[],
    options: {
      duration: number;
      easing?: (t: number) => number;
      padding?: number;
      strategy?: 'tight' | 'loose' | 'optimal';
    } = { duration: 1000, padding: 1.5, strategy: 'optimal' }
  ) {
    // Use enhanced frame for better reliability
    this.enhancedFrameReliable(elements, options);
  }

  /**
   * Enhanced handleSmoothZoom method (replaces original)
   */
  private handleSmoothZoom(direction: 'in' | 'out', speed: number = 0.1): void {
    this.handleEnhancedSmoothZoom(direction, speed, 'keyboard-zoom');
  }

  /**
   * Enhanced handleTapToFocus method (replaces original)
   */
  private handleTapToFocus(clientX: number, clientY: number): void {
    this.handleEnhancedTapToFocus(clientX, clientY);
  }

  /**
   * Sets camera constraints to limit movement within bounds
   * @param constraints - The constraints to apply
   */
  public setCameraConstraints(constraints: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    minZ?: number;
    maxZ?: number;
  }): void {
    // Validate constraints
    const validatedConstraints: typeof constraints = {};

    if (constraints.minX !== undefined && isFinite(constraints.minX)) {
      validatedConstraints.minX = constraints.minX;
    }
    if (constraints.maxX !== undefined && isFinite(constraints.maxX)) {
      validatedConstraints.maxX = constraints.maxX;
    }
    if (constraints.minY !== undefined && isFinite(constraints.minY)) {
      validatedConstraints.minY = constraints.minY;
    }
    if (constraints.maxY !== undefined && isFinite(constraints.maxY)) {
      validatedConstraints.maxY = constraints.maxY;
    }
    if (constraints.minZ !== undefined && isFinite(constraints.minZ)) {
      validatedConstraints.minZ = constraints.minZ;
    }
    if (constraints.maxZ !== undefined && isFinite(constraints.maxZ)) {
      validatedConstraints.maxZ = constraints.maxZ;
    }

    this.cameraConstraints = { ...this.cameraConstraints, ...validatedConstraints };

    // Apply constraints to current state if needed
    const currentState = this.currentState;
    let updated = false;
    const newState: Partial<CameraSpec> = {};

    if (this.cameraConstraints.minX !== undefined && currentState.target.x < this.cameraConstraints.minX) {
      newState.target = newState.target || currentState.target.clone();
      newState.target.x = this.cameraConstraints.minX;
      updated = true;
    }
    if (this.cameraConstraints.maxX !== undefined && currentState.target.x > this.cameraConstraints.maxX) {
      newState.target = newState.target || currentState.target.clone();
      newState.target.x = this.cameraConstraints.maxX;
      updated = true;
    }
    if (this.cameraConstraints.minY !== undefined && currentState.target.y < this.cameraConstraints.minY) {
      newState.target = newState.target || currentState.target.clone();
      newState.target.y = this.cameraConstraints.minY;
      updated = true;
    }
    if (this.cameraConstraints.maxY !== undefined && currentState.target.y > this.cameraConstraints.maxY) {
      newState.target = newState.target || currentState.target.clone();
      newState.target.y = this.cameraConstraints.maxY;
      updated = true;
    }
    if (this.cameraConstraints.minZ !== undefined && currentState.target.z < this.cameraConstraints.minZ) {
      newState.target = newState.target || currentState.target.clone();
      newState.target.z = this.cameraConstraints.minZ;
      updated = true;
    }
    if (this.cameraConstraints.maxZ !== undefined && currentState.target.z > this.cameraConstraints.maxZ) {
      newState.target = newState.target || currentState.target.clone();
      newState.target.z = this.cameraConstraints.maxZ;
      updated = true;
    }

    if (updated) {
      this.updateCameraState(newState, 'constraint-enforcement');
    }
  }

  /**
   * Enhanced syncCameraToState with error handling
   */
  private syncCameraToState() {
    createEffect(() => {
      try {
        const cameraState = this.graph.state.camera;
        if (!cameraState) return;

        const { target } = cameraState;
        let { distance, phi, theta } = cameraState;

        // Validate state values
        if (!isFinite(distance) || !isFinite(phi) || !isFinite(theta)) {
          this.logger.warn('CameraPlugin', 'Invalid camera state values', { distance, phi, theta });
          return;
        }

        // Apply rotation constraints with validation
        if (this.rotationConstraints.minPhi !== undefined) {
          phi = Math.max(phi, this.rotationConstraints.minPhi);
        }
        if (this.rotationConstraints.maxPhi !== undefined) {
          phi = Math.min(phi, this.rotationConstraints.maxPhi);
        }
        if (this.rotationConstraints.minTheta !== undefined) {
          theta = Math.max(theta, this.rotationConstraints.minTheta);
        }
        if (this.rotationConstraints.maxTheta !== undefined) {
          theta = Math.min(theta, this.rotationConstraints.maxTheta);
        }

        // Apply zoom constraints with validation
        if (this.zoomConstraints.minDistance !== undefined) {
          distance = Math.max(distance, this.zoomConstraints.minDistance);
        }
        if (this.zoomConstraints.maxDistance !== undefined) {
          distance = Math.min(distance, this.zoomConstraints.maxDistance);
        }

        // Calculate camera position based on spherical coordinates
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.cos(phi);
        const z = distance * Math.sin(phi) * Math.sin(theta);

        // Validate calculated position
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
          this.logger.warn('CameraPlugin', 'Invalid calculated camera position', { x, y, z, distance, phi, theta });
          return;
        }

        // Apply camera shake if active with validation
        let finalX = target.x + x;
        let finalY = target.y + y;
        let finalZ = target.z + z;

        if (this.cameraShakeIntensity > 0 && this.cameraShakeDuration > 0) {
          const elapsed = Date.now() - this.cameraShakeStartTime;
          const progress = Math.min(1, elapsed / this.cameraShakeDuration);

          if (progress < 1 && isFinite(this.cameraShakeIntensity)) {
            const shakeAmount = this.cameraShakeIntensity * (1 - progress) * 0.5;
            finalX += (Math.random() - 0.5) * shakeAmount;
            finalY += (Math.random() - 0.5) * shakeAmount;
            finalZ += (Math.random() - 0.5) * shakeAmount;
          } else {
            this.cameraShakeIntensity = 0;
          }
        }

        // Validate final position before applying
        if (isFinite(finalX) && isFinite(finalY) && isFinite(finalZ)) {
          this.threeCamera.position.set(finalX, finalY, finalZ);
          const lookAtTarget = this.poolManager
            .getVector3()
            .set(target.x, target.y, target.z);
          this.threeCamera.lookAt(lookAtTarget);
          this.threeCamera.updateProjectionMatrix();

          // Release pooled vector
          this.poolManager.releaseVector3(lookAtTarget);
        } else {
          this.logger.warn('CameraPlugin', 'Invalid final camera position', { finalX, finalY, finalZ });
        }

      } catch (error) {
        this.errorHandler.handleError('CameraPlugin', 'Camera state sync failed', error);
      }
    });
  }

  // Add missing methods from original implementation
  private initKeyboardControls(): void {
    if (!this.graph.state.controls?.keyboard?.enabled) return;

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.activeKeys.add(event.key.toLowerCase());
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.activeKeys.delete(event.key.toLowerCase());
  }

  private setupAutoFrameWatcher(): void {
    let previousSelection: string[] = [];
    let debounceTimer: NodeJS.Timeout | null = null;

    createEffect(() => {
      const selectedIds = this.graph.state.interaction.selectedElementIds;

      // Check if selection has changed
      const selectionChanged =
        selectedIds.length !== previousSelection.length ||
        selectedIds.some((id, index) => id !== previousSelection[index]);

      if (selectionChanged && selectedIds.length > 0) {
        // Clear previous timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Set new timer with debounce
        debounceTimer = setTimeout(() => {
          // Check if cameraPlugin is available before calling frameSelected
          if (this.graph.cameraPlugin) {
            this.graph.cameraPlugin
              .frameSelected({
                duration: 500,
                strategy: 'optimal',
                distributionAware: true,
              })
              .catch((error) => {
                this.logger.warn('CameraPlugin', 'Auto-frame failed:', error);
              });
          }
        }, 300);
      }

      // Update previous selection
      previousSelection = [...selectedIds];
    });
  }

  private setupPresetCommands(): void {
    // Add REPL commands for camera presets
    // Note: This assumes there's a REPL system that can register commands
    // The actual implementation would depend on how the REPL system works
    /*
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
      // This would depend on how the REPL system registers commands
      // this.registerREPLCommand(name, handler);
    });
    */
  }

  private setupInertiaSystem(): void {
    // Set up animation loop for inertia
    const inertiaLoop = () => {
      if (this.isInertiaEnabled) {
        this.applyInertia();
      }
      requestAnimationFrame(inertiaLoop);
    };
    inertiaLoop();
  }

  private applyInertia(): void {
    if (!this.isInertiaEnabled) return;

    // Apply inertia to camera position
    this.cameraVelocity.multiplyScalar(this.inertiaFactor);

    // Apply inertia to target position
    this.targetVelocity.multiplyScalar(this.inertiaFactor);

    // Update camera if there's significant movement
    if (
      this.cameraVelocity.length() > 0.001 ||
      this.targetVelocity.length() > 0.001
    ) {
      const currentState = this.graph.state.camera;
      const newTarget = {
        x: currentState.target.x + this.targetVelocity.x,
        y: currentState.target.y + this.targetVelocity.y,
        z: currentState.target.z + this.targetVelocity.z,
      };

      this.graph.update({ camera: { target: newTarget } });
    }
  }

  public async frameSelected(
    options: {
      duration: number;
      padding?: number;
      easing?: (t: number) => number | string;
      strategy?: 'tight' | 'loose' | 'optimal';
      distributionAware?: boolean;
    } = {
      duration: 1000,
      padding: 1.5,
      strategy: 'optimal',
      distributionAware: false,
    }
  ): Promise<void> {
    const selectedIds = this.graph.state.interaction.selectedElementIds;
    if (selectedIds.length === 0) return;

    const selectedElements = this.getElementsByIds(selectedIds);
    await this.enhancedFrameReliable(selectedElements, options);
  }

  private getElementsByIds(ids: string[]): { position: THREE.Vector3 }[] {
    return ids
      .map((id) => {
        // Try to find as node first
        const node = this.graph.state.data.nodes.find((n) => n.id === id);
        if (node && node.position) {
          return {
            position: this.poolManager
              .getVector3()
              .set(node.position.x, node.position.y, node.position.z),
          };
        }

        // Try to find as edge
        const edge = this.graph.state.data.edges.find((e) => e.id === id);
        if (edge) {
          // For edges, we'll use the midpoint between source and target
          const sourceNode = this.graph.state.data.nodes.find(
            (n) => n.id === edge.source
          );
          const targetNode = this.graph.state.data.nodes.find(
            (n) => n.id === edge.target
          );

          if (sourceNode?.position && targetNode?.position) {
            const sourcePos = this.poolManager
              .getVector3()
              .set(
                sourceNode.position.x,
                sourceNode.position.y,
                sourceNode.position.z
              );
            const targetPos = this.poolManager
              .getVector3()
              .set(
                targetNode.position.x,
                targetNode.position.y,
                targetNode.position.z
              );
            const midpoint = this.poolManager
              .getVector3()
              .addVectors(sourcePos, targetPos)
              .multiplyScalar(0.5);

            // Release temporary vectors
            this.poolManager.releaseVector3(sourcePos);
            this.poolManager.releaseVector3(targetPos);

            return { position: midpoint };
          }
        }

        return null;
      })
      .filter(Boolean) as { position: THREE.Vector3 }[];
  }

  public update(): void {
    if (!this.graph.state.controls?.keyboard?.enabled) return;

    const controls = this.graph.state.controls.keyboard;
    if (!controls) return;

    // Panning
    if (this.activeKeys.has('w'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'forward',
        controls.panSpeed,
        this.threeCamera
      );
    if (this.activeKeys.has('s'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'backward',
        controls.panSpeed,
        this.threeCamera
      );
    if (this.activeKeys.has('a'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'left',
        controls.panSpeed,
        this.threeCamera
      );
    if (this.activeKeys.has('d'))
      InteractionLogic.handleKeyPan(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'right',
        controls.panSpeed,
        this.threeCamera
      );

    // Orbiting
    if (this.activeKeys.has('arrowup'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'up',
        controls.orbitSpeed
      );
    if (this.activeKeys.has('arrowdown'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'down',
        controls.orbitSpeed
      );
    if (this.activeKeys.has('arrowleft'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'left',
        controls.orbitSpeed
      );
    if (this.activeKeys.has('arrowright'))
      InteractionLogic.handleKeyOrbit(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'right',
        controls.orbitSpeed
      );

    // Zooming
    if (this.activeKeys.has('+') || this.activeKeys.has('='))
      InteractionLogic.handleKeyZoom(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'in',
        controls.zoomSpeed
      );
    if (this.activeKeys.has('-') || this.activeKeys.has('_'))
      InteractionLogic.handleKeyZoom(
        this.graph.state,
        (spec) => this.graph.update(spec),
        'out',
        controls.zoomSpeed
      );
  }

  public getPresetsManager(): CameraPresetsManager {
    return this.presetsManager;
  }

  public getBookmarks(): CameraPreset[] {
    return this.presetsManager.getBookmarks();
  }

  public async createBookmark(
    name: string,
    options: {
      description?: string;
      category?: string;
      tags?: string[];
      generateThumbnail?: boolean;
    } = {}
  ): Promise<CameraPreset> {
    return this.presetsManager.createBookmark(name, options);
  }

  public setView(
    view:
      | 'top'
      | 'bottom'
      | 'front'
      | 'back'
      | 'left'
      | 'right'
      | 'isometric'
      | 'auto'
      | 'diagonal'
      | 'perspective',
    options: {
      duration: number;
      easing?: (t: number) => number;
    } = { duration: 1000 }
  ): void {
    let targetState: Partial<CameraSpec> = {};

    switch (view) {
      case 'top':
        targetState = { phi: 0, theta: 0 };
        break;
      case 'bottom':
        targetState = { phi: Math.PI, theta: 0 };
        break;
      case 'front':
        targetState = { phi: Math.PI / 2, theta: 0 };
        break;
      case 'back':
        targetState = { phi: Math.PI / 2, theta: Math.PI };
        break;
      case 'left':
        targetState = { phi: Math.PI / 2, theta: -Math.PI / 2 };
        break;
      case 'right':
        targetState = { phi: Math.PI / 2, theta: Math.PI / 2 };
        break;
      case 'isometric':
        targetState = { phi: Math.atan(Math.sqrt(2)), theta: Math.PI / 4 };
        break;
      case 'diagonal':
        // Diagonal view from above
        targetState = { phi: Math.PI / 4, theta: Math.PI / 4 };
        break;
      case 'perspective':
        // Low perspective view
        targetState = { phi: Math.PI / 3, theta: 0 };
        break;
      case 'auto':
        // Auto view that frames all elements
        this.autoZoom(options);
        return;
    }

    this.flyTo(targetState, options);
  }

  public followPath(
    waypoints: Partial<CameraSpec>[],
    options: {
      durationPerWaypoint?: number;
      easing?: (t: number) => number;
      loop?: boolean;
      onComplete?: () => void;
    } = {}
  ): void {
    if (waypoints.length === 0) return;

    const {
      durationPerWaypoint = 2000,
      easing = AnimationCurves.easeInOut.easing,
      loop = false,
      onComplete,
    } = options;

    this.isPathFollowing = true;

    const followWaypoint = (index: number) => {
      if (index >= waypoints.length) {
        this.isPathFollowing = false;
        if (loop) {
          followWaypoint(0);
        } else if (onComplete) {
          onComplete();
        }
        return;
      }

      this.flyTo(waypoints[index], {
        duration: durationPerWaypoint,
        easing,
        onComplete: () => {
          setTimeout(() => followWaypoint(index + 1), 100);
        },
      });
    };

    followWaypoint(0);
  }

  public shake(intensity: number = 0.5, duration: number = 500): void {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeDuration = duration;
    this.cameraShakeStartTime = Date.now();

    // Reset shake after duration
    setTimeout(() => {
      this.cameraShakeIntensity = 0;
    }, duration);
  }

  public setRotationConstraints(constraints: RotationConstraints): void {
    this.rotationConstraints = { ...constraints };

    // Apply constraints to current state if needed
    const currentState = this.graph.state.camera;
    let updated = false;
    const newState: Partial<CameraSpec> = {};

    if (
      this.rotationConstraints.minPhi !== undefined &&
      currentState.phi < this.rotationConstraints.minPhi
    ) {
      newState.phi = this.rotationConstraints.minPhi;
      updated = true;
    }

    if (
      this.rotationConstraints.maxPhi !== undefined &&
      currentState.phi > this.rotationConstraints.maxPhi
    ) {
      newState.phi = this.rotationConstraints.maxPhi;
      updated = true;
    }

    if (
      this.rotationConstraints.minTheta !== undefined &&
      currentState.theta < this.rotationConstraints.minTheta
    ) {
      newState.theta = this.rotationConstraints.minTheta;
      updated = true;
    }

    if (
      this.rotationConstraints.maxTheta !== undefined &&
      currentState.theta > this.rotationConstraints.maxTheta
    ) {
      newState.theta = this.rotationConstraints.maxTheta;
      updated = true;
    }

    if (updated) {
      this.graph.update({ camera: newState });
    }
  }

  public setRotationPivot(pivot: THREE.Vector3): void {
    this.rotationPivot.copy(pivot);
  }

  public setZoomConstraints(constraints: {
    minDistance?: number;
    maxDistance?: number;
  }): void {
    this.zoomConstraints = { ...constraints };

    // Apply constraints to current state if needed
    const currentState = this.graph.state.camera;
    let updated = false;
    const newState: Partial<CameraSpec> = {};

    if (
      this.zoomConstraints.minDistance !== undefined &&
      currentState.distance < this.zoomConstraints.minDistance
    ) {
      newState.distance = this.zoomConstraints.minDistance;
      updated = true;
    }

    if (
      this.zoomConstraints.maxDistance !== undefined &&
      currentState.distance > this.zoomConstraints.maxDistance
    ) {
      newState.distance = this.zoomConstraints.maxDistance;
      updated = true;
    }

    if (updated) {
      this.graph.update({ camera: newState });
    }
  }

  public setSmoothZoom(enabled: boolean, factor: number = 0.1): void {
    this.isSmoothZoomEnabled = enabled;
    this.smoothZoomFactor = Math.max(0.01, Math.min(0.99, factor));
  }

  public setInertia(enabled: boolean, factor: number = 0.9): void {
    this.isInertiaEnabled = enabled;
    this.inertiaFactor = Math.max(0.1, Math.min(0.99, factor));
  }
}