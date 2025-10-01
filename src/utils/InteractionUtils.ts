/**
 * Interaction Utils - Comprehensive interaction handling system
 * Provides unified utilities for mouse, touch, and gesture interactions
 */

import * as THREE from 'three';
// Vector3 is imported for type definitions but not directly used in this file

export interface InteractionEvent {
  type: 'click' | 'dblclick' | 'hover' | 'drag' | 'pinch' | 'tap' | 'swipe';
  position: THREE.Vector2;
  worldPosition?: THREE.Vector3;
  delta?: THREE.Vector2;
  velocity?: THREE.Vector2;
  pressure?: number;
  timestamp: number;
  target?: any;
  originalEvent?: Event;
}

export interface GestureConfig {
  tapThreshold?: number;
  doubleTapDelay?: number;
  swipeThreshold?: number;
  pinchThreshold?: number;
  dragThreshold?: number;
}

export interface InteractionState {
  isDragging: boolean;
  isHovering: boolean;
  isPinching: boolean;
  lastPosition: THREE.Vector2;
  startPosition: THREE.Vector2;
  startTime: number;
  dragStartPosition: THREE.Vector3;
  dragOffset: THREE.Vector3;
  velocity: THREE.Vector2;
  pressure: number;
}

export class InteractionUtils {
  private gestureConfig: GestureConfig;
  private interactionState: Map<string, InteractionState> = new Map();
  private gestureRecognizers: Map<string, GestureRecognizer> = new Map();
  private raycaster: THREE.Raycaster;
  private camera: THREE.Camera;
  private scene: THREE.Scene;

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    config: GestureConfig = {}
  ) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.gestureConfig = {
      tapThreshold: 10,
      doubleTapDelay: 300,
      swipeThreshold: 50,
      pinchThreshold: 5,
      dragThreshold: 5,
      ...config
    };

    this.initializeGestureRecognizers();
  }

  /**
   * Initialize gesture recognizers
   */
  private initializeGestureRecognizers(): void {
    this.gestureRecognizers.set('tap', new TapGestureRecognizer(this.gestureConfig));
    this.gestureRecognizers.set('swipe', new SwipeGestureRecognizer(this.gestureConfig));
    this.gestureRecognizers.set('pinch', new PinchGestureRecognizer(this.gestureConfig));
    this.gestureRecognizers.set('drag', new DragGestureRecognizer(this.gestureConfig));
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
   * Calculate velocity from position history
   */
  calculateVelocity(positions: THREE.Vector2[], timestamps: number[]): THREE.Vector2 {
    if (positions.length < 2) return new THREE.Vector2(0, 0);

    const recentPositions = positions.slice(-5);
    const recentTimestamps = timestamps.slice(-5);

    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < recentPositions.length; i++) {
      const distance = recentPositions[i].distanceTo(recentPositions[i - 1]);
      const time = recentTimestamps[i] - recentTimestamps[i - 1];
      
      totalDistance += distance;
      totalTime += time;
    }

    if (totalTime === 0) return new THREE.Vector2(0, 0);

    const avgSpeed = totalDistance / totalTime;
    const lastDirection = recentPositions[recentPositions.length - 1]
      .clone()
      .sub(recentPositions[recentPositions.length - 2])
      .normalize();

    return lastDirection.multiplyScalar(avgSpeed);
  }

  /**
   * Detect gesture from interaction events
   */
  detectGesture(events: InteractionEvent[]): InteractionEvent | null {
    if (events.length === 0) return null;

    const _latestEvent = events[events.length - 1];
    
    for (const [_name, recognizer] of this.gestureRecognizers) {
      const gesture = recognizer.recognize(events);
      if (gesture) {
        return { ...gesture, timestamp: Date.now() };
      }
    }

    return null;
  }

  /**
   * Update interaction state
   */
  updateInteractionState(id: string, event: Partial<InteractionState>): void {
    const currentState = this.interactionState.get(id) || this.createDefaultState();
    const newState = { ...currentState, ...event };
    this.interactionState.set(id, newState);
  }

  /**
   * Get interaction state
   */
  getInteractionState(id: string): InteractionState {
    return this.interactionState.get(id) || this.createDefaultState();
  }

  /**
   * Clear interaction state
   */
  clearInteractionState(id: string): void {
    this.interactionState.delete(id);
  }

  /**
   * Create default interaction state
   */
  private createDefaultState(): InteractionState {
    return {
      isDragging: false,
      isHovering: false,
      isPinching: false,
      lastPosition: new THREE.Vector2(),
      startPosition: new THREE.Vector2(),
      startTime: Date.now(),
      dragStartPosition: new THREE.Vector3(),
      dragOffset: new THREE.Vector3(),
      velocity: new THREE.Vector2(),
      pressure: 0
    };
  }

  /**
   * Check if position is within bounds
   */
  isWithinBounds(position: THREE.Vector2, bounds: { x: number; y: number; width: number; height: number }): boolean {
    return position.x >= bounds.x && 
           position.x <= bounds.x + bounds.width &&
           position.y >= bounds.y && 
           position.y <= bounds.y + bounds.height;
  }

  /**
   * Clamp position to bounds
   */
  clampToBounds(position: THREE.Vector2, bounds: { x: number; y: number; width: number; height: number }): THREE.Vector2 {
    return new THREE.Vector2(
      Math.max(bounds.x, Math.min(bounds.x + bounds.width, position.x)),
      Math.max(bounds.y, Math.min(bounds.y + bounds.height, position.y))
    );
  }

  /**
   * Calculate drag constraints
   */
  calculateDragConstraints(
    currentPosition: THREE.Vector3,
    constraints: { min?: THREE.Vector3; max?: THREE.Vector3 }
  ): THREE.Vector3 {
    const constrained = currentPosition.clone();
    
    if (constraints.min) {
      constrained.x = Math.max(constraints.min.x, constrained.x);
      constrained.y = Math.max(constraints.min.y, constrained.y);
      constrained.z = Math.max(constraints.min.z, constrained.z);
    }
    
    if (constraints.max) {
      constrained.x = Math.min(constraints.max.x, constrained.x);
      constrained.y = Math.min(constraints.max.y, constrained.y);
      constrained.z = Math.min(constraints.max.z, constrained.z);
    }
    
    return constrained;
  }

  /**
   * Smooth position interpolation
   */
  smoothPosition(current: THREE.Vector2, target: THREE.Vector2, smoothing: number = 0.1): THREE.Vector2 {
    return current.clone().lerp(target, smoothing);
  }

  /**
   * Calculate gesture confidence
   */
  calculateGestureConfidence(events: InteractionEvent[]): number {
    if (events.length < 2) return 0;

    let totalConfidence = 0;
    let count = 0;

    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      
      const timeDiff = curr.timestamp - prev.timestamp;
      const distance = prev.position.distanceTo(curr.position);
      
      // Higher confidence for consistent timing and movement
      const timingConsistency = Math.min(1, 50 / Math.max(timeDiff, 1));
      const movementConsistency = Math.min(1, 1 / Math.max(distance / timeDiff, 0.01));
      
      totalConfidence += (timingConsistency + movementConsistency) / 2;
      count++;
    }

    return count > 0 ? totalConfidence / count : 0;
  }

  /**
   * Multi-touch gesture detection
   */
  detectMultiTouchGestures(touches: Touch[]): InteractionEvent[] {
    const events: InteractionEvent[] = [];
    const now = Date.now();

    if (touches.length === 2) {
      // Pinch gesture
      const touch1 = new THREE.Vector2(touches[0].clientX, touches[0].clientY);
      const touch2 = new THREE.Vector2(touches[1].clientX, touches[1].clientY);
      const distance = touch1.distanceTo(touch2);

      events.push({
        type: 'pinch',
        position: touch1.clone().add(touch2).multiplyScalar(0.5),
        delta: new THREE.Vector2(distance, 0),
        timestamp: now,
        originalEvent: new Event('pinch')
      });
    }

    return events;
  }

  /**
   * Handle mouse events
   */
  handleMouseEvent(event: MouseEvent): InteractionEvent {
    const position = new THREE.Vector2(event.clientX, event.clientY);
    const worldPosition = this.screenToWorld(position);

    return {
      type: this.getMouseEventType(event),
      position,
      worldPosition,
      timestamp: Date.now(),
      originalEvent: event
    };
  }

  /**
   * Handle touch events
   */
  handleTouchEvent(event: TouchEvent): InteractionEvent[] {
    const events: InteractionEvent[] = [];

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const position = new THREE.Vector2(touch.clientX, touch.clientY);
      const worldPosition = this.screenToWorld(position);

      events.push({
        type: 'tap', // Default type, will be refined by gesture recognition
        position,
        worldPosition,
        timestamp: Date.now(),
        originalEvent: event
      });
    }

    // Add multi-touch gestures
    if (event.touches.length > 1) {
      events.push(...this.detectMultiTouchGestures(Array.from(event.touches)));
    }

    return events;
  }

  /**
   * Get mouse event type
   */
  private getMouseEventType(event: MouseEvent): InteractionEvent['type'] {
    switch (event.type) {
      case 'click': return 'click';
      case 'dblclick': return 'dblclick';
      case 'mousemove': return 'hover';
      case 'mousedown': return 'drag';
      case 'mouseup': return 'drag';
      default: return 'click';
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.interactionState.clear();
    this.gestureRecognizers.clear();
  }
}

/**
 * Base gesture recognizer
 */
abstract class GestureRecognizer {
  constructor(protected config: GestureConfig) {}

  abstract recognize(events: InteractionEvent[]): InteractionEvent | null;
}

/**
 * Tap gesture recognizer
 */
class TapGestureRecognizer extends GestureRecognizer {
  recognize(events: InteractionEvent[]): InteractionEvent | null {
    if (events.length < 2) return null;

    const latest = events[events.length - 1];
    const previous = events[events.length - 2];

    const timeDiff = latest.timestamp - previous.timestamp;
    const distance = previous.position.distanceTo(latest.position);

    if (timeDiff < this.config.doubleTapDelay! && distance < this.config.tapThreshold!) {
      return {
        ...latest,
        type: 'tap'
      };
    }

    return null;
  }
}

/**
 * Swipe gesture recognizer
 */
class SwipeGestureRecognizer extends GestureRecognizer {
  recognize(events: InteractionEvent[]): InteractionEvent | null {
    if (events.length < 3) return null;

    const recent = events.slice(-3);
    const start = recent[0];
    const end = recent[recent.length - 1];

    const distance = start.position.distanceTo(end.position);
    const timeDiff = end.timestamp - start.timestamp;

    if (distance > this.config.swipeThreshold! && timeDiff < 500) {
      const velocity = end.position.clone().sub(start.position).divideScalar(timeDiff);
      
      return {
        ...end,
        type: 'swipe',
        velocity,
        delta: end.position.clone().sub(start.position)
      };
    }

    return null;
  }
}

/**
 * Pinch gesture recognizer
 */
class PinchGestureRecognizer extends GestureRecognizer {
  recognize(_events: InteractionEvent[]): InteractionEvent | null {
    // Pinch gestures are detected in multi-touch handling
    return null;
  }
}

/**
 * Drag gesture recognizer
 */
class DragGestureRecognizer extends GestureRecognizer {
  recognize(events: InteractionEvent[]): InteractionEvent | null {
    if (events.length < 2) return null;

    const latest = events[events.length - 1];
    const previous = events[events.length - 2];

    const distance = previous.position.distanceTo(latest.position);
    const timeDiff = latest.timestamp - previous.timestamp;

    if (distance > this.config.dragThreshold! && timeDiff < 100) {
      return {
        ...latest,
        type: 'drag',
        delta: latest.position.clone().sub(previous.position),
        velocity: latest.position.clone().sub(previous.position).divideScalar(timeDiff)
      };
    }

    return null;
  }
}

export default InteractionUtils;