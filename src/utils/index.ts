/**
 * Utility Systems Index
 * Exports all utility systems for easy importing
 */

import * as THREE from 'three';

// Animation System
import UnifiedAnimationSystem, {
  UnifiedAnimationSystem as UnifiedAnimationSystemClass,
  AnimationTask,
  KeyframeAnimation,
  AnimationConfig,
  ParallelAnimation,
  SequenceAnimation,
} from './UnifiedAnimationSystem';

// Camera Utils
import CameraUtils, {
  CameraUtils as CameraUtilsClass,
  CameraAnimationConfig,
} from './CameraUtils';

// HUD Utils
import HUDUtils, {
  HUDUtils as HUDUtilsClass,
  HUDTheme,
  HUDAnimationConfig,
} from './HUDUtils';

// Interaction Utils
import InteractionUtils, {
  InteractionUtils as InteractionUtilsClass,
  InteractionEvent,
  GestureConfig,
  InteractionState,
} from './InteractionUtils';

// Performance Utils
import PerformanceUtils, {
  PerformanceUtils as PerformanceUtilsClass,
  PerformanceMetrics,
  PerformanceConfig,
} from './PerformanceUtils';

// Theme System
import ThemeSystem, {
  ThemeSystem as ThemeSystemClass,
  Theme,
  ThemeConfig,
} from './ThemeSystem';

// Visual Effects System
import VisualEffectsSystem, {
  VisualEffectsSystem as VisualEffectsSystemClass,
  EffectConfig,
  ParticleEffect,
  GlowEffect,
  TrailEffect,
} from './VisualEffectsSystem';

// Error Handler
import { ErrorHandler } from './ErrorHandler';

// Export types and classes
export {
  UnifiedAnimationSystemClass as AnimationSystem,
  AnimationConfig,
  AnimationTask,
  KeyframeAnimation,
  ParallelAnimation,
  SequenceAnimation,
};
export {
  CameraUtils,
  CameraUtilsClass as CameraUtilsClass,
  CameraAnimationConfig,
};
export { HUDUtilsClass as HUDUtils, HUDTheme, HUDAnimationConfig };
export {
  InteractionUtilsClass as InteractionUtils,
  InteractionEvent,
  GestureConfig,
  InteractionState,
};
export {
  PerformanceUtilsClass as PerformanceUtils,
  PerformanceMetrics,
  PerformanceConfig,
};
export { ThemeSystemClass as ThemeSystem, Theme, ThemeConfig };
export {
  VisualEffectsSystemClass as VisualEffectsSystem,
  EffectConfig,
  ParticleEffect,
  GlowEffect,
  TrailEffect,
};
export { ErrorHandler };

// Re-export existing utilities
export * from './AnimationUtils';
export * from './CameraPresets';

export * from './colorUtils';
export * from './CullingManager';
export * from './deepMerge';
export * from './LODManager';
export * from './MemoryManager';
export * from './ObjectPool';

export * from './ThreeObjectPoolManager';
export * from './ThreeObjectPools';
export * from './threeUtils';
export * from './ErrorHandler';

// Utility function to create a complete utility system instance
export interface UtilitySystemConfig {
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  performanceMode?: boolean;
  themeConfig?: any;
  interactionConfig?: any;
}

export class UtilitySystem {
  public animation: UnifiedAnimationSystem;
  public camera: CameraUtils;
  public hud: HUDUtils;
  public interaction: InteractionUtils;
  public performance: PerformanceUtils;
  public theme: ThemeSystem;
  public visualEffects: VisualEffectsSystem;
  public errorHandler: ErrorHandler;

  constructor(config: UtilitySystemConfig = {}) {
    this.animation = new UnifiedAnimationSystemClass();
    this.camera = new CameraUtilsClass();
    this.hud = new HUDUtilsClass();
    this.errorHandler = ErrorHandler.getInstance();

    if (config.camera && config.scene) {
      this.interaction = new InteractionUtilsClass(
        config.camera,
        config.scene,
        config.interactionConfig
      );
    } else {
      this.interaction = null as any;
    }

    this.performance = new PerformanceUtilsClass({
      enableFPSMonitoring: true,
      enableMemoryTracking: true,
      enableRenderTiming: true,
      updateInterval: 1000,
    });
    this.theme = new ThemeSystemClass(config.themeConfig);

    if (config.scene) {
      this.visualEffects = new VisualEffectsSystemClass(config.scene);
    } else {
      this.visualEffects = null as any;
    }
  }

  /**
   * Update all utility systems
   */
  update(deltaTime: number): void {
    // AnimationSystem doesn't have an update method
    // this.animation.update(deltaTime);

    // PerformanceUtils doesn't have an update method
    // this.performance.update(deltaTime);

    if (this.visualEffects) {
      this.visualEffects.update(deltaTime);
    }
  }

  /**
   * Set performance mode for all systems
   */
  setPerformanceMode(enabled: boolean): void {
    this.animation.setPerformanceMode(enabled);
    // PerformanceUtils doesn't have setPerformanceMode method
    // this.performance.setPerformanceMode(enabled);
    if (this.visualEffects) {
      this.visualEffects.setPerformanceMode(enabled);
    }
  }

  /**
   * Dispose of all utility systems
   */
  dispose(): void {
    this.animation.stopAll();
    this.interaction.dispose();
    this.visualEffects.dispose();
    this.theme.dispose();
  }
}

// Create a singleton instance
let utilitySystemInstance: UtilitySystem | null = null;

export function createUtilitySystem(
  config: UtilitySystemConfig = {}
): UtilitySystem {
  if (utilitySystemInstance) {
    utilitySystemInstance.dispose();
  }
  utilitySystemInstance = new UtilitySystem(config);
  return utilitySystemInstance;
}

export function getUtilitySystem(): UtilitySystem | null {
  return utilitySystemInstance;
}

export function disposeUtilitySystem(): void {
  if (utilitySystemInstance) {
    utilitySystemInstance.dispose();
    utilitySystemInstance = null;
  }
}

export default {
  UnifiedAnimationSystem,
  CameraUtils,
  HUDUtils,
  InteractionUtils,
  PerformanceUtils,
  ThemeSystem,
  VisualEffectsSystem,
  UtilitySystem,
  createUtilitySystem,
  getUtilitySystem,
  disposeUtilitySystem,
};
