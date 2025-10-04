/**
 * Unified Animation System
 * Consolidates AnimationSystem, AnimationUtils, and EnhancedAnimationSystem
 * Provides a single, comprehensive animation framework
 *
 * @deprecated This file has been split into focused modules:
 * - CoreAnimationSystem.ts - Main animation system class
 * - EasingFunctions.ts - Easing function definitions
 * - ValueInterpolationUtils.ts - Value interpolation utilities
 *
 * This file now re-exports from the new modules for backward compatibility.
 */

// Re-export everything from the new modular structure
export * from './animation/CoreAnimationSystem';
export * from './animation/EasingFunctions';
export * from './animation/ValueInterpolationUtils';
