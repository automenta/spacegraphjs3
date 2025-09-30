/**
 * Animation System - Comprehensive animation utilities
 * Provides a unified system for all animations with performance optimization
 *
 * This is a wrapper around UnifiedAnimationSystem for backward compatibility
 */

import * as THREE from 'three';
import UnifiedAnimationSystemDefault, {
  AnimationConfig,
  KeyframeAnimation,
  AnimationTask,
  TweenAnimation,
  ParallelAnimation,
  SequenceAnimation
} from './UnifiedAnimationSystem';

export type {
  AnimationConfig,
  AnimationTask,
  KeyframeAnimation,
  TweenAnimation,
  ParallelAnimation,
  SequenceAnimation
};

export class AnimationSystem {
  private unifiedSystem: UnifiedAnimationSystemDefault;

  constructor(performanceMode: boolean = false) {
    this.unifiedSystem = new UnifiedAnimationSystemDefault();
    this.unifiedSystem.setPerformanceMode(performanceMode);
  }

  /**
   * Create a simple tween animation
   */
  tween<T extends Record<string, any>>(
    target: T,
    property: string,
    from: T[keyof T],
    to: T[keyof T],
    config: AnimationConfig = {}
  ): Promise<void> {
    return this.unifiedSystem.tween(target, property, from, to, config);
  }

  /**
   * Create a keyframe animation
   */
  keyframe(animation: KeyframeAnimation, config: AnimationConfig = {}): Promise<void> {
    return this.unifiedSystem.keyframe(animation, config);
  }

  /**
   * Run animations in parallel
   */
  parallel(animations: AnimationTask[], config: AnimationConfig = {}): Promise<void> {
    return this.unifiedSystem.parallel(animations, config);
  }

  /**
   * Run animations in sequence
   */
  sequence(animations: AnimationTask[], config: AnimationConfig = {}): Promise<void> {
    return this.unifiedSystem.sequence(animations, config);
  }

  /**
   * Add a callback animation
   */
  callback(callback: () => void | Promise<void>, config: AnimationConfig = {}): Promise<void> {
    return this.unifiedSystem.callback(callback, config);
  }

  /**
   * Create a bounce animation
   */
  async bounce<T extends Record<string, any>>(
    target: T,
    property: string,
    intensity: number = 1,
    config: AnimationConfig = {}
  ): Promise<void> {
    return this.unifiedSystem.bounce(target, property, intensity, config);
  }

  /**
   * Create a shake animation
   */
  async shake<T extends Record<string, any>>(
    target: T,
    property: string,
    intensity: number = 5,
    config: AnimationConfig = {}
  ): Promise<void> {
    // Shake animation removed as requested
    return Promise.resolve();
  }

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.unifiedSystem.stopAll();
  }

  /**
   * Pause all animations
   */
  pauseAll(): void {
    this.unifiedSystem.pauseAll();
  }

  /**
   * Resume all animations
   */
  resumeAll(): void {
    this.unifiedSystem.resumeAll();
  }

  /**
   * Enable performance mode (reduced quality for better performance)
   */
  setPerformanceMode(enabled: boolean): void {
    this.unifiedSystem.setPerformanceMode(enabled);
  }
}

export default AnimationSystem;