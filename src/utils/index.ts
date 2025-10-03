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

// HUD System - Consolidated
import UnifiedHUDSystem, {
  UnifiedHUDSystem as UnifiedHUDSystemClass,
  HUDTheme,
  HUDAnimationConfig,
  HUDElementConfig,
  PerformanceMetrics as HUDPerformanceMetrics,
} from './UnifiedHUDSystem';

// Interaction Utils
import InteractionUtils, {
  InteractionUtils as InteractionUtilsClass,
  InteractionEvent,
  GestureConfig,
  InteractionState,
} from './InteractionUtils';

// Performance System - Consolidated
import UnifiedPerformanceSystem, {
  UnifiedPerformanceSystem as UnifiedPerformanceSystemClass,
  PerformanceMetrics,
  IOptimizationStrategy,
} from './UnifiedPerformanceSystem';

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

// Visual Feedback System
import { VisualFeedbackSystem } from './VisualFeedbackSystem';

// Disposal System - Consolidated
import UnifiedDisposalSystem from './UnifiedDisposalSystem';

// Color System - Consolidated
import UnifiedColorSystem, {
  parseColor,
  expandHex,
  applyElementStyling,
  NodeColorUtils,
  ColorUtils,
} from './UnifiedColorSystem';

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
export {
  UnifiedHUDSystemClass as HUDSystem,
  HUDTheme,
  HUDAnimationConfig,
  HUDElementConfig,
  HUDPerformanceMetrics,
};
export { UnifiedHUDSystemClass as HUDUtils };
export {
  InteractionUtilsClass as InteractionUtils,
  InteractionEvent,
  GestureConfig,
  InteractionState,
};
export {
  UnifiedPerformanceSystemClass as PerformanceSystem,
  PerformanceMetrics,
  IOptimizationStrategy,
};
export { UnifiedPerformanceSystemClass as PerformanceUtils };
export { ThemeSystemClass as ThemeSystem, Theme, ThemeConfig };
export {
  VisualEffectsSystemClass as VisualEffectsSystem,
  EffectConfig,
  ParticleEffect,
  GlowEffect,
  TrailEffect,
};
export { VisualFeedbackSystem };
export { UnifiedDisposalSystem };
export {
  parseColor,
  expandHex,
  applyElementStyling,
  NodeColorUtils,
  ColorUtils,
};
export { ErrorHandler };

// Re-export existing utilities
export * from './AnimationUtils';
export * from './CameraPresets';

export * from './CullingManager';
export * from './deepMerge';
export * from './LODManager';
export * from './MemoryManager';
export * from './ObjectPool';

export * from './ThreeObjectPoolManager';
export * from './ThreeObjectPools';
export * from './threeUtils';
// Re-export presets
export * from '../presets';
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
  public hud: UnifiedHUDSystem | null = null;
  public interaction: InteractionUtils | null = null;
  public performance: UnifiedPerformanceSystem | null = null;
  public theme: ThemeSystem;
  public visualEffects: VisualEffectsSystem | null = null;
  public visualFeedback: VisualFeedbackSystem | null = null;
  public disposal: UnifiedDisposalSystem;
  public errorHandler: ErrorHandler;

  constructor(config: UtilitySystemConfig = {}) {
    this.animation = new UnifiedAnimationSystemClass();
    this.camera = new CameraUtilsClass();
    this.errorHandler = ErrorHandler.getInstance();
    this.disposal = UnifiedDisposalSystem.getInstance();

    // Initialize HUD system with container if provided
    if (config.scene) {
      // Create a HUD container
      const hudContainer = document.createElement('div');
      hudContainer.id = 'hud-container';
      document.body.appendChild(hudContainer);
      this.hud = new UnifiedHUDSystemClass(hudContainer);
    }

    if (config.camera && config.scene) {
      this.interaction = new InteractionUtilsClass(
        config.camera,
        config.scene,
        config.interactionConfig
      );
    }

    if (config.scene && config.camera) {
      // Create performance system even without renderer for basic functionality
      // In a real application, this should be initialized with a proper renderer
      this.performance = new UnifiedPerformanceSystemClass(config.scene, config.camera, {
        domElement: document.createElement('canvas'),
        getSize: () => ({ width: 800, height: 600 }),
        setSize: () => {},
        render: () => {},
        info: {
          render: {
            calls: 0,
            triangles: 0,
          },
          memory: {
            textures: 0,
          },
          programs: [],
        },
      } as any);
      // Initialize the performance system to prevent warnings
      (this.performance as any).init();
    }

    this.theme = new ThemeSystemClass(config.themeConfig);

    if (config.scene) {
      this.visualEffects = new VisualEffectsSystemClass(config.scene);
      this.visualFeedback = new VisualFeedbackSystem(config.scene);
    }
  }

  /**
   * Update all utility systems
   */
  update(deltaTime: number): void {
    if (this.performance) {
      this.performance.update(deltaTime);
    }

    if (this.visualEffects) {
      this.visualEffects.update(deltaTime);
    }

    if (this.visualFeedback) {
      // VisualFeedbackSystem doesn't have update method
    }
  }

  /**
   * Set performance mode for all systems
   */
  setPerformanceMode(enabled: boolean): void {
    this.animation.setPerformanceMode(enabled);
    if (this.performance) {
      // Performance system handles its own performance mode
    }
    if (this.visualEffects) {
      this.visualEffects.setPerformanceMode(enabled);
    }
  }

  /**
   * Dispose of all utility systems
   */
  dispose(): void {
    this.animation.stopAll();
    if (this.interaction) this.interaction.dispose();
    if (this.visualEffects) this.visualEffects.dispose();
    if (this.visualFeedback) this.visualFeedback.dispose();
    if (this.performance) this.performance.dispose();
    if (this.hud) this.hud.dispose();
    this.theme.dispose();
    // Disposal system is singleton, don't dispose
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
  UnifiedHUDSystem,
  InteractionUtils,
  UnifiedPerformanceSystem,
  ThemeSystem,
  VisualEffectsSystem,
  VisualFeedbackSystem,
  UnifiedDisposalSystem,
  UnifiedColorSystem,
  UtilitySystem,
  createUtilitySystem,
  getUtilitySystem,
  disposeUtilitySystem,
};
