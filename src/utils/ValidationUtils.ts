
import * as THREE from 'three';
import { CameraSpec, NodeSpec, EdgeSpec, GroupSpec } from '../types';
import { ISpaceGraphPlugin } from '../core/plugin';
import { AnimationConfig } from './animation/CoreAnimationSystem';

/**
 * Comprehensive validation utilities for type safety and runtime validation
 */
export class ValidationUtils {
  private static instance: ValidationUtils;

  private constructor() {}

  public static getInstance(): ValidationUtils {
    if (!ValidationUtils.instance) {
      ValidationUtils.instance = new ValidationUtils();
    }
    return ValidationUtils.instance;
  }

  /**
   * Validates that a value is a finite number
   */
  public isValidNumber(value: any, fieldName?: string): value is number {
    if (typeof value !== 'number' || !isFinite(value)) {
      if (fieldName) {
        throw new Error(`Invalid number for ${fieldName}: ${value}`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a value is a valid Vector3
   */
  public isValidVector3(vector: any, fieldName?: string): vector is THREE.Vector3 {
    if (!(vector instanceof THREE.Vector3)) {
      if (fieldName) {
        throw new Error(`Invalid Vector3 for ${fieldName}: must be THREE.Vector3 instance`);
      }
      return false;
    }

    if (!isFinite(vector.x) || !isFinite(vector.y) || !isFinite(vector.z)) {
      if (fieldName) {
        throw new Error(`Invalid Vector3 components for ${fieldName}: must be finite numbers`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a value is a valid camera specification
   */
  public isValidCameraSpec(spec: any, fieldName?: string): spec is Partial<CameraSpec> {
    if (!spec || typeof spec !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid camera spec for ${fieldName}: must be an object`);
      }
      return false;
    }

    // Validate distance
    if (spec.distance !== undefined && !this.isValidNumber(spec.distance, `${fieldName}.distance`)) {
      return false;
    }

    // Validate phi (vertical rotation)
    if (spec.phi !== undefined && !this.isValidNumber(spec.phi, `${fieldName}.phi`)) {
      return false;
    }

    // Validate theta (horizontal rotation)
    if (spec.theta !== undefined && !this.isValidNumber(spec.theta, `${fieldName}.theta`)) {
      return false;
    }

    // Validate target
    if (spec.target !== undefined && !this.isValidVector3(spec.target, `${fieldName}.target`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a value is within specified bounds
   */
  public isWithinBounds(value: number, min?: number, max?: number, fieldName?: string): boolean {
    if (!this.isValidNumber(value, fieldName)) {
      return false;
    }

    if (min !== undefined && value < min) {
      if (fieldName) {
        throw new Error(`${fieldName} must be >= ${min}, got ${value}`);
      }
      return false;
    }

    if (max !== undefined && value > max) {
      if (fieldName) {
        throw new Error(`${fieldName} must be <= ${max}, got ${value}`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that an array is not empty
   */
  public isNonEmptyArray<T>(array: T[] | undefined | null, fieldName?: string): array is T[] {
    if (!Array.isArray(array) || array.length === 0) {
      if (fieldName) {
        throw new Error(`Invalid array for ${fieldName}: must be non-empty array`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a string is not empty
   */
  public isNonEmptyString(value: any, fieldName?: string): value is string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      if (fieldName) {
        throw new Error(`Invalid string for ${fieldName}: must be non-empty string`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an object has required properties
   */
  public hasRequiredProperties<T extends Record<string, any>>(
    obj: any,
    requiredProps: (keyof T)[],
    fieldName?: string
  ): obj is T {
    if (!obj || typeof obj !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid object for ${fieldName}: must be an object`);
      }
      return false;
    }

    for (const prop of requiredProps) {
      if (!(prop in obj)) {
        if (fieldName) {
          throw new Error(`Missing required property ${String(prop)} for ${fieldName}`);
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that a THREE.Camera has valid properties
   */
  public isValidCamera(camera: any, fieldName?: string): camera is THREE.PerspectiveCamera {
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      if (fieldName) {
        throw new Error(`Invalid camera for ${fieldName}: must be THREE.PerspectiveCamera instance`);
      }
      return false;
    }

    if (!this.isValidNumber(camera.fov, `${fieldName}.fov`) ||
        !this.isValidNumber(camera.aspect, `${fieldName}.aspect`) ||
        !this.isValidNumber(camera.near, `${fieldName}.near`) ||
        !this.isValidNumber(camera.far, `${fieldName}.far`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a DOM element is valid for renderer attachment
   */
  public isValidRendererElement(element: any, fieldName?: string): element is HTMLElement {
    if (!element || typeof element !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid element for ${fieldName}: must be a DOM element`);
      }
      return false;
    }

    if (!(element instanceof HTMLElement)) {
      if (fieldName) {
        throw new Error(`Invalid element for ${fieldName}: must be an HTMLElement`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a touch event has valid properties
   */
  public isValidTouchEvent(event: any, fieldName?: string): event is TouchEvent {
    if (!event || typeof event !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid touch event for ${fieldName}: must be a TouchEvent`);
      }
      return false;
    }

    if (!Array.isArray(event.touches)) {
      if (fieldName) {
        throw new Error(`Invalid touch event for ${fieldName}: missing touches array`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a pointer event has valid coordinates
   */
  public isValidPointerCoordinates(event: any, fieldName?: string): boolean {
    if (!event || typeof event !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid event for ${fieldName}: must be a pointer event`);
      }
      return false;
    }

    if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
      if (fieldName) {
        throw new Error(`Invalid event for ${fieldName}: missing clientX/clientY`);
      }
      return false;
    }

    if (!isFinite(event.clientX) || !isFinite(event.clientY)) {
      if (fieldName) {
        throw new Error(`Invalid event for ${fieldName}: non-finite coordinates`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a THREE.Object3D is valid and has required properties
   */
  public isValidObject3D(object: any, fieldName?: string): object is THREE.Object3D {
    if (!(object instanceof THREE.Object3D)) {
      if (fieldName) {
        throw new Error(`Invalid Object3D for ${fieldName}: must be THREE.Object3D instance`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a THREE.Material is valid
   */
  public isValidMaterial(material: any, fieldName?: string): material is THREE.Material {
    if (!(material instanceof THREE.Material)) {
      if (fieldName) {
        throw new Error(`Invalid material for ${fieldName}: must be THREE.Material instance`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a THREE.BufferGeometry is valid
   */
  public isValidGeometry(geometry: any, fieldName?: string): geometry is THREE.BufferGeometry {
    if (!(geometry instanceof THREE.BufferGeometry)) {
      if (fieldName) {
        throw new Error(`Invalid geometry for ${fieldName}: must be THREE.BufferGeometry instance`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that an animation options object is valid
   */
  public isValidAnimationOptions(options: any, fieldName?: string): options is AnimationConfig {
    if (!options || typeof options !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid animation options for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (options.duration !== undefined && !this.isValidNumber(options.duration, `${fieldName}.duration`)) {
      return false;
    }

    if (options.priority !== undefined && !this.isValidNumber(options.priority, `${fieldName}.priority`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a constraint object is valid
   */
  public isValidConstraints(constraints: any, fieldName?: string): boolean {
    if (!constraints || typeof constraints !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid constraints for ${fieldName}: must be an object`);
      }
      return false;
    }

    // Validate numeric constraint properties
    const constraintProps = ['minDistance', 'maxDistance', 'minPhi', 'maxPhi', 'minTheta', 'maxTheta'];
    for (const prop of constraintProps) {
      if (constraints[prop] !== undefined && !this.isValidNumber(constraints[prop], `${fieldName}.${prop}`)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that a gesture state object is valid
   */
  public isValidGestureState(state: any, fieldName?: string): boolean {
    if (!state || typeof state !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid gesture state for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (state.event && !this.isValidPointerCoordinates(state.event, `${fieldName}.event`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a node specification is valid
   */
  public isValidNodeSpec(node: any, fieldName?: string): node is NodeSpec {
    if (!node || typeof node !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid node spec for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (!this.isNonEmptyString(node.id, `${fieldName}.id`)) {
      return false;
    }

    if (node.position && !this.isValidVector3(node.position, `${fieldName}.position`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that an edge specification is valid
   */
  public isValidEdgeSpec(edge: any, fieldName?: string): edge is EdgeSpec {
    if (!edge || typeof edge !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid edge spec for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (!this.isNonEmptyString(edge.id, `${fieldName}.id`)) {
      return false;
    }

    if (!this.isNonEmptyString(edge.source, `${fieldName}.source`)) {
      return false;
    }

    if (!this.isNonEmptyString(edge.target, `${fieldName}.target`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a group specification is valid
   */
  public isValidGroupSpec(group: any, fieldName?: string): group is GroupSpec {
    if (!group || typeof group !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid group spec for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (!this.isNonEmptyString(group.id, `${fieldName}.id`)) {
      return false;
    }

    if (!Array.isArray(group.nodes)) {
      if (fieldName) {
        throw new Error(`Invalid group spec for ${fieldName}: nodes must be an array`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a plugin interface is implemented correctly
   */
  public isValidPlugin(plugin: any, fieldName?: string): plugin is ISpaceGraphPlugin {
    if (!plugin || typeof plugin !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid plugin for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (typeof plugin.id !== 'string' || plugin.id.trim().length === 0) {
      if (fieldName) {
        throw new Error(`Invalid plugin for ${fieldName}: must have non-empty id`);
      }
      return false;
    }

    if (typeof plugin.init !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid plugin for ${fieldName}: must have init method`);
      }
      return false;
    }

    if (typeof plugin.dispose !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid plugin for ${fieldName}: must have dispose method`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a performance metric is valid
   */
  public isValidPerformanceMetric(metric: any, fieldName?: string): boolean {
    if (typeof metric !== 'number' || !isFinite(metric)) {
      if (fieldName) {
        throw new Error(`Invalid performance metric for ${fieldName}: must be a finite number`);
      }
      return false;
    }

    if (metric < 0) {
      if (fieldName) {
        throw new Error(`Invalid performance metric for ${fieldName}: must be non-negative`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a configuration object is valid
   */
  public isValidConfig<T extends Record<string, any>>(
    config: any,
    schema: Record<keyof T, (value: any) => boolean>,
    fieldName?: string
  ): config is T {
    if (!config || typeof config !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid config for ${fieldName}: must be an object`);
      }
      return false;
    }

    for (const [key, validator] of Object.entries(schema)) {
      if (key in config && !validator(config[key])) {
        if (fieldName) {
          throw new Error(`Invalid config property ${key} for ${fieldName}`);
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that a callback function is valid
   */
  public isValidCallback(fn: any, fieldName?: string): fn is Function {
    if (typeof fn !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid callback for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a timeout value is valid
   */
  public isValidTimeout(timeout: any, fieldName?: string): timeout is number {
    if (!this.isValidNumber(timeout, fieldName)) {
      return false;
    }

    if (timeout < 0) {
      if (fieldName) {
        throw new Error(`Invalid timeout for ${fieldName}: must be non-negative`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a retry count is valid
   */
  public isValidRetryCount(retryCount: any, fieldName?: string): retryCount is number {
    if (!this.isValidNumber(retryCount, fieldName)) {
      return false;
    }

    if (retryCount < 0 || retryCount > 10) {
      if (fieldName) {
        throw new Error(`Invalid retry count for ${fieldName}: must be between 0 and 10`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a priority value is valid
   */
  public isValidPriority(priority: any, fieldName?: string): priority is number {
    if (!this.isValidNumber(priority, fieldName)) {
      return false;
    }

    if (priority < 0 || priority > 10) {
      if (fieldName) {
        throw new Error(`Invalid priority for ${fieldName}: must be between 0 and 10`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a percentage value is valid (0-1)
   */
  public isValidPercentage(percentage: any, fieldName?: string): percentage is number {
    if (!this.isValidNumber(percentage, fieldName)) {
      return false;
    }

    if (percentage < 0 || percentage > 1) {
      if (fieldName) {
        throw new Error(`Invalid percentage for ${fieldName}: must be between 0 and 1`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a color value is valid
   */
  public isValidColor(color: any, fieldName?: string): boolean {
    if (typeof color === 'string') {
      // Validate hex color format
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    } else if (typeof color === 'number') {
      // Validate numeric color
      return this.isValidNumber(color, fieldName) && color >= 0 && color <= 0xffffff;
    } else if (color instanceof THREE.Color) {
      return true;
    }

    if (fieldName) {
      throw new Error(`Invalid color for ${fieldName}: must be hex string, number, or THREE.Color`);
    }
    return false;
  }

  /**
   * Validates that an easing function is valid
   */
  public isValidEasing(easing: any, fieldName?: string): boolean {
    if (typeof easing === 'string') {
      // Common easing function names
      const validEasings = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad'];
      return validEasings.includes(easing);
    } else if (typeof easing === 'function') {
      return true;
    }

    if (fieldName) {
      throw new Error(`Invalid easing for ${fieldName}: must be string or function`);
    }
    return false;
  }

  /**
   * Validates that a bounding box is valid
   */
  public isValidBoundingBox(box: THREE.Box3, fieldName?: string): boolean {
    if (!(box instanceof THREE.Box3)) {
      if (fieldName) {
        throw new Error(`Invalid bounding box for ${fieldName}: must be THREE.Box3 instance`);
      }
      return false;
    }

    // Check if box has valid dimensions
    const size = box.getSize(new THREE.Vector3());
    if (!isFinite(size.x) || !isFinite(size.y) || !isFinite(size.z)) {
      if (fieldName) {
        throw new Error(`Invalid bounding box for ${fieldName}: contains non-finite dimensions`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a matrix is valid
   */
  public isValidMatrix(matrix: THREE.Matrix4, fieldName?: string): boolean {
    if (!(matrix instanceof THREE.Matrix4)) {
      if (fieldName) {
        throw new Error(`Invalid matrix for ${fieldName}: must be THREE.Matrix4 instance`);
      }
      return false;
    }

    // Check if matrix elements are finite
    const elements = matrix.elements;
    for (let i = 0; i < 16; i++) {
      if (!isFinite(elements[i])) {
        if (fieldName) {
          throw new Error(`Invalid matrix for ${fieldName}: contains non-finite element at index ${i}`);
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that a quaternion is valid
   */
  public isValidQuaternion(quaternion: THREE.Quaternion, fieldName?: string): boolean {
    if (!(quaternion instanceof THREE.Quaternion)) {
      if (fieldName) {
        throw new Error(`Invalid quaternion for ${fieldName}: must be THREE.Quaternion instance`);
      }
      return false;
    }

    if (!isFinite(quaternion.x) || !isFinite(quaternion.y) ||
        !isFinite(quaternion.z) || !isFinite(quaternion.w)) {
      if (fieldName) {
        throw new Error(`Invalid quaternion for ${fieldName}: contains non-finite components`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a raycaster is valid
   */
  public isValidRaycaster(raycaster: THREE.Raycaster, fieldName?: string): boolean {
    if (!(raycaster instanceof THREE.Raycaster)) {
      if (fieldName) {
        throw new Error(`Invalid raycaster for ${fieldName}: must be THREE.Raycaster instance`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that an intersection result is valid
   */
  public isValidIntersection(intersection: THREE.Intersection, fieldName?: string): boolean {
    if (!intersection || typeof intersection !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid intersection for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (!this.isValidNumber(intersection.distance, `${fieldName}.distance`)) {
      return false;
    }

    if (!(intersection.point instanceof THREE.Vector3)) {
      if (fieldName) {
        throw new Error(`Invalid intersection for ${fieldName}: must have valid point`);
      }
      return false;
    }

    if (!intersection.object || !this.isValidObject3D(intersection.object, `${fieldName}.object`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a plane is valid
   */
  public isValidPlane(plane: THREE.Plane, fieldName?: string): boolean {
    if (!(plane instanceof THREE.Plane)) {
      if (fieldName) {
        throw new Error(`Invalid plane for ${fieldName}: must be THREE.Plane instance`);
      }
      return false;
    }

    if (!this.isValidVector3(plane.normal, `${fieldName}.normal`)) {
      return false;
    }

    if (!this.isValidNumber(plane.constant, `${fieldName}.constant`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a frustum is valid
   */
  public isValidFrustum(frustum: THREE.Frustum, fieldName?: string): boolean {
    if (!(frustum instanceof THREE.Frustum)) {
      if (fieldName) {
        throw new Error(`Invalid frustum for ${fieldName}: must be THREE.Frustum instance`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a texture is valid
   */
  public isValidTexture(texture: any, fieldName?: string): texture is THREE.Texture {
    if (!(texture instanceof THREE.Texture)) {
      if (fieldName) {
        throw new Error(`Invalid texture for ${fieldName}: must be THREE.Texture instance`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a render target is valid
   */
  public isValidRenderTarget(renderTarget: any, fieldName?: string): boolean {
    if (!renderTarget || typeof renderTarget !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid render target for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (typeof renderTarget.width !== 'number' || typeof renderTarget.height !== 'number') {
      if (fieldName) {
        throw new Error(`Invalid render target for ${fieldName}: must have width and height`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a WebGL context is valid
   */
  public isValidWebGLContext(context: any, fieldName?: string): boolean {
    if (!context || typeof context !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid WebGL context for ${fieldName}: must be an object`);
      }
      return false;
    }

    // Check for WebGL context properties
    if (typeof context.getParameter !== 'function' || typeof context.createTexture !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid WebGL context for ${fieldName}: missing required methods`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a shader material is valid
   */
  public isValidShaderMaterial(material: any, fieldName?: string): boolean {
    if (!this.isValidMaterial(material, fieldName)) {
      return false;
    }

    if (material.type !== 'ShaderMaterial') {
      if (fieldName) {
        throw new Error(`Invalid shader material for ${fieldName}: must be ShaderMaterial type`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a buffer attribute is valid
   */
  public isValidBufferAttribute(attribute: any, fieldName?: string): boolean {
    if (!attribute || typeof attribute !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid buffer attribute for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (typeof attribute.count !== 'number' || typeof attribute.itemSize !== 'number') {
      if (fieldName) {
        throw new Error(`Invalid buffer attribute for ${fieldName}: must have count and itemSize`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a uniform object is valid
   */
  public isValidUniform(uniform: any, fieldName?: string): boolean {
    if (!uniform || typeof uniform !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid uniform for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (uniform.value === undefined) {
      if (fieldName) {
        throw new Error(`Invalid uniform for ${fieldName}: must have value property`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a viewport is valid
   */
  public isValidViewport(viewport: any, fieldName?: string): boolean {
    if (!Array.isArray(viewport) || viewport.length !== 4) {
      if (fieldName) {
        throw new Error(`Invalid viewport for ${fieldName}: must be an array of 4 numbers`);
      }
      return false;
    }

    for (let i = 0; i < 4; i++) {
      if (!this.isValidNumber(viewport[i], `${fieldName}[${i}]`)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that a scissor rectangle is valid
   */
  public isValidScissor(scissor: any, fieldName?: string): boolean {
    if (!Array.isArray(scissor) || scissor.length !== 4) {
      if (fieldName) {
        throw new Error(`Invalid scissor for ${fieldName}: must be an array of 4 numbers`);
      }
      return false;
    }

    for (let i = 0; i < 4; i++) {
      if (!this.isValidNumber(scissor[i], `${fieldName}[${i}]`)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that a clear color is valid
   */
  public isValidClearColor(color: any, fieldName?: string): boolean {
    if (typeof color === 'number') {
      return this.isValidNumber(color, fieldName) && color >= 0 && color <= 0xffffff;
    } else if (Array.isArray(color)) {
      if (color.length !== 3 && color.length !== 4) {
        if (fieldName) {
          throw new Error(`Invalid clear color for ${fieldName}: must be array of 3 or 4 numbers`);
        }
        return false;
      }

      for (let i = 0; i < color.length; i++) {
        if (!this.isValidNumber(color[i], `${fieldName}[${i}]`)) {
          return false;
        }
      }

      return true;
    }

    if (fieldName) {
      throw new Error(`Invalid clear color for ${fieldName}: must be number or array`);
    }
    return false;
  }

  /**
   * Validates that a clear alpha value is valid
   */
  public isValidClearAlpha(alpha: any, fieldName?: string): boolean {
    if (!this.isValidNumber(alpha, fieldName)) {
      return false;
    }

    if (alpha < 0 || alpha > 1) {
      if (fieldName) {
        throw new Error(`Invalid clear alpha for ${fieldName}: must be between 0 and 1`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a blend mode is valid
   */
  public isValidBlendMode(mode: any, fieldName?: string): boolean {
    const validModes = [
      THREE.NoBlending,
      THREE.NormalBlending,
      THREE.AdditiveBlending,
      THREE.SubtractiveBlending,
      THREE.MultiplyBlending,
      THREE.CustomBlending
    ];

    if (!validModes.includes(mode)) {
      if (fieldName) {
        throw new Error(`Invalid blend mode for ${fieldName}: must be a valid THREE blending constant`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a depth test mode is valid
   */
  public isValidDepthTest(test: any, fieldName?: string): boolean {
    const validTests = [
      THREE.NeverDepth,
      THREE.AlwaysDepth,
      THREE.LessDepth,
      THREE.LessEqualDepth,
      THREE.EqualDepth,
      THREE.GreaterEqualDepth,
      THREE.GreaterDepth,
      THREE.NotEqualDepth
    ];

    if (!validTests.includes(test)) {
      if (fieldName) {
        throw new Error(`Invalid depth test for ${fieldName}: must be a valid THREE depth test constant`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a cull face mode is valid
   */
  public isValidCullFace(face: any, fieldName?: string): boolean {
    const validFaces = [
      THREE.CullFaceNone,
      THREE.CullFaceBack,
      THREE.CullFaceFront,
      THREE.CullFaceFrontBack
    ];

    if (!validFaces.includes(face)) {
      if (fieldName) {
        throw new Error(`Invalid cull face for ${fieldName}: must be a valid THREE cull face constant`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a front face direction is valid
   */
  public isValidFrontFaceDirection(direction: any, fieldName?: string): boolean {
    const validDirections = [
      THREE.FrontFaceDirectionCW,
      THREE.FrontFaceDirectionCCW
    ];

    if (!validDirections.includes(direction)) {
      if (fieldName) {
        throw new Error(`Invalid front face direction for ${fieldName}: must be a valid THREE front face direction`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a side mode is valid
   */
  public isValidSideMode(side: any, fieldName?: string): boolean {
    const validSides = [
      THREE.FrontSide,
      THREE.BackSide,
      THREE.DoubleSide
    ];

    if (!validSides.includes(side)) {
      if (fieldName) {
        throw new Error(`Invalid side mode for ${fieldName}: must be a valid THREE side constant`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a shadow type is valid
   */
  public isValidShadowType(type: any, fieldName?: string): boolean {
    const validTypes = [
      THREE.BasicShadowMap,
      THREE.PCFShadowMap,
      THREE.PCFSoftShadowMap,
      THREE.VSMShadowMap
    ];

    if (!validTypes.includes(type)) {
      if (fieldName) {
        throw new Error(`Invalid shadow type for ${fieldName}: must be a valid THREE shadow map type`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a tone mapping mode is valid
   */
  public isValidToneMapping(mapping: any, fieldName?: string): boolean {
    const validMappings = [
      THREE.NoToneMapping,
      THREE.LinearToneMapping,
      THREE.ReinhardToneMapping,
      THREE.CineonToneMapping,
      THREE.ACESFilmicToneMapping,
      THREE.AgXToneMapping,
      THREE.NeutralToneMapping
    ];

    if (!validMappings.includes(mapping)) {
      if (fieldName) {
        throw new Error(`Invalid tone mapping for ${fieldName}: must be a valid THREE tone mapping constant`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that an output color space is valid
   */
  public isValidOutputColorSpace(space: any, fieldName?: string): boolean {
    const validSpaces = [
      THREE.SRGBColorSpace,
      THREE.LinearSRGBColorSpace,
      THREE.DisplayP3ColorSpace
    ];

    if (!validSpaces.includes(space)) {
      if (fieldName) {
        throw new Error(`Invalid output color space for ${fieldName}: must be a valid THREE color space`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a working color space is valid
   */
  public isValidWorkingColorSpace(space: any, fieldName?: string): boolean {
    const validSpaces = [
      THREE.SRGBColorSpace,
      THREE.LinearSRGBColorSpace
    ];

    if (!validSpaces.includes(space)) {
      if (fieldName) {
        throw new Error(`Invalid working color space for ${fieldName}: must be a valid THREE color space`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a pixel ratio is valid
   */
  public isValidPixelRatio(ratio: any, fieldName?: string): boolean {
    if (!this.isValidNumber(ratio, fieldName)) {
      return false;
    }

    if (ratio <= 0) {
      if (fieldName) {
        throw new Error(`Invalid pixel ratio for ${fieldName}: must be positive`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a size value is valid
   */
  public isValidSize(size: any, fieldName?: string): boolean {
    if (!this.isValidNumber(size, fieldName)) {
      return false;
    }

    if (size <= 0) {
      if (fieldName) {
        throw new Error(`Invalid size for ${fieldName}: must be positive`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a position is valid
   */
  public isValidPosition(position: any, fieldName?: string): boolean {
    if (typeof position === 'object' && position !== null) {
      if ('x' in position && 'y' in position && 'z' in position) {
        return this.isValidNumber(position.x, `${fieldName}.x`) &&
               this.isValidNumber(position.y, `${fieldName}.y`) &&
               this.isValidNumber(position.z, `${fieldName}.z`);
      }
    }

    if (fieldName) {
      throw new Error(`Invalid position for ${fieldName}: must be an object with x, y, z properties`);
    }
    return false;
  }

  /**
   * Validates that a rotation is valid
   */
  public isValidRotation(rotation: any, fieldName?: string): boolean {
    if (typeof rotation === 'object' && rotation !== null) {
      if ('x' in rotation && 'y' in rotation && 'z' in rotation) {
        return this.isValidNumber(rotation.x, `${fieldName}.x`) &&
               this.isValidNumber(rotation.y, `${fieldName}.y`) &&
               this.isValidNumber(rotation.z, `${fieldName}.z`);
      }
    }

    if (fieldName) {
      throw new Error(`Invalid rotation for ${fieldName}: must be an object with x, y, z properties`);
    }
    return false;
  }

  /**
   * Validates that a scale is valid
   */
  public isValidScale(scale: any, fieldName?: string): boolean {
    if (typeof scale === 'object' && scale !== null) {
      if ('x' in scale && 'y' in scale && 'z' in scale) {
        return this.isValidNumber(scale.x, `${fieldName}.x`) &&
               this.isValidNumber(scale.y, `${fieldName}.y`) &&
               this.isValidNumber(scale.z, `${fieldName}.z`);
      }
    } else if (typeof scale === 'number') {
      return this.isValidNumber(scale, fieldName) && scale > 0;
    }

    if (fieldName) {
      throw new Error(`Invalid scale for ${fieldName}: must be a number or object with x, y, z properties`);
    }
    return false;
  }

  /**
   * Validates that a transform is valid
   */
  public isValidTransform(transform: any, fieldName?: string): boolean {
    if (!transform || typeof transform !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid transform for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (transform.position && !this.isValidPosition(transform.position, `${fieldName}.position`)) {
      return false;
    }

    if (transform.rotation && !this.isValidRotation(transform.rotation, `${fieldName}.rotation`)) {
      return false;
    }

    if (transform.scale && !this.isValidScale(transform.scale, `${fieldName}.scale`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a bounds object is valid
   */
  public isValidBounds(bounds: any, fieldName?: string): boolean {
    if (!bounds || typeof bounds !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid bounds for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (bounds.min && !this.isValidPosition(bounds.min, `${fieldName}.min`)) {
      return false;
    }

    if (bounds.max && !this.isValidPosition(bounds.max, `${fieldName}.max`)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a range is valid
   */
  public isValidRange(range: any, fieldName?: string): boolean {
    if (!range || typeof range !== 'object') {
      if (fieldName) {
        throw new Error(`Invalid range for ${fieldName}: must be an object`);
      }
      return false;
    }

    if (!this.isValidNumber(range.min, `${fieldName}.min`) ||
        !this.isValidNumber(range.max, `${fieldName}.max`)) {
      return false;
    }

    if (range.min >= range.max) {
      if (fieldName) {
        throw new Error(`Invalid range for ${fieldName}: min must be less than max`);
      }
      return false;
    }

    return true;
  }

  /**
   * Validates that a filter function is valid
   */
  public isValidFilter(filter: any, fieldName?: string): boolean {
    if (typeof filter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid filter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a sort function is valid
   */
  public isValidSort(sort: any, fieldName?: string): boolean {
    if (typeof sort !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid sort for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a map function is valid
   */
  public isValidMap(map: any, fieldName?: string): boolean {
    if (typeof map !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid map for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a reduce function is valid
   */
  public isValidReduce(reduce: any, fieldName?: string): boolean {
    if (typeof reduce !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid reduce for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a predicate function is valid
   */
  public isValidPredicate(predicate: any, fieldName?: string): boolean {
    if (typeof predicate !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid predicate for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a comparison function is valid
   */
  public isValidComparison(comparison: any, fieldName?: string): boolean {
    if (typeof comparison !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid comparison for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a hash function is valid
   */
  public isValidHash(hash: any, fieldName?: string): boolean {
    if (typeof hash !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid hash for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a serializer function is valid
   */
  public isValidSerializer(serializer: any, fieldName?: string): boolean {
    if (typeof serializer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid serializer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a deserializer function is valid
   */
  public isValidDeserializer(deserializer: any, fieldName?: string): boolean {
    if (typeof deserializer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid deserializer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a validator function is valid
   */
  public isValidValidator(validator: any, fieldName?: string): boolean {
    if (typeof validator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid validator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a transformer function is valid
   */
  public isValidTransformer(transformer: any, fieldName?: string): boolean {
    if (typeof transformer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid transformer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a normalizer function is valid
   */
  public isValidNormalizer(normalizer: any, fieldName?: string): boolean {
    if (typeof normalizer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid normalizer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a formatter function is valid
   */
  public isValidFormatter(formatter: any, fieldName?: string): boolean {
    if (typeof formatter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid formatter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a parser function is valid
   */
  public isValidParser(parser: any, fieldName?: string): boolean {
    if (typeof parser !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid parser for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a matcher function is valid
   */
  public isValidMatcher(matcher: any, fieldName?: string): boolean {
    if (typeof matcher !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid matcher for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a selector function is valid
   */
  public isValidSelector(selector: any, fieldName?: string): boolean {
    if (typeof selector !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid selector for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a projector function is valid
   */
  public isValidProjector(projector: any, fieldName?: string): boolean {
    if (typeof projector !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid projector for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a aggregator function is valid
   */
  public isValidAggregator(aggregator: any, fieldName?: string): boolean {
    if (typeof aggregator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid aggregator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a grouper function is valid
   */
  public isValidGrouper(grouper: any, fieldName?: string): boolean {
    if (typeof grouper !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid grouper for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a partitioner function is valid
   */
  public isValidPartitioner(partitioner: any, fieldName?: string): boolean {
    if (typeof partitioner !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid partitioner for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a sampler function is valid
   */
  public isValidSampler(sampler: any, fieldName?: string): boolean {
    if (typeof sampler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid sampler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a generator function is valid
   */
  public isValidGenerator(generator: any, fieldName?: string): boolean {
    if (typeof generator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid generator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a consumer function is valid
   */
  public isValidConsumer(consumer: any, fieldName?: string): boolean {
    if (typeof consumer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid consumer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a supplier function is valid
   */
  public isValidSupplier(supplier: any, fieldName?: string): boolean {
    if (typeof supplier !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid supplier for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a runnable function is valid
   */
  public isValidRunnable(runnable: any, fieldName?: string): boolean {
    if (typeof runnable !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid runnable for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a callable function is valid
   */
  public isValidCallable(callable: any, fieldName?: string): boolean {
    if (typeof callable !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid callable for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an executor function is valid
   */
  public isValidExecutor(executor: any, fieldName?: string): boolean {
    if (typeof executor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid executor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a scheduler function is valid
   */
  public isValidScheduler(scheduler: any, fieldName?: string): boolean {
    if (typeof scheduler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid scheduler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a listener function is valid
   */
  public isValidListener(listener: any, fieldName?: string): boolean {
    if (typeof listener !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid listener for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a handler function is valid
   */
  public isValidHandler(handler: any, fieldName?: string): boolean {
    if (typeof handler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid handler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a middleware function is valid
   */
  public isValidMiddleware(middleware: any, fieldName?: string): boolean {
    if (typeof middleware !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid middleware for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a decorator function is valid
   */
  public isValidDecorator(decorator: any, fieldName?: string): boolean {
    if (typeof decorator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid decorator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an interceptor function is valid
   */
  public isValidInterceptor(interceptor: any, fieldName?: string): boolean {
    if (typeof interceptor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid interceptor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a guard function is valid
   */
  public isValidGuard(guard: any, fieldName?: string): boolean {
    if (typeof guard !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid guard for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a pipe function is valid
   */
  public isValidPipe(pipe: any, fieldName?: string): boolean {
    if (typeof pipe !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid pipe for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a compose function is valid
   */
  public isValidCompose(compose: any, fieldName?: string): boolean {
    if (typeof compose !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid compose for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a chain function is valid
   */
  public isValidChain(chain: any, fieldName?: string): boolean {
    if (typeof chain !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid chain for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a flow function is valid
   */
  public isValidFlow(flow: any, fieldName?: string): boolean {
    if (typeof flow !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid flow for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a sequence function is valid
   */
  public isValidSequence(sequence: any, fieldName?: string): boolean {
    if (typeof sequence !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid sequence for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a parallel function is valid
   */
  public isValidParallel(parallel: any, fieldName?: string): boolean {
    if (typeof parallel !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid parallel for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a race function is valid
   */
  public isValidRace(race: any, fieldName?: string): boolean {
    if (typeof race !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid race for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a retry function is valid
   */
  public isValidRetry(retry: any, fieldName?: string): boolean {
    if (typeof retry !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid retry for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a fallback function is valid
   */
  public isValidFallback(fallback: any, fieldName?: string): boolean {
    if (typeof fallback !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid fallback for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a circuit breaker function is valid
   */
  public isValidCircuitBreaker(circuitBreaker: any, fieldName?: string): boolean {
    if (typeof circuitBreaker !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid circuit breaker for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a rate limiter function is valid
   */
  public isValidRateLimiter(rateLimiter: any, fieldName?: string): boolean {
    if (typeof rateLimiter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid rate limiter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a debounce function is valid
   */
  public isValidDebounce(debounce: any, fieldName?: string): boolean {
    if (typeof debounce !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid debounce for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a throttle function is valid
   */
  public isValidThrottle(throttle: any, fieldName?: string): boolean {
    if (typeof throttle !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid throttle for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a memoize function is valid
   */
  public isValidMemoize(memoize: any, fieldName?: string): boolean {
    if (typeof memoize !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid memoize for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a cache function is valid
   */
  public isValidCache(cache: any, fieldName?: string): boolean {
    if (typeof cache !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid cache for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a logger function is valid
   */
  public isValidLogger(logger: any, fieldName?: string): boolean {
    if (typeof logger !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid logger for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a tracer function is valid
   */
  public isValidTracer(tracer: any, fieldName?: string): boolean {
    if (typeof tracer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid tracer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a profiler function is valid
   */
  public isValidProfiler(profiler: any, fieldName?: string): boolean {
    if (typeof profiler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid profiler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a monitor function is valid
   */
  public isValidMonitor(monitor: any, fieldName?: string): boolean {
    if (typeof monitor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid monitor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a debugger function is valid
   */
  public isValidDebugger(debugFunction: any, fieldName?: string): boolean {
    if (typeof debugFunction !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid debugger for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a tester function is valid
   */
  public isValidTester(tester: any, fieldName?: string): boolean {
    if (typeof tester !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid tester for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a matcher function is valid
   */
  public isValidMatcher(matcher: any, fieldName?: string): boolean {
    if (typeof matcher !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid matcher for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a selector function is valid
   */
  public isValidSelector(selector: any, fieldName?: string): boolean {
    if (typeof selector !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid selector for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a projector function is valid
   */
  public isValidProjector(projector: any, fieldName?: string): boolean {
    if (typeof projector !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid projector for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a aggregator function is valid
   */
  public isValidAggregator(aggregator: any, fieldName?: string): boolean {
    if (typeof aggregator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid aggregator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a grouper function is valid
   */
  public isValidGrouper(grouper: any, fieldName?: string): boolean {
    if (typeof grouper !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid grouper for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a partitioner function is valid
   */
  public isValidPartitioner(partitioner: any, fieldName?: string): boolean {
    if (typeof partitioner !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid partitioner for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a sampler function is valid
   */
  public isValidSampler(sampler: any, fieldName?: string): boolean {
    if (typeof sampler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid sampler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a generator function is valid
   */
  public isValidGenerator(generator: any, fieldName?: string): boolean {
    if (typeof generator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid generator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a consumer function is valid
   */
  public isValidConsumer(consumer: any, fieldName?: string): boolean {
    if (typeof consumer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid consumer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a supplier function is valid
   */
  public isValidSupplier(supplier: any, fieldName?: string): boolean {
    if (typeof supplier !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid supplier for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a runnable function is valid
   */
  public isValidRunnable(runnable: any, fieldName?: string): boolean {
    if (typeof runnable !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid runnable for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a callable function is valid
   */
  public isValidCallable(callable: any, fieldName?: string): boolean {
    if (typeof callable !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid callable for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an executor function is valid
   */
  public isValidExecutor(executor: any, fieldName?: string): boolean {
    if (typeof executor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid executor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a scheduler function is valid
   */
  public isValidScheduler(scheduler: any, fieldName?: string): boolean {
    if (typeof scheduler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid scheduler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a listener function is valid
   */
  public isValidListener(listener: any, fieldName?: string): boolean {
    if (typeof listener !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid listener for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a handler function is valid
   */
  public isValidHandler(handler: any, fieldName?: string): boolean {
    if (typeof handler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid handler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a middleware function is valid
   */
  public isValidMiddleware(middleware: any, fieldName?: string): boolean {
    if (typeof middleware !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid middleware for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a decorator function is valid
   */
  public isValidDecorator(decorator: any, fieldName?: string): boolean {
    if (typeof decorator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid decorator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an interceptor function is valid
   */
  public isValidInterceptor(interceptor: any, fieldName?: string): boolean {
    if (typeof interceptor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid interceptor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a guard function is valid
   */
  public isValidGuard(guard: any, fieldName?: string): boolean {
    if (typeof guard !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid guard for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a pipe function is valid
   */
  public isValidPipe(pipe: any, fieldName?: string): boolean {
    if (typeof pipe !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid pipe for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a compose function is valid
   */
  public isValidCompose(compose: any, fieldName?: string): boolean {
    if (typeof compose !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid compose for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a chain function is valid
   */
  public isValidChain(chain: any, fieldName?: string): boolean {
    if (typeof chain !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid chain for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a flow function is valid
   */
  public isValidFlow(flow: any, fieldName?: string): boolean {
    if (typeof flow !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid flow for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a sequence function is valid
   */
  public isValidSequence(sequence: any, fieldName?: string): boolean {
    if (typeof sequence !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid sequence for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a parallel function is valid
   */
  public isValidParallel(parallel: any, fieldName?: string): boolean {
    if (typeof parallel !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid parallel for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a race function is valid
   */
  public isValidRace(race: any, fieldName?: string): boolean {
    if (typeof race !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid race for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a retry function is valid
   */
  public isValidRetry(retry: any, fieldName?: string): boolean {
    if (typeof retry !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid retry for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a fallback function is valid
   */
  public isValidFallback(fallback: any, fieldName?: string): boolean {
    if (typeof fallback !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid fallback for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a circuit breaker function is valid
   */
  public isValidCircuitBreaker(circuitBreaker: any, fieldName?: string): boolean {
    if (typeof circuitBreaker !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid circuit breaker for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a rate limiter function is valid
   */
  public isValidRateLimiter(rateLimiter: any, fieldName?: string): boolean {
    if (typeof rateLimiter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid rate limiter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a debounce function is valid
   */
  public isValidDebounce(debounce: any, fieldName?: string): boolean {
    if (typeof debounce !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid debounce for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a throttle function is valid
   */
  public isValidThrottle(throttle: any, fieldName?: string): boolean {
    if (typeof throttle !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid throttle for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a memoize function is valid
   */
  public isValidMemoize(memoize: any, fieldName?: string): boolean {
    if (typeof memoize !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid memoize for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a cache function is valid
   */
  public isValidCache(cache: any, fieldName?: string): boolean {
    if (typeof cache !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid cache for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a logger function is valid
   */
  public isValidLogger(logger: any, fieldName?: string): boolean {
    if (typeof logger !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid logger for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a tracer function is valid
   */
  public isValidTracer(tracer: any, fieldName?: string): boolean {
    if (typeof tracer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid tracer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a profiler function is valid
   */
  public isValidProfiler(profiler: any, fieldName?: string): boolean {
    if (typeof profiler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid profiler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a monitor function is valid
   */
  public isValidMonitor(monitor: any, fieldName?: string): boolean {
    if (typeof monitor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid monitor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a debugger function is valid
   */
  public isValidDebugger(debugFunction: any, fieldName?: string): boolean {
    if (typeof debugFunction !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid debugger for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a tester function is valid
   */
  public isValidTester(tester: any, fieldName?: string): boolean {
    if (typeof tester !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid tester for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a benchmark function is valid
   */
  public isValidBenchmark(benchmark: any, fieldName?: string): boolean {
    if (typeof benchmark !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid benchmark for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a metric function is valid
   */
  public isValidMetric(metric: any, fieldName?: string): boolean {
    if (typeof metric !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid metric for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a gauge function is valid
   */
  public isValidGauge(gauge: any, fieldName?: string): boolean {
    if (typeof gauge !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid gauge for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a counter function is valid
   */
  public isValidCounter(counter: any, fieldName?: string): boolean {
    if (typeof counter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid counter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a histogram function is valid
   */
  public isValidHistogram(histogram: any, fieldName?: string): boolean {
    if (typeof histogram !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid histogram for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a summary function is valid
   */
  public isValidSummary(summary: any, fieldName?: string): boolean {
    if (typeof summary !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid summary for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a timer function is valid
   */
  public isValidTimer(timer: any, fieldName?: string): boolean {
    if (typeof timer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid timer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a meter function is valid
   */
  public isValidMeter(meter: any, fieldName?: string): boolean {
    if (typeof meter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid meter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a registry function is valid
   */
  public isValidRegistry(registry: any, fieldName?: string): boolean {
    if (typeof registry !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid registry for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a collector function is valid
   */
  public isValidCollector(collector: any, fieldName?: string): boolean {
    if (typeof collector !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid collector for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an exporter function is valid
   */
  public isValidExporter(exporter: any, fieldName?: string): boolean {
    if (typeof exporter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid exporter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an importer function is valid
   */
  public isValidImporter(importer: any, fieldName?: string): boolean {
    if (typeof importer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid importer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a serializer function is valid
   */
  public isValidSerializer(serializer: any, fieldName?: string): boolean {
    if (typeof serializer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid serializer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a deserializer function is valid
   */
  public isValidDeserializer(deserializer: any, fieldName?: string): boolean {
    if (typeof deserializer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid deserializer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a compressor function is valid
   */
  public isValidCompressor(compressor: any, fieldName?: string): boolean {
    if (typeof compressor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid compressor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a decompressor function is valid
   */
  public isValidDecompressor(decompressor: any, fieldName?: string): boolean {
    if (typeof decompressor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid decompressor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an encryptor function is valid
   */
  public isValidEncryptor(encryptor: any, fieldName?: string): boolean {
    if (typeof encryptor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid encryptor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a decryptor function is valid
   */
  public isValidDecryptor(decryptor: any, fieldName?: string): boolean {
    if (typeof decryptor !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid decryptor for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a hasher function is valid
   */
  public isValidHasher(hasher: any, fieldName?: string): boolean {
    if (typeof hasher !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid hasher for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a signer function is valid
   */
  public isValidSigner(signer: any, fieldName?: string): boolean {
    if (typeof signer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid signer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a verifier function is valid
   */
  public isValidVerifier(verifier: any, fieldName?: string): boolean {
    if (typeof verifier !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid verifier for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a validator function is valid
   */
  public isValidValidator(validator: any, fieldName?: string): boolean {
    if (typeof validator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid validator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a sanitizer function is valid
   */
  public isValidSanitizer(sanitizer: any, fieldName?: string): boolean {
    if (typeof sanitizer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid sanitizer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a normalizer function is valid
   */
  public isValidNormalizer(normalizer: any, fieldName?: string): boolean {
    if (typeof normalizer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid normalizer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a formatter function is valid
   */
  public isValidFormatter(formatter: any, fieldName?: string): boolean {
    if (typeof formatter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid formatter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a parser function is valid
   */
  public isValidParser(parser: any, fieldName?: string): boolean {
    if (typeof parser !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid parser for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a lexer function is valid
   */
  public isValidLexer(lexer: any, fieldName?: string): boolean {
    if (typeof lexer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid lexer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a tokenizer function is valid
   */
  public isValidTokenizer(tokenizer: any, fieldName?: string): boolean {
    if (typeof tokenizer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid tokenizer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a compiler function is valid
   */
  public isValidCompiler(compiler: any, fieldName?: string): boolean {
    if (typeof compiler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid compiler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an interpreter function is valid
   */
  public isValidInterpreter(interpreter: any, fieldName?: string): boolean {
    if (typeof interpreter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid interpreter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a transpiler function is valid
   */
  public isValidTranspiler(transpiler: any, fieldName?: string): boolean {
    if (typeof transpiler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid transpiler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a bundler function is valid
   */
  public isValidBundler(bundler: any, fieldName?: string): boolean {
    if (typeof bundler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid bundler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a minifier function is valid
   */
  public isValidMinifier(minifier: any, fieldName?: string): boolean {
    if (typeof minifier !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid minifier for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a linter function is valid
   */
  public isValidLinter(linter: any, fieldName?: string): boolean {
    if (typeof linter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid linter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a formatter function is valid
   */
  public isValidFormatter(formatter: any, fieldName?: string): boolean {
    if (typeof formatter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid formatter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a tester function is valid
   */
  public isValidTester(tester: any, fieldName?: string): boolean {
    if (typeof tester !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid tester for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a mocker function is valid
   */
  public isValidMocker(mocker: any, fieldName?: string): boolean {
    if (typeof mocker !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid mocker for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a stubber function is valid
   */
  public isValidStubber(stubber: any, fieldName?: string): boolean {
    if (typeof stubber !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid stubber for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a spier function is valid
   */
  public isValidSpier(spier: any, fieldName?: string): boolean {
    if (typeof spier !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid spier for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a faker function is valid
   */
  public isValidFaker(faker: any, fieldName?: string): boolean {
    if (typeof faker !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid faker for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a seeder function is valid
   */
  public isValidSeeder(seeder: any, fieldName?: string): boolean {
    if (typeof seeder !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid seeder for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a migrator function is valid
   */
  public isValidMigrator(migrator: any, fieldName?: string): boolean {
    if (typeof migrator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid migrator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a backup function is valid
   */
  public isValidBackup(backup: any, fieldName?: string): boolean {
    if (typeof backup !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid backup for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a restore function is valid
   */
  public isValidRestore(restore: any, fieldName?: string): boolean {
    if (typeof restore !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid restore for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a sync function is valid
   */
  public isValidSync(sync: any, fieldName?: string): boolean {
    if (typeof sync !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid sync for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an async function is valid
   */
  public isValidAsync(async: any, fieldName?: string): boolean {
    if (typeof async !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid async for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a promise function is valid
   */
  public isValidPromise(promise: any, fieldName?: string): boolean {
    if (typeof promise !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid promise for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an observable function is valid
   */
  public isValidObservable(observable: any, fieldName?: string): boolean {
    if (typeof observable !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid observable for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a stream function is valid
   */
  public isValidStream(stream: any, fieldName?: string): boolean {
    if (typeof stream !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid stream for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an iterator function is valid
   */
  public isValidIterator(iterator: any, fieldName?: string): boolean {
    if (typeof iterator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid iterator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a generator function is valid
   */
  public isValidGenerator(generator: any, fieldName?: string): boolean {
    if (typeof generator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid generator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an async iterator function is valid
   */
  public isValidAsyncIterator(asyncIterator: any, fieldName?: string): boolean {
    if (typeof asyncIterator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid async iterator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an async generator function is valid
   */
  public isValidAsyncGenerator(asyncGenerator: any, fieldName?: string): boolean {
    if (typeof asyncGenerator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid async generator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a subject function is valid
   */
  public isValidSubject(subject: any, fieldName?: string): boolean {
    if (typeof subject !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid subject for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a behavior subject function is valid
   */
  public isValidBehaviorSubject(behaviorSubject: any, fieldName?: string): boolean {
    if (typeof behaviorSubject !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid behavior subject for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a replay subject function is valid
   */
  public isValidReplaySubject(replaySubject: any, fieldName?: string): boolean {
    if (typeof replaySubject !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid replay subject for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a scheduler function is valid
   */
  public isValidScheduler(scheduler: any, fieldName?: string): boolean {
    if (typeof scheduler !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid scheduler for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an operator function is valid
   */
  public isValidOperator(operator: any, fieldName?: string): boolean {
    if (typeof operator !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid operator for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a pipe function is valid
   */
  public isValidPipe(pipe: any, fieldName?: string): boolean {
    if (typeof pipe !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid pipe for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a tap function is valid
   */
  public isValidTap(tap: any, fieldName?: string): boolean {
    if (typeof tap !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid tap for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a filter function is valid
   */
  public isValidFilter(filter: any, fieldName?: string): boolean {
    if (typeof filter !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid filter for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a map function is valid
   */
  public isValidMap(map: any, fieldName?: string): boolean {
    if (typeof map !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid map for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a reduce function is valid
   */
  public isValidReduce(reduce: any, fieldName?: string): boolean {
    if (typeof reduce !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid reduce for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a scan function is valid
   */
  public isValidScan(scan: any, fieldName?: string): boolean {
    if (typeof scan !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid scan for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a merge function is valid
   */
  public isValidMerge(merge: any, fieldName?: string): boolean {
    if (typeof merge !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid merge for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a combine function is valid
   */
  public isValidCombine(combine: any, fieldName?: string): boolean {
    if (typeof combine !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid combine for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a zip function is valid
   */
  public isValidZip(zip: any, fieldName?: string): boolean {
    if (typeof zip !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid zip for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a fork function is valid
   */
  public isValidFork(fork: any, fieldName?: string): boolean {
    if (typeof fork !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid fork for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a join function is valid
   */
  public isValidJoin(join: any, fieldName?: string): boolean {
    if (typeof join !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid join for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a switch function is valid
   */
  public isValidSwitch(switch_: any, fieldName?: string): boolean {
    if (typeof switch_ !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid switch for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a debounce function is valid
   */
  public isValidDebounce(debounce: any, fieldName?: string): boolean {
    if (typeof debounce !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid debounce for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a throttle function is valid
   */
  public isValidThrottle(throttle: any, fieldName?: string): boolean {
    if (typeof throttle !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid throttle for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a buffer function is valid
   */
  public isValidBuffer(buffer: any, fieldName?: string): boolean {
    if (typeof buffer !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid buffer for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a window function is valid
   */
  public isValidWindow(window: any, fieldName?: string): boolean {
    if (typeof window !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid window for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a delay function is valid
   */
  public isValidDelay(delay: any, fieldName?: string): boolean {
    if (typeof delay !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid delay for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }


  /**
   * Validates that a retry function is valid
   */
  public isValidRetry(retry: any, fieldName?: string): boolean {
    if (typeof retry !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid retry for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a catch function is valid
   */
  public isValidCatch(catch_: any, fieldName?: string): boolean {
    if (typeof catch_ !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid catch for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a finally function is valid
   */
  public isValidFinally(finally_: any, fieldName?: string): boolean {
    if (typeof finally_ !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid finally for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a share function is valid
   */
  public isValidShare(share: any, fieldName?: string): boolean {
    if (typeof share !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid share for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a multicast function is valid
   */
  public isValidMulticast(multicast: any, fieldName?: string): boolean {
    if (typeof multicast !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid multicast for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a publish function is valid
   */
  public isValidPublish(publish: any, fieldName?: string): boolean {
    if (typeof publish !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid publish for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a connect function is valid
   */
  public isValidConnect(connect: any, fieldName?: string): boolean {
    if (typeof connect !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid connect for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a refCount function is valid
   */
  public isValidRefCount(refCount: any, fieldName?: string): boolean {
    if (typeof refCount !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid refCount for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a startWith function is valid
   */
  public isValidStartWith(startWith: any, fieldName?: string): boolean {
    if (typeof startWith !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid startWith for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an endWith function is valid
   */
  public isValidEndWith(endWith: any, fieldName?: string): boolean {
    if (typeof endWith !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid endWith for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a distinct function is valid
   */
  public isValidDistinct(distinct: any, fieldName?: string): boolean {
    if (typeof distinct !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid distinct for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a distinctUntilChanged function is valid
   */
  public isValidDistinctUntilChanged(distinctUntilChanged: any, fieldName?: string): boolean {
    if (typeof distinctUntilChanged !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid distinctUntilChanged for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a take function is valid
   */
  public isValidTake(take: any, fieldName?: string): boolean {
    if (typeof take !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid take for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a takeUntil function is valid
   */
  public isValidTakeUntil(takeUntil: any, fieldName?: string): boolean {
    if (typeof takeUntil !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid takeUntil for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a takeWhile function is valid
   */
  public isValidTakeWhile(takeWhile: any, fieldName?: string): boolean {
    if (typeof takeWhile !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid takeWhile for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a skip function is valid
   */
  public isValidSkip(skip: any, fieldName?: string): boolean {
    if (typeof skip !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid skip for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a skipUntil function is valid
   */
  public isValidSkipUntil(skipUntil: any, fieldName?: string): boolean {
    if (typeof skipUntil !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid skipUntil for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a skipWhile function is valid
   */
  public isValidSkipWhile(skipWhile: any, fieldName?: string): boolean {
    if (typeof skipWhile !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid skipWhile for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a first function is valid
   */
  public isValidFirst(first: any, fieldName?: string): boolean {
    if (typeof first !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid first for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a last function is valid
   */
  public isValidLast(last: any, fieldName?: string): boolean {
    if (typeof last !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid last for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an elementAt function is valid
   */
  public isValidElementAt(elementAt: any, fieldName?: string): boolean {
    if (typeof elementAt !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid elementAt for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a find function is valid
   */
  public isValidFind(find: any, fieldName?: string): boolean {
    if (typeof find !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid find for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a findIndex function is valid
   */
  public isValidFindIndex(findIndex: any, fieldName?: string): boolean {
    if (typeof findIndex !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid findIndex for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that an every function is valid
   */
  public isValidEvery(every: any, fieldName?: string): boolean {
    if (typeof every !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid every for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a some function is valid
   */
  public isValidSome(some: any, fieldName?: string): boolean {
    if (typeof some !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid some for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a count function is valid
   */
  public isValidCount(count: any, fieldName?: string): boolean {
    if (typeof count !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid count for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a min function is valid
   */
  public isValidMin(min: any, fieldName?: string): boolean {
    if (typeof min !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid min for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates that a max function is valid
   */
  public isValidMax(max: any, fieldName?: string): boolean {
    if (typeof max !== 'function') {
      if (fieldName) {
        throw new Error(`Invalid max for ${fieldName}: must be a function`);
      }
      return false;
    }
    return true;
  }

}
