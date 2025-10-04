import * as THREE from 'three';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { CameraSpec, NodeSpec, EdgeSpec } from '../types';

/**
 * Validation rule definition
 */
export interface ValidationRule<T = any> {
  name: string;
  validator: (value: T, context?: any) => boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  context?: Record<string, any>;
}

/**
 * Type guard function type
 */
export type TypeGuard<T> = (value: any) => value is T;

/**
 * Comprehensive validation and assertion system
 */
export class ValidationSystem {
  private static instance: ValidationSystem;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private disposed: boolean = false;

  private constructor() {
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.setupDefaultRules();
  }

  public static getInstance(): ValidationSystem {
    if (!ValidationSystem.instance) {
      ValidationSystem.instance = new ValidationSystem();
    }
    return ValidationSystem.instance;
  }

  /**
   * Set up default validation rules
   */
  private setupDefaultRules(): void {
    // Three.js Vector3 validation
    this.addRule('Vector3', {
      name: 'isValidVector3',
      validator: (value: any) => value instanceof THREE.Vector3 && this.isFiniteVector3(value),
      message: 'Must be a valid THREE.Vector3 with finite components',
      severity: 'error',
    });

    // Camera specification validation
    this.addRule('CameraSpec', {
      name: 'isValidCameraSpec',
      validator: (value: any) => this.isValidCameraSpec(value),
      message: 'Must be a valid camera specification',
      severity: 'error',
    });

    // Node specification validation
    this.addRule('NodeSpec', {
      name: 'isValidNodeSpec',
      validator: (value: any) => this.isValidNodeSpec(value),
      message: 'Must be a valid node specification',
      severity: 'error',
    });

    // Edge specification validation
    this.addRule('EdgeSpec', {
      name: 'isValidEdgeSpec',
      validator: (value: any) => this.isValidEdgeSpec(value),
      message: 'Must be a valid edge specification',
      severity: 'error',
    });

    // Animation options validation
    this.addRule('AnimationOptions', {
      name: 'isValidAnimationOptions',
      validator: (value: any) => this.isValidAnimationOptions(value),
      message: 'Must be valid animation options',
      severity: 'error',
    });
  }

  /**
   * Add a validation rule for a specific type
   */
  public addRule<T>(type: string, rule: ValidationRule<T>): void {
    if (this.disposed) {
      this.logger.warn('ValidationSystem', 'Cannot add rule - ValidationSystem is disposed');
      return;
    }

    if (!this.validationRules.has(type)) {
      this.validationRules.set(type, []);
    }

    this.validationRules.get(type)!.push(rule);
    this.logger.debug('ValidationSystem', `Added validation rule: ${rule.name} for type ${type}`);
  }

  /**
   * Validate a value against all rules for its type
   */
  public validate<T>(value: T, type: string, context?: Record<string, any>): ValidationResult {
    if (this.disposed) {
      return {
        isValid: false,
        errors: ['ValidationSystem is disposed'],
        warnings: [],
        info: [],
        context,
      };
    }

    const rules = this.validationRules.get(type) || [];
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      context,
    };

    for (const rule of rules) {
      try {
        const isValid = rule.validator(value, context);

        if (!isValid) {
          const message = rule.message || `Validation failed for rule: ${rule.name}`;
          switch (rule.severity) {
            case 'error':
              result.errors.push(message);
              result.isValid = false;
              break;
            case 'warning':
              result.warnings.push(message);
              break;
            case 'info':
              result.info.push(message);
              break;
          }
        }
      } catch (error) {
        const message = `Validation rule ${rule.name} threw an error: ${error}`;
        result.errors.push(message);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Assert that a value is valid, throwing an error if not
   */
  public assert<T>(value: T, type: string, context?: Record<string, any>): T {
    const result = this.validate(value, type, context);

    if (!result.isValid) {
      const errorMessage = `Validation failed for type ${type}: ${result.errors.join(', ')}`;
      this.logger.error('ValidationSystem', errorMessage, { value, context, result });
      throw new Error(errorMessage);
    }

    return value;
  }

  /**
   * Type guard for THREE.Vector3
   */
  public isVector3(value: any): value is THREE.Vector3 {
    return value instanceof THREE.Vector3 && this.isFiniteVector3(value);
  }

  /**
   * Type guard for camera specification
   */
  public isCameraSpec(value: any): value is Partial<CameraSpec> {
    return this.isValidCameraSpec(value);
  }

  /**
   * Type guard for node specification
   */
  public isNodeSpec(value: any): value is NodeSpec {
    return this.isValidNodeSpec(value);
  }

  /**
   * Type guard for edge specification
   */
  public isEdgeSpec(value: any): value is EdgeSpec {
    return this.isValidEdgeSpec(value);
  }

  /**
   * Validate THREE.Vector3 components are finite
   */
  private isFiniteVector3(vector: THREE.Vector3): boolean {
    return isFinite(vector.x) && isFinite(vector.y) && isFinite(vector.z);
  }

  /**
   * Validate camera specification
   */
  private isValidCameraSpec(spec: any): boolean {
    if (!spec || typeof spec !== 'object') return false;

    if (spec.distance !== undefined && (typeof spec.distance !== 'number' || !isFinite(spec.distance))) {
      return false;
    }

    if (spec.phi !== undefined && (typeof spec.phi !== 'number' || !isFinite(spec.phi))) {
      return false;
    }

    if (spec.theta !== undefined && (typeof spec.theta !== 'number' || !isFinite(spec.theta))) {
      return false;
    }

    if (spec.target !== undefined && !this.isVector3(spec.target)) {
      return false;
    }

    return true;
  }

  /**
   * Validate node specification
   */
  private isValidNodeSpec(node: any): boolean {
    if (!node || typeof node !== 'object') return false;
    if (!node.id || typeof node.id !== 'string' || node.id.trim().length === 0) return false;

    if (node.position !== undefined && !this.isVector3(node.position)) {
      return false;
    }

    return true;
  }

  /**
   * Validate edge specification
   */
  private isValidEdgeSpec(edge: any): boolean {
    if (!edge || typeof edge !== 'object') return false;
    if (!edge.id || typeof edge.id !== 'string' || edge.id.trim().length === 0) return false;
    if (!edge.source || typeof edge.source !== 'string' || edge.source.trim().length === 0) return false;
    if (!edge.target || typeof edge.target !== 'string' || edge.target.trim().length === 0) return false;

    return true;
  }

  /**
   * Validate animation options
   */
  private isValidAnimationOptions(options: any): boolean {
    if (!options || typeof options !== 'object') return false;

    if (options.duration !== undefined && (typeof options.duration !== 'number' || options.duration < 0)) {
      return false;
    }

    if (options.easing !== undefined && typeof options.easing !== 'string' && typeof options.easing !== 'function') {
      return false;
    }

    return true;
  }

  /**
   * Validate that a value is within specified bounds
   */
  public isWithinBounds(value: number, min?: number, max?: number): boolean {
    if (!isFinite(value)) return false;

    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;

    return true;
  }

  /**
   * Validate that an array is not empty
   */
  public isNonEmptyArray<T>(array: T[] | undefined | null): array is T[] {
    return Array.isArray(array) && array.length > 0;
  }

  /**
   * Validate that a string is not empty
   */
  public isNonEmptyString(value: any): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Validate that an object has required properties
   */
  public hasRequiredProperties<T extends Record<string, any>>(
    obj: any,
    requiredProps: (keyof T)[]
  ): obj is T {
    if (!obj || typeof obj !== 'object') return false;

    for (const prop of requiredProps) {
      if (!(prop in obj)) return false;
    }

    return true;
  }

  /**
   * Validate that a number is positive
   */
  public isPositiveNumber(value: any): value is number {
    return typeof value === 'number' && isFinite(value) && value > 0;
  }

  /**
   * Validate that a number is non-negative
   */
  public isNonNegativeNumber(value: any): value is number {
    return typeof value === 'number' && isFinite(value) && value >= 0;
  }

  /**
   * Validate that a percentage is valid (0-1)
   */
  public isValidPercentage(value: any): value is number {
    return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 1;
  }

  /**
   * Validate that a color is valid
   */
  public isValidColor(color: any): boolean {
    if (typeof color === 'string') {
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    } else if (typeof color === 'number') {
      return isFinite(color) && color >= 0 && color <= 0xffffff;
    } else if (color instanceof THREE.Color) {
      return true;
    }
    return false;
  }

  /**
   * Validate that an easing function is valid
   */
  public isValidEasing(easing: any): boolean {
    const validEasings = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad'];
    return typeof easing === 'string' && validEasings.includes(easing) || typeof easing === 'function';
  }

  /**
   * Create a runtime type assertion decorator
   */
  public createTypeAssertion<T>(type: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const validationSystem = ValidationSystem.getInstance();

      descriptor.value = function (...args: any[]) {
        // Validate arguments based on type
        args.forEach((arg, index) => {
          const result = validationSystem.validate(arg, type, { method: propertyKey, argIndex: index });
          if (!result.isValid) {
            throw new Error(`Type validation failed for argument ${index} in ${propertyKey}: ${result.errors.join(', ')}`);
          }
        });

        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }

  /**
   * Get all validation rules for a type
   */
  public getRules(type: string): ValidationRule[] {
    return this.validationRules.get(type) || [];
  }

  /**
   * Remove all validation rules for a type
   */
  public clearRules(type: string): void {
    this.validationRules.delete(type);
  }

  /**
   * Dispose of the ValidationSystem
   */
  public dispose(): void {
    this.disposed = true;
    this.validationRules.clear();
  }
}