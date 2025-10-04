import * as THREE from 'three';
import {
  VisualFeedbackSystem,
  FeedbackConfig,
  FeedbackType,
} from './VisualFeedbackSystem';
import { CameraUtils } from './CameraUtils';

/**
 * Enhanced interaction configuration
 */
export interface InteractionConfig {
  enableVisualFeedback?: boolean;
  enableHapticFeedback?: boolean;
  enableSoundFeedback?: boolean;
  feedbackIntensity?: number;
  hoverDelay?: number;
  clickThreshold?: number;
  dragThreshold?: number;
  multiSelect?: boolean;
  enableGestures?: boolean;
}

/**
 * Interaction state tracking
 */
export interface InteractionState {
  isHovered: boolean;
  isSelected: boolean;
  isDragging: boolean;
  hoverStartTime: number;
  lastClickTime: number;
  dragStartPosition: THREE.Vector3;
  dragStartTime: number;
}

/**
 * Enhanced interaction system with visual and haptic feedback
 */
export class EnhancedInteractionSystem {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private visualFeedback: VisualFeedbackSystem;
  private cameraControls?: CameraUtils;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private interactionStates: Map<string, InteractionState> = new Map();
  private hoveredObjects: Set<string> = new Set();
  private selectedObjects: Set<string> = new Set();
  private draggingObjects: Set<string> = new Set();

  private config: Required<InteractionConfig>;
  private interactionCallbacks: Map<string, ((...args: any[]) => void)[]> =
    new Map();

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: InteractionConfig = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.visualFeedback = new VisualFeedbackSystem(scene);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.config = {
      enableVisualFeedback: true,
      enableHapticFeedback: false,
      enableSoundFeedback: false,
      feedbackIntensity: 1.0,
      hoverDelay: 100,
      clickThreshold: 200,
      dragThreshold: 5,
      multiSelect: false,
      enableGestures: true,
      ...config,
    };

    this.setupEventListeners();
  }

  /**
   * Set camera controls for integration
   */
  public setCameraControls(controls: CameraUtils): void {
    this.cameraControls = controls;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('contextmenu', this.onContextMenu.bind(this));

    // Touch events
    window.addEventListener('touchstart', this.onTouchStart.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this));
    window.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  /**
   * Update mouse position
   */
  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = (this.camera as any).domElement?.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Get intersected objects
   */
  private getIntersectedObjects(): THREE.Object3D[] {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );
    return intersects
      .filter((intersect) => !intersect.object.userData.isFeedback)
      .map((intersect) => intersect.object);
  }

  /**
   * Get or create interaction state
   */
  private getInteractionState(objectId: string): InteractionState {
    if (!this.interactionStates.has(objectId)) {
      this.interactionStates.set(objectId, {
        isHovered: false,
        isSelected: false,
        isDragging: false,
        hoverStartTime: 0,
        lastClickTime: 0,
        dragStartPosition: new THREE.Vector3(),
        dragStartTime: 0,
      });
    }
    return this.interactionStates.get(objectId)!;
  }

  /**
   * Apply visual feedback
   */
  private applyVisualFeedback(
    object: THREE.Object3D,
    type: FeedbackType
  ): void {
    if (!this.config.enableVisualFeedback) return;

    const config: FeedbackConfig = {
      type,
      intensity: this.config.feedbackIntensity,
      duration: type === 'hover' ? 0 : 300,
      glow: true,
      pulse: type === 'select',
      particles: type === 'click' || type === 'success',
    };

    this.visualFeedback.applyFeedback(object, config);
  }

  /**
   * Handle mouse move
   */
  private onMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event.clientX, event.clientY);
    this.handleHover();
  }

  /**
   * Handle hover interactions
   */
  private handleHover(): void {
    const intersectedObjects = this.getIntersectedObjects();
    const currentHoveredIds = new Set<string>();

    intersectedObjects.forEach((object) => {
      const objectId = object.uuid;
      currentHoveredIds.add(objectId);

      const state = this.getInteractionState(objectId);

      if (!state.isHovered) {
        state.isHovered = true;
        state.hoverStartTime = Date.now();

        // Apply hover feedback after delay
        setTimeout(() => {
          if (this.hoveredObjects.has(objectId)) {
            this.applyVisualFeedback(object, 'hover');
            this.triggerCallback('hoverstart', object);
          }
        }, this.config.hoverDelay);

        this.hoveredObjects.add(objectId);
      }
    });

    // Handle objects that are no longer hovered
    this.hoveredObjects.forEach((objectId) => {
      if (!currentHoveredIds.has(objectId)) {
        const state = this.getInteractionState(objectId);
        state.isHovered = false;
        this.hoveredObjects.delete(objectId);

        // Clear hover feedback
        this.visualFeedback.clearFeedback(objectId);
        this.triggerCallback('hoverend', objectId);
      }
    });
  }

  /**
   * Handle mouse down
   */
  private onMouseDown(event: MouseEvent): void {
    const intersectedObjects = this.getIntersectedObjects();

    if (intersectedObjects.length > 0) {
      const object = intersectedObjects[0];
      const objectId = object.uuid;
      const state = this.getInteractionState(objectId);

      state.dragStartTime = Date.now();
      state.dragStartPosition.copy(object.position);

      this.triggerCallback('mousedown', object, event);
    }
  }

  /**
   * Handle mouse up
   */
  private onMouseUp(_event: MouseEvent): void {
    this.draggingObjects.forEach((objectId) => {
      const state = this.getInteractionState(objectId);
      state.isDragging = false;

      this.visualFeedback.clearFeedback(objectId);
      this.applyVisualFeedback(
        this.scene.getObjectByProperty('uuid', objectId)!,
        'select'
      );

      this.triggerCallback('dragend', objectId);
    });

    this.draggingObjects.clear();
  }

  /**
   * Handle click
   */
  private onClick(event: MouseEvent): void {
    const intersectedObjects = this.getIntersectedObjects();

    if (intersectedObjects.length > 0) {
      const object = intersectedObjects[0];
      const objectId = object.uuid;
      const state = this.getInteractionState(objectId);

      const clickDuration = Date.now() - state.lastClickTime;
      state.lastClickTime = Date.now();

      // Check if it's a double click
      if (clickDuration < this.config.clickThreshold) {
        this.handleDoubleClick(object);
      } else {
        this.handleSingleClick(object);
      }

      this.triggerCallback('click', object, event);
    }
  }

  /**
   * Handle single click
   */
  private handleSingleClick(object: THREE.Object3D): void {
    const objectId = object.uuid;

    if (this.config.multiSelect && (window as any).event?.ctrlKey) {
      // Toggle selection in multi-select mode
      if (this.selectedObjects.has(objectId)) {
        this.deselectObject(object);
      } else {
        this.selectObject(object);
      }
    } else {
      // Single selection mode
      this.clearSelection();
      this.selectObject(object);
    }

    this.applyVisualFeedback(object, 'click');
  }

  /**
   * Handle double click
   */
  private handleDoubleClick(object: THREE.Object3D): void {
    // Frame object in camera view - functionality removed due to missing frame method
    // TODO: Implement camera framing for double-click interactions

    this.triggerCallback('doubleclick', object);
  }

  /**
   * Handle context menu
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();

    const intersectedObjects = this.getIntersectedObjects();

    if (intersectedObjects.length > 0) {
      const object = intersectedObjects[0];
      this.applyVisualFeedback(object, 'context');
      this.triggerCallback('contextmenu', object, event);
    }
  }

  /**
   * Handle touch start
   */
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateMousePosition(touch.clientX, touch.clientY);
      this.onMouseDown(touch as any);
    } else if (event.touches.length === 2 && this.config.enableGestures) {
      this.handlePinchStart(event);
    }
  }

  /**
   * Handle touch move
   */
  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateMousePosition(touch.clientX, touch.clientY);
      this.onMouseMove(touch as any);
    } else if (event.touches.length === 2 && this.config.enableGestures) {
      this.handlePinchMove(event);
    }
  }

  /**
   * Handle touch end
   */
  private onTouchEnd(event: TouchEvent): void {
    this.onMouseUp(event.changedTouches[0] as any);
  }

  /**
   * Handle pinch gesture
   */
  private handlePinchStart(event: TouchEvent): void {
    // Implementation for pinch zoom
    this.triggerCallback('pincstart', event);
  }

  /**
   * Handle pinch move
   */
  private handlePinchMove(event: TouchEvent): void {
    // Implementation for pinch zoom
    this.triggerCallback('pinchmove', event);
  }

  /**
   * Handle key down
   */
  private onKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        this.deleteSelectedObjects();
        break;
      case 'Escape':
        this.clearSelection();
        break;
      case 'a':
        if (event.ctrlKey) {
          event.preventDefault();
          this.selectAllObjects();
        }
        break;
    }

    this.triggerCallback('keydown', event);
  }

  /**
   * Handle key up
   */
  private onKeyUp(event: KeyboardEvent): void {
    this.triggerCallback('keyup', event);
  }

  /**
   * Select an object
   */
  private selectObject(object: THREE.Object3D): void {
    const objectId = object.uuid;

    this.selectedObjects.add(objectId);
    const state = this.getInteractionState(objectId);
    state.isSelected = true;

    this.applyVisualFeedback(object, 'select');
    this.triggerCallback('select', object);
  }

  /**
   * Deselect an object
   */
  private deselectObject(object: THREE.Object3D): void {
    const objectId = object.uuid;

    this.selectedObjects.delete(objectId);
    const state = this.getInteractionState(objectId);
    state.isSelected = false;

    this.visualFeedback.clearFeedback(objectId);
    this.triggerCallback('deselect', object);
  }

  /**
   * Clear all selections
   */
  public clearSelection(): void {
    this.selectedObjects.forEach((objectId) => {
      const object = this.scene.getObjectByProperty('uuid', objectId);
      if (object) {
        this.deselectObject(object);
      }
    });
  }

  /**
   * Select all objects
   */
  public selectAllObjects(): void {
    this.scene.traverse((object) => {
      if (!object.userData.isFeedback && object !== this.scene) {
        if (!this.selectedObjects.has(object.uuid)) {
          this.selectObject(object);
        }
      }
    });
  }

  /**
   * Delete selected objects
   */
  public deleteSelectedObjects(): void {
    const objectsToDelete = Array.from(this.selectedObjects);

    objectsToDelete.forEach((objectId) => {
      const object = this.scene.getObjectByProperty('uuid', objectId);
      if (object) {
        this.visualFeedback.applyFeedback(object, { type: 'error' });

        setTimeout(() => {
          if (object.parent) {
            object.parent.remove(object);
          }
          this.selectedObjects.delete(objectId);
          this.interactionStates.delete(objectId);
          this.triggerCallback('delete', object);
        }, 300);
      }
    });
  }

  /**
   * Register interaction callback
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.interactionCallbacks.has(event)) {
      this.interactionCallbacks.set(event, []);
    }
    this.interactionCallbacks.get(event)!.push(callback);
  }

  /**
   * Trigger interaction callback
   */
  private triggerCallback(event: string, ...args: any[]): void {
    const callbacks = this.interactionCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  /**
   * Update interaction system
   */
  public update(): void {
    // Update dragging objects
    this.draggingObjects.forEach((objectId) => {
      const object = this.scene.getObjectByProperty('uuid', objectId);
      if (object) {
        // Update object position based on mouse
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();

        this.raycaster.ray.intersectPlane(plane, intersection);
        object.position.copy(intersection);

        this.triggerCallback('drag', object);
      }
    });
  }

  /**
   * Dispose of the interaction system
   */
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('mousedown', this.onMouseDown.bind(this));
    window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    window.removeEventListener('click', this.onClick.bind(this));
    window.removeEventListener('contextmenu', this.onContextMenu.bind(this));

    window.removeEventListener('touchstart', this.onTouchStart.bind(this));
    window.removeEventListener('touchmove', this.onTouchMove.bind(this));
    window.removeEventListener('touchend', this.onTouchEnd.bind(this));

    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));

    // Clear feedback
    this.visualFeedback.dispose();

    // Clear state
    this.interactionStates.clear();
    this.hoveredObjects.clear();
    this.selectedObjects.clear();
    this.draggingObjects.clear();
    this.interactionCallbacks.clear();
  }
}
