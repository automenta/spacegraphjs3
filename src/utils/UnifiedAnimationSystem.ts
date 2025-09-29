/**
 * Unified Animation System
 * Consolidates AnimationSystem, AnimationUtils, and EnhancedAnimationSystem
 * Provides a single, comprehensive animation framework
 */

import * as THREE from 'three';
import { animate } from 'popmotion';
import { BaseUtilitySystem } from './abstractions/BaseUtilitySystem';

// Animation types and interfaces
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string | ((t: number) => number);
  onComplete?: () => void;
  onUpdate?: (progress: number, value: any) => void;
  onStart?: () => void;
  loop?: boolean | number;
  yoyo?: boolean;
}

export interface Keyframe {
  time: number;
  value: any;
  easing?: string | ((t: number) => number);
}

export interface KeyframeAnimation {
  keyframes: Keyframe[];
  target: any;
  property: string;
}

export interface TweenAnimation {
  from: any;
  to: any;
  target: any;
  property: string;
}

export interface ParallelAnimation {
  animations: AnimationTask[];
  config?: AnimationConfig;
}

export interface SequenceAnimation {
  animations: AnimationTask[];
  config?: AnimationConfig;
}

export type AnimationTask = 
  | { type: 'tween'; animation: TweenAnimation; config: AnimationConfig }
  | { type: 'keyframe'; animation: KeyframeAnimation; config: AnimationConfig }
  | { type: 'parallel'; animation: ParallelAnimation; config: AnimationConfig }
  | { type: 'sequence'; animation: SequenceAnimation; config: AnimationConfig }
  | { type: 'callback'; callback: () => void | Promise<void>; config: AnimationConfig }
  | { type: 'spring'; target: any; property: string; to: any; config: AnimationConfig }
  | { type: 'decay'; target: any; property: string; from: any; config: AnimationConfig };

// Easing functions
export const EasingFunctions = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 2),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  bounce: (t: number) => {
    if (t < 1/2.75) return 7.5625 * t * t;
    if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
    if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
  },
  elastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  },
  back: (t: number) => {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  circ: (t: number) => 1 - Math.sqrt(1 - t * t),
  expo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  quad: (t: number) => t * t
};

/**
 * Unified Animation System
 * Provides comprehensive animation capabilities with performance optimization
 */
export class UnifiedAnimationSystem extends BaseUtilitySystem {
  private activeAnimations: Map<string, AnimationController> = new Map();
  private animationQueue: AnimationTask[] = [];
  private isProcessing = false;
  private animationIdCounter = 0;

  constructor() {
    super('UnifiedAnimation');
  }

  protected onInit(): void {
    // Initialize animation system
    this.animationIdCounter = 0;
  }

  protected onUpdate(deltaTime: number): void {
    // Update active animations
    for (const [id, controller] of this.activeAnimations.entries()) {
      if (!controller.isActive()) {
        this.activeAnimations.delete(id);
      }
    }
  }

  protected onPerformanceModeChanged(enabled: boolean): void {
    if (enabled) {
      // Reduce animation quality for better performance
      this.stopAll();
    }
  }

  protected onDispose(): void {
    this.stopAll();
    this.animationQueue = [];
  }

  /**
   * Create a simple tween animation
   */
  public tween(
    target: any,
    property: string,
    from: any,
    to: any,
    config: AnimationConfig = {}
  ): Promise<void> {
    return this.addAnimation({
      type: 'tween',
      animation: { target, property, from, to },
      config
    });
  }

  /**
   * Create a keyframe animation
   */
  public keyframe(animation: KeyframeAnimation, config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'keyframe',
      animation,
      config
    });
  }

  /**
   * Create a spring animation
   */
  public spring(
    target: any,
    property: string,
    to: any,
    config: AnimationConfig = {}
  ): Promise<void> {
    return this.addAnimation({
      type: 'spring',
      target,
      property,
      to,
      config
    });
  }

  /**
   * Create a decay animation
   */
  public decay(
    target: any,
    property: string,
    from: any,
    config: AnimationConfig = {}
  ): Promise<void> {
    return this.addAnimation({
      type: 'decay',
      target,
      property,
      from,
      config
    });
  }

  /**
   * Run animations in parallel
   */
  public parallel(animations: AnimationTask[], config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'parallel',
      animation: { animations, config },
      config
    });
  }

  /**
   * Run animations in sequence
   */
  public sequence(animations: AnimationTask[], config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'sequence',
      animation: { animations, config },
      config
    });
  }

  /**
   * Add a callback animation
   */
  public callback(callback: () => void | Promise<void>, config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'callback',
      callback,
      config
    });
  }

  /**
   * Create a bounce animation
   */
  public async bounce(
    target: any,
    property: string,
    intensity = 1,
    config: AnimationConfig = {}
  ): Promise<void> {
    const originalValue = this.cloneValue(target[property]);
    
    await this.tween(target, property, originalValue, this.offsetValue(originalValue, intensity), { duration: 100 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, -intensity * 0.5), { duration: 100 });
    await this.tween(target, property, target[property], originalValue, { duration: 100 });
  }

  /**
   * Create a shake animation
   */
  public async shake(
    target: any,
    property: string,
    intensity = 5,
    config: AnimationConfig = {}
  ): Promise<void> {
    const originalValue = this.cloneValue(target[property]);
    
    await this.tween(target, property, originalValue, this.offsetValue(originalValue, intensity), { duration: 50 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, -intensity), { duration: 50 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, intensity * 0.7), { duration: 50 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, -intensity * 0.7), { duration: 50 });
    await this.tween(target, property, target[property], originalValue, { duration: 50 });
  }

  /**
   * Stop all animations
   */
  public stopAll(): void {
    for (const controller of this.activeAnimations.values()) {
      controller.stop();
    }
    this.activeAnimations.clear();
    this.animationQueue = [];
    this.isProcessing = false;
  }

  /**
   * Pause all animations
   */
  public pauseAll(): void {
    for (const controller of this.activeAnimations.values()) {
      controller.pause();
    }
  }

  /**
   * Resume all animations
   */
  public resumeAll(): void {
    for (const controller of this.activeAnimations.values()) {
      controller.resume();
    }
  }

  /**
   * Add animation to queue
   */
  private addAnimation(task: AnimationTask): Promise<void> {
    return new Promise((resolve) => {
      const wrappedTask = {
        ...task,
        config: {
          ...task.config,
          onComplete: () => {
            if (task.config?.onComplete) task.config.onComplete();
            resolve();
          }
        }
      };

      this.animationQueue.push(wrappedTask);
      this.processQueue();
    });
  }

  /**
   * Process animation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.animationQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.animationQueue.length > 0) {
      const task = this.animationQueue.shift()!;
      await this.executeAnimation(task);
    }
    
    this.isProcessing = false;
  }

  /**
   * Execute individual animation task
   */
  private async executeAnimation(task: AnimationTask): Promise<void> {
    switch (task.type) {
      case 'tween':
        await this.executeTween(task);
        break;
      case 'keyframe':
        await this.executeKeyframe(task);
        break;
      case 'parallel':
        await this.executeParallel(task);
        break;
      case 'sequence':
        await this.executeSequence(task);
        break;
      case 'callback':
        await this.executeCallback(task);
        break;
      case 'spring':
        await this.executeSpring(task);
        break;
      case 'decay':
        await this.executeDecay(task);
        break;
    }
  }

  /**
   * Execute tween animation using popmotion
   */
  private async executeTween(task: Extract<AnimationTask, { type: 'tween' }>): Promise<void> {
    const { animation, config } = task;
    const { target, property, from, to } = animation;
    const {
      duration = 1000,
      delay = 0,
      easing = 'easeInOut',
      onStart,
      onUpdate,
      onComplete
    } = config;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (onStart) onStart();

        const easingFunction = typeof easing === 'string' 
          ? EasingFunctions[easing as keyof typeof EasingFunctions] || EasingFunctions.linear
          : easing;

        const animation = animate({
          from: this.extractValue(from),
          to: this.extractValue(to),
          duration,
          ease: easingFunction,
          onUpdate: (value) => {
            this.setTargetValue(target, property, this.interpolateValue(from, to, value));
            if (onUpdate) onUpdate(value, value);
          },
          onComplete: () => {
            if (onComplete) onComplete();
            resolve();
          }
        });

        const controller = new AnimationController(() => animation.stop());
        this.activeAnimations.set(`tween_${this.animationIdCounter++}`, controller);
      }, delay);
    });
  }

  /**
   * Execute keyframe animation
   */
  private async executeKeyframe(task: Extract<AnimationTask, { type: 'keyframe' }>): Promise<void> {
    const { animation, config } = task;
    const { keyframes, target, property } = animation;
    const {
      duration = 1000,
      delay = 0,
      onStart,
      onUpdate,
      onComplete
    } = config;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (onStart) onStart();

        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          const currentValue = this.evaluateKeyframes(keyframes, progress);
          this.setTargetValue(target, property, currentValue);

          if (onUpdate) onUpdate(progress, currentValue);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            if (onComplete) onComplete();
            resolve();
          }
        };

        requestAnimationFrame(animate);
      }, delay);
    });
  }

  /**
   * Execute spring animation (simplified implementation)
   */
  private async executeSpring(task: Extract<AnimationTask, { type: 'spring' }>): Promise<void> {
    const { target, property, to, config } = task;
    const { duration = 1000, delay = 0, onComplete } = config;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simplified spring animation using easing
        const from = this.cloneValue(target[property]);
        
        this.executeTween({
          type: 'tween',
          animation: { target, property, from, to },
          config: { ...config, easing: 'elastic' }
        }).then(() => {
          if (onComplete) onComplete();
          resolve();
        });
      }, delay);
    });
  }

  /**
   * Execute decay animation (simplified implementation)
   */
  private async executeDecay(task: Extract<AnimationTask, { type: 'decay' }>): Promise<void> {
    const { target, property, from, config } = task;
    const { duration = 1000, delay = 0, onComplete } = config;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simplified decay animation - gradually reduce to zero
        const to = this.multiplyValue(from, 0.1); // Reduce to 10% of original
        
        this.executeTween({
          type: 'tween',
          animation: { target, property, from, to },
          config: { ...config, easing: 'easeOut' }
        }).then(() => {
          if (onComplete) onComplete();
          resolve();
        });
      }, delay);
    });
  }

  /**
   * Execute parallel animations
   */
  private async executeParallel(task: Extract<AnimationTask, { type: 'parallel' }>): Promise<void> {
    const { animations } = task.animation;
    const promises = animations.map(animation => this.executeAnimation(animation));
    await Promise.all(promises);
  }

  /**
   * Execute sequence animations
   */
  private async executeSequence(task: Extract<AnimationTask, { type: 'sequence' }>): Promise<void> {
    const { animations } = task.animation;
    for (const animation of animations) {
      await this.executeAnimation(animation);
    }
  }

  /**
   * Execute callback animation
   */
  private async executeCallback(task: Extract<AnimationTask, { type: 'callback' }>): Promise<void> {
    const { callback, config } = task;
    const { delay = 0, onStart, onComplete } = config;

    return new Promise((resolve) => {
      setTimeout(async () => {
        if (onStart) onStart();
        
        try {
          await callback();
        } catch (error) {
          console.error('Animation callback error:', error);
        }
        
        if (onComplete) onComplete();
        resolve();
      }, delay);
    });
  }

  /**
   * Evaluate keyframes at given progress
   */
  private evaluateKeyframes(keyframes: Keyframe[], progress: number): any {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0].value;

    // Find surrounding keyframes
    let startKeyframe = keyframes[0];
    let endKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
        startKeyframe = keyframes[i];
        endKeyframe = keyframes[i + 1];
        break;
      }
    }

    // Calculate local progress between keyframes
    const localProgress = (progress - startKeyframe.time) / (endKeyframe.time - startKeyframe.time);
    const easingFunction = typeof endKeyframe.easing === 'string'
      ? EasingFunctions[endKeyframe.easing as keyof typeof EasingFunctions] || EasingFunctions.linear
      : endKeyframe.easing || EasingFunctions.linear;
    const easedProgress = easingFunction(localProgress);

    return this.interpolateValue(startKeyframe.value, endKeyframe.value, easedProgress);
  }

  /**
   * Helper methods for value manipulation
   */
  private extractValue(value: any): number {
    if (value instanceof THREE.Vector3) {
      return value.length();
    }
    if (typeof value === 'number') {
      return value;
    }
    if (Array.isArray(value)) {
      return value[0] || 0;
    }
    return 0;
  }

  private cloneValue(value: any): any {
    if (value instanceof THREE.Vector3) {
      return value.clone();
    }
    if (typeof value === 'number') {
      return value;
    }
    if (Array.isArray(value)) {
      return [...value];
    }
    return value;
  }

  private interpolateValue(from: any, to: any, progress: number): any {
    if (from instanceof THREE.Vector3 && to instanceof THREE.Vector3) {
      return new THREE.Vector3().lerpVectors(from, to, progress);
    }
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }
    if (Array.isArray(from) && Array.isArray(to)) {
      return from.map((val, index) => val + (to[index] - val) * progress);
    }
    return progress < 0.5 ? from : to;
  }

  private multiplyValue(value: any, factor: number): any {
    if (value instanceof THREE.Vector3) {
      return value.clone().multiplyScalar(factor);
    }
    if (typeof value === 'number') {
      return value * factor;
    }
    if (Array.isArray(value)) {
      return value.map(val => val * factor);
    }
    return value;
  }

  private offsetValue(value: any, offset: number): any {
    if (value instanceof THREE.Vector3) {
      return value.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * offset,
        (Math.random() - 0.5) * offset,
        (Math.random() - 0.5) * offset
      ));
    }
    if (typeof value === 'number') {
      return value + (Math.random() - 0.5) * offset;
    }
    return value;
  }

  private setTargetValue(target: any, property: string, value: any): void {
    if (target instanceof THREE.Object3D && property.includes('.')) {
      // Handle nested properties like position.x
      const parts = property.split('.');
      let obj: any = target;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else {
      target[property] = value;
    }
  }
}

/**
 * Animation Controller for individual animations
 */
class AnimationController {
  private isRunning = false;
  private isPaused = false;
  private stopFunction?: () => void;

  constructor(stopFunction?: () => void) {
    this.stopFunction = stopFunction;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
  }

  stop(): void {
    this.isRunning = false;
    if (this.stopFunction) {
      this.stopFunction();
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  isActive(): boolean {
    return this.isRunning && !this.isPaused;
  }
}

// Export singleton instance and factory function
let unifiedAnimationSystem: UnifiedAnimationSystem | null = null;

export function createUnifiedAnimationSystem(): UnifiedAnimationSystem {
  if (unifiedAnimationSystem) {
    unifiedAnimationSystem.dispose();
  }
  unifiedAnimationSystem = new UnifiedAnimationSystem();
  return unifiedAnimationSystem;
}

export function getUnifiedAnimationSystem(): UnifiedAnimationSystem | null {
  return unifiedAnimationSystem;
}

export function disposeUnifiedAnimationSystem(): void {
  if (unifiedAnimationSystem) {
    unifiedAnimationSystem.dispose();
    unifiedAnimationSystem = null;
  }
}

export default UnifiedAnimationSystem;