import * as THREE from 'three';
import { createEffect } from 'solid-js';
import { animate } from 'popmotion';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { SpecUpdate, CameraSpec, RotationConstraints } from '../types';
import { InteractionLogic } from '../InteractionLogic';
import { CameraPresetsManager, CameraPreset } from '../utils/CameraPresets';
import { ThreeObjectPoolManager } from '../utils/ThreeObjectPoolManager';
import { AnimationCurves } from '../utils/AnimationUtils';
import { CameraUtils } from '../utils/CameraUtils';
import { Logger } from '../utils/Logger';

/**
 * A plugin that manages the camera and provides camera control methods.
 * It synchronizes the Three.js camera with the reactive state.
 */
export class CameraPlugin implements ISpaceGraphPlugin {
  readonly id = 'camera-plugin';
  readonly name = 'Camera Control Plugin';
  readonly version = '1.0.0';
  readonly description =
    'Provides advanced camera controls and management for SpaceGraph';

  private graph!: SpaceGraph;
  private threeCamera!: THREE.PerspectiveCamera;
  private activeKeys: Set<string> = new Set();
  private boundOnKeyDown!: (event: KeyboardEvent) => void;
  private boundOnKeyUp!: (event: KeyboardEvent) => void;
  private presetsManager!: CameraPresetsManager;
  private rotationConstraints: RotationConstraints = {};
  private rotationPivot: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private poolManager: ThreeObjectPoolManager =
    ThreeObjectPoolManager.getInstance();
  private isAnimating: boolean = false;
  private animationCallbacks: Array<() => void> = [];
  private zoomConstraints: { minDistance?: number; maxDistance?: number } = {};
  private isSmoothZoomEnabled: boolean = true;
  private smoothZoomFactor: number = 0.1;
  private animationQueue: Array<() => void> = [];
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
  private gestureState: {
    lastDistance: number;
    lastAngle: number;
    isGesturing: boolean;
  } = { lastDistance: 0, lastAngle: 0, isGesturing: false };
  private touchStartTime: number = 0;
  private touchStartPositions: Map<number, { x: number; y: number }> =
    new Map();
  private cameraUtils!: CameraUtils;
  private logger: Logger = Logger.getInstance();

  /**
   * Recursively sanitize an object to ensure all values are serializable
   * @param obj - The object to sanitize
   * @returns A sanitized copy of the object
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle primitive types
    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    // Handle THREE.Vector3 instances
    if (obj instanceof THREE.Vector3) {
      return { x: obj.x, y: obj.y, z: obj.z };
    }

    // Handle plain objects
    if (obj.constructor === Object) {
      const sanitized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    // For any other object type, try to convert to string or return null
    try {
      // If it's a plain object-like structure, convert it
      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = this.sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      return String(obj);
    } catch {
      return null;
    }
  }

  public init(graph: SpaceGraph): void {
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
    this.setupTouchGestures();
    this.setupInertiaSystem();
  }

  /**
   * Set up REPL commands for camera presets
   */
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

  /**
   * Watch for selection changes and auto-frame
   */
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

  /**
   * Apply inertia to camera movement for smooth transitions
   */
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

  /**
   * Set up touch gesture support for mobile devices
   */
  private setupTouchGestures(): void {
    let touchStartTime = 0;
    let initialDistance = 0;
    let initialAngle = 0;

    const handleTouchStart = (event: TouchEvent) => {
      touchStartTime = Date.now();

      if (event.touches.length === 2) {
        // Pinch gesture start
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        initialAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );

        this.gestureState.isGesturing = true;
        this.gestureState.lastDistance = initialDistance;
        this.gestureState.lastAngle = initialAngle;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && this.gestureState.isGesturing) {
        event.preventDefault();

        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const currentAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );

        // Handle pinch zoom
        const distanceDelta = currentDistance - initialDistance;
        const zoomFactor = distanceDelta * 0.01;

        if (Math.abs(zoomFactor) > 0.001) {
          this.handleSmoothZoom(
            zoomFactor > 0 ? 'out' : 'in',
            Math.abs(zoomFactor)
          );
        }

        // Handle rotation (optional, can be disabled for better UX)
        const angleDelta = currentAngle - initialAngle;
        if (Math.abs(angleDelta) > 0.1) {
          const currentState = this.graph.state.camera;
          this.graph.update({
            camera: {
              theta: currentState.theta + angleDelta * 0.5,
            },
          });
        }

        this.gestureState.lastDistance = currentDistance;
        this.gestureState.lastAngle = currentAngle;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime;

      // Handle tap-to-focus gesture
      if (
        event.changedTouches.length === 1 &&
        touchDuration < 300 &&
        !this.gestureState.isGesturing
      ) {
        const touch = event.changedTouches[0];
        this.handleTapToFocus(touch.clientX, touch.clientY);
      }

      if (event.touches.length === 0) {
        this.gestureState.isGesturing = false;
      }
    };

    // Add touch event listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  /**
   * Handle tap-to-focus gesture for touch devices
   */
  private handleTapToFocus(clientX: number, clientY: number): void {
    // Use CameraUtils for coordinate conversion and raycasting

    const screenPos = new THREE.Vector2(clientX, clientY);
    // worldPos is calculated but not used in this context
    // const worldPos = this.cameraUtils.screenToWorld(screenPos, 1);

    // Use CameraUtils for raycasting
    const nodeRenderer = this.graph.render.getNodeRenderer();
    const objects = nodeRenderer ? nodeRenderer.getRaycastableObjects() : [];
    const intersects = this.cameraUtils.raycastFromScreen(screenPos, objects);

    if (intersects.length > 0) {
      // Frame the clicked object
      const intersection = intersects[0];
      const nodeId = nodeRenderer.getNodeIdFromIntersection(intersection);

      if (nodeId) {
        const node = this.graph.dataManager.getNode(nodeId);
        if (node && node.position) {
          this.flyTo(
            {
              target: node.position,
              distance: 20,
              phi: this.graph.state.camera.phi,
              theta: this.graph.state.camera.theta,
            },
            {
              duration: 800,
              easing: AnimationCurves.easeOut.easing,
            }
          );
        }
      }
    } else {
      // If no object clicked, perform autozoom to fit all elements
      this.autoZoom({
        duration: 800,
        strategy: 'optimal',
        focusMode: 'all',
      });
    }
  }

  /**
   * Handle smooth zoom with enhanced easing
   */
  private handleSmoothZoom(direction: 'in' | 'out', speed: number = 0.1): void {
    if (!this.isSmoothZoomEnabled) return;

    const currentState = this.graph.state.camera;
    const zoomFactor =
      direction === 'in'
        ? 1 - speed * this.smoothZoomFactor
        : 1 + speed * this.smoothZoomFactor;

    const newDistance = currentState.distance * zoomFactor;

    // Apply zoom constraints
    const constrainedDistance = Math.max(
      this.zoomConstraints.minDistance || 1,
      Math.min(this.zoomConstraints.maxDistance || 1000, newDistance)
    );

    this.graph.update({
      camera: { distance: constrainedDistance },
    });
  }

  /**
   * Set up the inertia system for smooth camera movements
   */
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

  /**
   * Animates the camera state to a new target.
   * @param targetState - The target camera state.
   * @param options - Animation options.
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
    // If there's an ongoing animation and it's not interruptible, queue this one
    if (this.isAnimating && !options.interruptible) {
      this.animationCallbacks.push(() => this.flyTo(targetState, options));
      return;
    }

    const fromState = { ...this.graph.state.camera };

    // Animation start event
    this.graph.events.emit('camera:animation:start');
    this.isAnimating = true;

    // Ensure all values in targetState are serializable
    const sanitizedTargetState: any = {};
    for (const key in targetState) {
      if (Object.prototype.hasOwnProperty.call(targetState, key)) {
        const value = (targetState as any)[key];
        // Skip non-serializable values
        if (
          value !== null &&
          value !== undefined &&
          typeof value !== 'function' &&
          typeof value !== 'object'
        ) {
          sanitizedTargetState[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          // For objects, we need to make sure they're plain objects or Vector3 instances
          if (value.constructor === Object) {
            // Deep sanitize plain objects to ensure all nested values are serializable
            sanitizedTargetState[key] = this.sanitizeObject(value);
          } else if (value instanceof THREE.Vector3) {
            // Convert Vector3 to a plain object
            sanitizedTargetState[key] = { x: value.x, y: value.y, z: value.z };
          } else {
            // For any other object type, convert to plain object if possible
            sanitizedTargetState[key] = this.sanitizeObject(value);
          }
        } else {
          sanitizedTargetState[key] = value;
        }
      }
    }

    // Use popmotion for animation
    animate({
      from: fromState,
      to: sanitizedTargetState,
      duration: options.duration || 1000,
      ease: options.easing as any, // Type assertion to bypass strict type checking
      onUpdate: (latest: any) => {
        // Remove progress property before updating state
        const { progress, ...cameraState } = latest;
        this.graph.update({ camera: cameraState });
        if (options.onUpdate) {
          options.onUpdate(progress || 0);
        }
      },
      onComplete: () => {
        // Animation end event
        this.graph.events.emit('camera:animation:end');
        this.isAnimating = false;

        if (options.onComplete) {
          options.onComplete();
        }

        // Process queued animations
        if (this.animationCallbacks.length > 0) {
          const nextCallback = this.animationCallbacks.shift();
          if (nextCallback) {
            nextCallback();
          }
        }
      },
    });
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
    this.cameraConstraints = { ...constraints };
  }

  /**
   * Enables or disables camera inertia for smooth movements
   * @param enabled - Whether inertia is enabled
   * @param factor - The inertia factor (0-1, higher is more inertia)
   */
  public setInertia(enabled: boolean, factor: number = 0.9): void {
    this.isInertiaEnabled = enabled;
    this.inertiaFactor = Math.max(0.1, Math.min(0.99, factor)); // Clamp between 0.1 and 0.99
  }

  /**
   * Frames the given elements in the camera view.
   * @param elements - The elements to frame.
   * @param options - Animation options.
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
    if (elements.length === 0) return;

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

    // Calculate base camera distance
    let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov * 2));

    // Apply strategy multiplier
    switch (options.strategy) {
      case 'tight':
        // No additional padding for tight framing
        break;
      case 'loose':
        // Add extra padding for loose framing
        cameraZ *= 2.0;
        break;
      case 'optimal':
      default:
        // Standard padding for optimal framing
        cameraZ *= 1.5;
        break;
    }

    // Apply custom padding if provided
    if (options.padding !== undefined) {
      cameraZ *= options.padding;
    }

    // Ensure all values are plain numbers
    const target = {
      target: {
        x: typeof center.x === 'number' ? center.x : parseFloat(center.x) || 0,
        y: typeof center.y === 'number' ? center.y : parseFloat(center.y) || 0,
        z: typeof center.z === 'number' ? center.z : parseFloat(center.z) || 0,
      },
      distance:
        typeof cameraZ === 'number' ? cameraZ : parseFloat(cameraZ) || 50,
    };

    // Release pooled objects
    this.poolManager.releaseVector3(center);
    this.poolManager.releaseVector3(size);

    this.flyTo(target, options);
  }

  /**
   * Sets rotation constraints for the camera
   * @param constraints - The rotation constraints to apply
   */
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

  /**
   * Sets the rotation pivot point for the camera
   * @param pivot - The pivot point as a Vector3
   */
  public setRotationPivot(pivot: THREE.Vector3): void {
    this.rotationPivot.copy(pivot);
  }

  /**
   * Sets zoom constraints for the camera
   * @param constraints - The zoom constraints to apply
   */
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

  /**
   * Enables or disables smooth zooming
   * @param enabled - Whether smooth zooming is enabled
   * @param factor - The smoothing factor (0-1, higher is smoother)
   */
  public setSmoothZoom(enabled: boolean, factor: number = 0.1): void {
    this.isSmoothZoomEnabled = enabled;
    this.smoothZoomFactor = Math.max(0.01, Math.min(0.99, factor)); // Clamp between 0.01 and 0.99
  }

  /**
   * Enhanced autozoom with intelligent framing and smooth transitions
   * @param options - Animation options
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
    const nodes = this.graph.state.data.nodes;
    if (nodes.length === 0) return;

    // Create elements array with positions
    const elements = nodes.map((node) => ({
      position: this.poolManager
        .getVector3()
        .set(
          node.position?.x || 0,
          node.position?.y || 0,
          node.position?.z || 0
        ),
    }));

    // Optionally include edges in the framing
    if (options.includeEdges) {
      const edges = this.graph.state.data.edges;
      for (const edge of edges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        if (sourceNode?.position && targetNode?.position) {
          // Add both source and target positions to ensure edges are framed
          elements.push({
            position: this.poolManager
              .getVector3()
              .set(
                sourceNode.position.x,
                sourceNode.position.y,
                sourceNode.position.z
              ),
          });
          elements.push({
            position: this.poolManager
              .getVector3()
              .set(
                targetNode.position.x,
                targetNode.position.y,
                targetNode.position.z
              ),
          });
        }
      }
    }

    // Handle different focus modes
    switch (options.focusMode) {
      case 'selection': {
        // Focus on selected elements
        const selectedIds = this.graph.state.interaction.selectedElementIds;
        if (selectedIds.length > 0) {
          const selectedElements = this.getElementsByIds(selectedIds);
          if (options.animate) {
            this.enhancedFrame(selectedElements, {
              duration: options.duration || 1000,
              padding: options.padding,
              easing: options.easing,
              strategy: options.strategy as any,
              perspectiveCorrection: options.perspectiveCorrection,
              distributionAware: options.distributionAware,
              onComplete: options.onComplete,
            });
          } else {
            this.frame(selectedElements, {
              duration: options.duration || 1000,
              padding: options.padding,
              easing: options.easing as any,
              strategy: options.strategy as any,
            });
          }
          return;
        }
        // Fall back to all elements if no selection
        break;
      }

      case 'center': {
        // Focus on the center of all elements with optimal distance
        const center = CameraUtils.calculateWeightedCenter(
          elements.map((el) => el.position)
        );
        // Use CameraUtils for distance calculation
        const dummyCamera = new THREE.PerspectiveCamera();
        dummyCamera.fov = this.threeCamera.fov;
        dummyCamera.aspect = this.threeCamera.aspect;
        const target = CameraUtils.calculateOptimalPosition(
          elements,
          dummyCamera,
          {
            focusMode: 'center',
            padding: 1.5,
          }
        );
        const optimalDistance = target.distance || 50;

        if (options.animate) {
          this.flyTo(
            {
              target: center,
              distance: optimalDistance,
              phi: this.graph.state.camera.phi,
              theta: this.graph.state.camera.theta,
            },
            {
              duration: options.duration || 1000,
              easing:
                typeof options.easing === 'string'
                  ? AnimationCurves[
                      options.easing as keyof typeof AnimationCurves
                    ]?.easing || AnimationCurves.easeInOut.easing
                  : options.easing || AnimationCurves.easeInOut.easing,
              onComplete: options.onComplete,
            }
          );
        } else {
          this.graph.update({
            camera: {
              target: { x: center.x, y: center.y, z: center.z },
              distance: optimalDistance,
            },
          });
          if (options.onComplete) options.onComplete();
        }
        return;
      }

      case 'weighted': {
        // Focus based on element importance/weight
        const weightedCenter = CameraUtils.calculateWeightedCenter(
          elements.map((el) => el.position)
        );
        // Use CameraUtils for distance calculation
        const dummyCamera = new THREE.PerspectiveCamera();
        dummyCamera.fov = this.threeCamera.fov;
        dummyCamera.aspect = this.threeCamera.aspect;
        const target = CameraUtils.calculateOptimalPosition(
          elements,
          dummyCamera,
          {
            focusMode: 'weighted',
            padding: 1.5,
          }
        );
        const weightedDistance = target.distance || 50;

        if (options.animate) {
          this.flyTo(
            {
              target: weightedCenter,
              distance: weightedDistance,
              phi: this.graph.state.camera.phi,
              theta: this.graph.state.camera.theta,
            },
            {
              duration: options.duration || 1000,
              easing:
                typeof options.easing === 'string'
                  ? AnimationCurves[
                      options.easing as keyof typeof AnimationCurves
                    ]?.easing || AnimationCurves.easeInOut.easing
                  : options.easing || AnimationCurves.easeInOut.easing,
              onComplete: options.onComplete,
            }
          );
        } else {
          this.graph.update({
            camera: {
              target: {
                x: weightedCenter.x,
                y: weightedCenter.y,
                z: weightedCenter.z,
              },
              distance: weightedDistance,
            },
          });
          if (options.onComplete) options.onComplete();
        }
        return;
      }

      case 'all':
      default: {
        // Default: frame all elements
        if (options.animate) {
          this.enhancedFrame(elements, {
            duration: options.duration || 1000,
            padding: options.padding,
            easing: options.easing,
            strategy: options.strategy as any,
            perspectiveCorrection: options.perspectiveCorrection,
            distributionAware: options.distributionAware,
            onComplete: options.onComplete,
          });
        } else {
          this.frame(elements, {
            duration: options.duration || 1000,
            padding: options.padding,
            easing: options.easing as any,
            strategy: options.strategy as any,
          });
        }
        return;
      }
    }

    // Fallback to framing all elements
    if (options.animate) {
      this.enhancedFrame(elements, {
        duration: options.duration || 1000,
        padding: options.padding,
        easing: options.easing,
        strategy: options.strategy as any,
        perspectiveCorrection: options.perspectiveCorrection,
        distributionAware: options.distributionAware,
        onComplete: options.onComplete,
      });
    } else {
      this.frame(elements, {
        duration: options.duration || 1000,
        padding: options.padding,
        easing: options.easing as any,
        strategy: options.strategy as any,
      });
    }
  }

  /**
   * Automatically frame all selected elements
   * @param options - Framing options
   */
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
    await this.enhancedFrame(selectedElements, options);
  }

  /**
   * Get elements by their IDs
   * @param ids - Array of element IDs
   * @returns Array of elements with position vectors
   */
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

  /**
   * Enhanced framing with configurable padding and aspect ratios
   * @param elements - The elements to frame
   * @param options - Framing options
   */
  public enhancedFrame(
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
    } = {
      duration: 1000,
      padding: 1.5,
      strategy: 'optimal',
      perspectiveCorrection: true,
      distributionAware: false,
    }
  ) {
    if (elements.length === 0) return;

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

    // Calculate base camera distance
    let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov * 2));

    // Apply strategy multiplier
    switch (options.strategy) {
      case 'tight':
        // No additional padding for tight framing
        break;
      case 'loose':
        // Add extra padding for loose framing
        cameraZ *= 2.0;
        break;
      case 'optimal':
      default:
        // Standard padding for optimal framing
        cameraZ *= 1.5;
        break;
    }

    // Apply custom padding if provided
    if (options.padding !== undefined) {
      cameraZ *= options.padding;
    }

    // Adjust for aspect ratio if provided
    if (options.aspectRatio) {
      const currentAspect = this.threeCamera.aspect;
      cameraZ *= Math.max(options.aspectRatio / currentAspect, 1);
    }

    // Apply perspective correction if enabled
    if (options.perspectiveCorrection) {
      // Adjust distance based on current camera angle to maintain consistent framing
      const currentCamera = this.graph.state.camera;
      const angleFactor = Math.abs(Math.sin(currentCamera.phi));
      cameraZ *= Math.max(0.5, angleFactor);
    }

    // Distribution-aware framing for non-uniform element distributions
    if (options.distributionAware && elements.length > 1) {
      // Calculate variance of elements from center
      let sumSquaredDistances = 0;
      for (const el of elements) {
        const distance = el.position.distanceTo(center);
        sumSquaredDistances += distance * distance;
      }
      const variance = sumSquaredDistances / elements.length;
      const stdDev = Math.sqrt(variance);

      // Adjust distance based on distribution spread
      // More spread out elements need more distance to fit in view
      const spreadFactor = 1 + stdDev / (center.length() || 1);

      cameraZ = cameraZ * Math.min(spreadFactor, 3.0); // Cap at 3x
    }

    const target = {
      target: { x: center.x, y: center.y, z: center.z },
      distance: cameraZ,
    };

    // Release pooled objects
    this.poolManager.releaseVector3(center);
    this.poolManager.releaseVector3(size);

    // Preserve onComplete callback
    const originalOnComplete = options.onComplete;

    // Emit framing start event
    this.graph.events.emit('camera:framing:start');

    // Debug log to see what values are being passed
    this.logger.debug(
      'CameraPlugin',
      'enhancedFrame calling flyTo with target:',
      target
    );

    this.flyTo(target, {
      ...options,
      onComplete: () => {
        if (originalOnComplete) {
          originalOnComplete();
        }
        // Emit framing complete event
        this.graph.events.emit('camera:framing:end');
      },
    });
  }

  /**
   * Gets the presets manager instance
   * @returns The CameraPresetsManager instance
   */
  public getPresetsManager(): CameraPresetsManager {
    return this.presetsManager;
  }

  /**
   * Get all bookmarks
   * @returns Array of bookmark presets
   */
  public getBookmarks(): CameraPreset[] {
    return this.presetsManager.getBookmarks();
  }

  /**
   * Create a bookmark from current camera state
   * @param name - Name of the bookmark
   * @param options - Bookmark options
   * @returns The created bookmark
   */
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

  /**
   * Quick access to standard camera views
   * @param view - The view to switch to
   * @param options - Animation options
   */
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

  public dispose(): void {
    if (this.boundOnKeyDown) {
      window.removeEventListener('keydown', this.boundOnKeyDown);
    }
    if (this.boundOnKeyUp) {
      window.removeEventListener('keyup', this.boundOnKeyUp);
    }
  }

  /**
   * Follow a predefined path with the camera
   * @param waypoints - Array of camera states to visit
   * @param options - Path following options
   */
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

  /**
   * Apply camera shake effect
   * @param intensity - Shake intensity (0-1)
   * @param duration - Duration in milliseconds
   */
  public shake(intensity: number = 0.5, duration: number = 500): void {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeDuration = duration;
    this.cameraShakeStartTime = Date.now();

    // Reset shake after duration
    setTimeout(() => {
      this.cameraShakeIntensity = 0;
    }, duration);
  }

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

  /**
   * Sets up a reactive effect to keep the Three.js camera in sync with the state.
   */
  private syncCameraToState() {
    createEffect(() => {
      const cameraState = this.graph.state.camera;
      if (!cameraState) return;

      const { target } = cameraState;
      let { distance, phi, theta } = cameraState;

      // Apply rotation constraints
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

      // Apply zoom constraints
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

      // Apply camera shake if active
      let finalX = target.x + x;
      let finalY = target.y + y;
      let finalZ = target.z + z;

      if (this.cameraShakeIntensity > 0 && this.cameraShakeDuration > 0) {
        const elapsed = Date.now() - this.cameraShakeStartTime;
        const progress = Math.min(1, elapsed / this.cameraShakeDuration);

        if (progress < 1) {
          // Apply diminishing shake effect
          const shakeAmount = this.cameraShakeIntensity * (1 - progress) * 0.5;
          finalX += (Math.random() - 0.5) * shakeAmount;
          finalY += (Math.random() - 0.5) * shakeAmount;
          finalZ += (Math.random() - 0.5) * shakeAmount;
        } else {
          // Reset shake when duration is over
          this.cameraShakeIntensity = 0;
        }
      }

      this.threeCamera.position.set(finalX, finalY, finalZ);
      const lookAtTarget = this.poolManager
        .getVector3()
        .set(target.x, target.y, target.z);
      this.threeCamera.lookAt(lookAtTarget);
      this.threeCamera.updateProjectionMatrix();

      // Release pooled vector
      this.poolManager.releaseVector3(lookAtTarget);
    });
  }
}
