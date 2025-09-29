/**
 * Animation System - Comprehensive animation utilities
 * Provides a unified system for all animations with performance optimization
 */

import * as THREE from 'three';

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
  onStart?: () => void;
}

export interface KeyframeAnimation {
  keyframes: Array<{ time: number; value: any; easing?: string }>;
  property: string;
  target: any;
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
  | { type: 'tween'; config: AnimationConfig; from: any; to: any; target: any; property: string }
  | { type: 'keyframe'; config: AnimationConfig; animation: KeyframeAnimation }
  | { type: 'parallel'; config: AnimationConfig; animations: ParallelAnimation }
  | { type: 'sequence'; config: AnimationConfig; animations: SequenceAnimation }
  | { type: 'callback'; config: AnimationConfig; callback: () => void | Promise<void> };

export class AnimationSystem {
  private activeAnimations: Map<string, AnimationController> = new Map();
  private animationQueue: AnimationTask[] = [];
  private isProcessing: boolean = false;
  private performanceMode: boolean = false;

  constructor(performanceMode: boolean = false) {
    this.performanceMode = performanceMode;
  }

  /**
   * Create a simple tween animation
   */
  tween(
    target: any,
    property: string,
    from: any,
    to: any,
    config: AnimationConfig = {}
  ): Promise<void> {
    return this.addAnimation({
      type: 'tween',
      target,
      property,
      from,
      to,
      config
    });
  }

  /**
   * Create a keyframe animation
   */
  keyframe(animation: KeyframeAnimation, config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'keyframe',
      animation,
      config
    });
  }

  /**
   * Run animations in parallel
   */
  parallel(animations: AnimationTask[], config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'parallel',
      animations: { animations, config },
      config
    });
  }

  /**
   * Run animations in sequence
   */
  sequence(animations: AnimationTask[], config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'sequence',
      animations: { animations, config },
      config
    });
  }

  /**
   * Add a callback animation
   */
  callback(callback: () => void | Promise<void>, config: AnimationConfig = {}): Promise<void> {
    return this.addAnimation({
      type: 'callback',
      callback,
      config
    });
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
    }
  }

  /**
   * Execute tween animation
   */
  private executeTween(task: Extract<AnimationTask, { type: 'tween' }>): Promise<void> {
    return new Promise((resolve) => {
      const { target, property, from, to, config } = task;
      const {
        duration = 1000,
        delay = 0,
        easing = 'ease-out',
        onStart,
        onUpdate,
        onComplete
      } = config;

      setTimeout(() => {
        if (onStart) onStart();

        const startTime = performance.now();
        const startValue = this.cloneValue(from);
        const endValue = this.cloneValue(to);

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = this.applyEasing(progress, easing);

          const currentValue = this.interpolateValue(startValue, endValue, easedProgress);
          this.setTargetValue(target, property, currentValue);

          if (onUpdate) onUpdate(easedProgress);

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
   * Execute keyframe animation
   */
  private executeKeyframe(task: Extract<AnimationTask, { type: 'keyframe' }>): Promise<void> {
    return new Promise((resolve) => {
      const { animation, config } = task;
      const {
        duration = 1000,
        delay = 0,
        onStart,
        onUpdate,
        onComplete
      } = config;

      setTimeout(() => {
        if (onStart) onStart();

        const startTime = performance.now();
        const { keyframes, target, property } = animation;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          const currentValue = this.evaluateKeyframes(keyframes, progress);
          this.setTargetValue(target, property, currentValue);

          if (onUpdate) onUpdate(progress);

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
   * Execute parallel animations
   */
  private async executeParallel(task: Extract<AnimationTask, { type: 'parallel' }>): Promise<void> {
    const { animations } = task.animations;
    const promises = animations.map(animation => this.executeAnimation(animation));
    await Promise.all(promises);
  }

  /**
   * Execute sequence animations
   */
  private async executeSequence(task: Extract<AnimationTask, { type: 'sequence' }>): Promise<void> {
    const { animations } = task.animations;
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

    setTimeout(async () => {
      if (onStart) onStart();
      
      try {
        await callback();
      } catch (error) {
        console.error('Animation callback error:', error);
      }
      
      if (onComplete) onComplete();
    }, delay);
  }

  /**
   * Apply easing function
   */
  private applyEasing(progress: number, easing: string): number {
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
   * Clone value for interpolation
   */
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

  /**
   * Interpolate between two values
   */
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

  /**
   * Set target value
   */
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

  /**
   * Evaluate keyframes at given progress
   */
  private evaluateKeyframes(keyframes: Array<{ time: number; value: any; easing?: string }>, progress: number): any {
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
    const easedProgress = this.applyEasing(localProgress, endKeyframe.easing || 'linear');

    return this.interpolateValue(startKeyframe.value, endKeyframe.value, easedProgress);
  }

  /**
   * Create a bounce animation
   */
  async bounce(
    target: any,
    property: string,
    intensity: number = 1,
    _config: AnimationConfig = {}
  ): Promise<void> {
    const originalValue = this.cloneValue(target[property]);
    
    await this.tween(target, property, originalValue, this.offsetValue(originalValue, intensity), { duration: 100 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, -intensity * 0.5), { duration: 100 });
    await this.tween(target, property, target[property], originalValue, { duration: 100 });
  }

  /**
   * Create a shake animation
   */
  async shake(
    target: any,
    property: string,
    intensity: number = 5,
    _config: AnimationConfig = {}
  ): Promise<void> {
    const originalValue = this.cloneValue(target[property]);
    
    await this.tween(target, property, originalValue, this.offsetValue(originalValue, intensity), { duration: 50 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, -intensity), { duration: 50 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, intensity * 0.7), { duration: 50 });
    await this.tween(target, property, target[property], this.offsetValue(originalValue, -intensity * 0.7), { duration: 50 });
    await this.tween(target, property, target[property], originalValue, { duration: 50 });
  }

  /**
   * Offset value for shake effect
   */
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

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.activeAnimations.forEach(controller => controller.stop());
    this.activeAnimations.clear();
    this.animationQueue = [];
    this.isProcessing = false;
  }

  /**
   * Pause all animations
   */
  pauseAll(): void {
    this.activeAnimations.forEach(controller => controller.pause());
  }

  /**
   * Resume all animations
   */
  resumeAll(): void {
    this.activeAnimations.forEach(controller => controller.resume());
  }

  /**
   * Enable performance mode (reduced quality for better performance)
   */
  setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled;
  }
}

/**
 * Animation Controller for individual animations
 */
class AnimationController {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationId: number | null = null;

  constructor(private animationFunction: () => void) {}

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.animationFunction();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
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

export default AnimationSystem;