import * as THREE from 'three';
import { animate } from 'popmotion';
import { AnimationCurves } from './AnimationUtils';

/**
 * Animation types
 */
export type AnimationType =
  | 'fade'
  | 'scale'
  | 'rotate'
  | 'translate'
  | 'color'
  | 'glow'
  | 'pulse'
  | 'bounce'
  | 'shake'
  | 'morph'
  | 'explode'
  | 'implode'
  | 'wave'
  | 'spiral';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  type: AnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
  loop?: boolean | number;
  direction?: 'normal' | 'reverse' | 'alternate';
  spring?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  from?: any;
  to?: any;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Enhanced animation system with advanced effects
 */
export class EnhancedAnimationSystem {
  private scene: THREE.Scene;
  private activeAnimations: Map<string, () => void> = new Map();
  private animationGroups: Map<string, string[]> = new Map();
  private particleSystems: Map<string, THREE.Points> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create animation for object
   */
  public createAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): string {
    const animationId = `anim_${object.uuid}_${Date.now()}`;

    let stopAnimation: () => void;

    switch (config.type) {
      case 'fade':
        stopAnimation = this.createFadeAnimation(object, config);
        break;
      case 'scale':
        stopAnimation = this.createScaleAnimation(object, config);
        break;
      case 'rotate':
        stopAnimation = this.createRotationAnimation(object, config);
        break;
      case 'translate':
        stopAnimation = this.createTranslationAnimation(object, config);
        break;
      case 'color':
        stopAnimation = this.createColorAnimation(object, config);
        break;
      case 'glow':
        stopAnimation = this.createGlowAnimation(object, config);
        break;
      case 'pulse':
        stopAnimation = this.createPulseAnimation(object, config);
        break;
      case 'bounce':
        stopAnimation = this.createBounceAnimation(object, config);
        break;
      case 'shake':
        stopAnimation = this.createShakeAnimation(object, config);
        break;
      case 'morph':
        stopAnimation = this.createMorphAnimation(object, config);
        break;
      case 'explode':
        stopAnimation = this.createExplodeAnimation(object, config);
        break;
      case 'implode':
        stopAnimation = this.createImplodeAnimation(object, config);
        break;
      case 'wave':
        stopAnimation = this.createWaveAnimation(object, config);
        break;
      case 'spiral':
        stopAnimation = this.createSpiralAnimation(object, config);
        break;
      default:
        throw new Error(`Unknown animation type: ${config.type}`);
    }

    this.activeAnimations.set(animationId, stopAnimation);
    return animationId;
  }

  /**
   * Create fade animation
   */
  private createFadeAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return () => {};

    const material = Array.isArray(mesh.material)
      ? mesh.material[0]
      : mesh.material;
    if (!(material instanceof THREE.MeshBasicMaterial)) return () => {};

    const startOpacity = material.opacity;
    const endOpacity = config.to ?? (config.from === 0 ? 1 : 0);

    const animation = animate({
      from: { opacity: config.from ?? startOpacity },
      to: { opacity: endOpacity },
      duration: config.duration || 1000,
      ease: AnimationCurves.easeInOut.easing,
      onUpdate: ({ opacity }) => {
        material.opacity = opacity;
        if (config.onUpdate) config.onUpdate(opacity);
      },
      onComplete: config.onComplete,
    });

    return () => animation.stop();
  }

  /**
   * Create scale animation
   */
  private createScaleAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const startScale = config.from ?? object.scale.x;
    const endScale = config.to ?? 1.5;

    const animation = animate({
      from: { scale: startScale },
      to: { scale: endScale },
      duration: config.duration || 1000,
      ease: config.spring
        ? AnimationCurves.easeOutBack.easing
        : AnimationCurves.easeInOut.easing,
      onUpdate: ({ scale }) => {
        object.scale.setScalar(scale);
        if (config.onUpdate) config.onUpdate(scale);
      },
      onComplete: config.onComplete,
    });

    return () => animation.stop();
  }

  /**
   * Create rotation animation
   */
  private createRotationAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const startRotation = config.from ?? 0;
    const endRotation = config.to ?? Math.PI * 2;

    const animation = animate({
      from: { rotation: startRotation },
      to: { rotation: endRotation },
      duration: config.duration || 2000,
      ease: AnimationCurves.linear.easing,
      onUpdate: ({ rotation }) => {
        object.rotation.y = rotation;
        if (config.onUpdate) config.onUpdate(rotation);
      },
      onComplete: config.onComplete,
    });

    return () => animation.stop();
  }

  /**
   * Create translation animation
   */
  private createTranslationAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const startPos = config.from ?? object.position.clone();
    const endPos = config.to ?? new THREE.Vector3(0, 0, 0);

    const animation = animate({
      from: { x: startPos.x, y: startPos.y, z: startPos.z },
      to: { x: endPos.x, y: endPos.y, z: endPos.z },
      duration: config.duration || 1500,
      ease: AnimationCurves.easeInOut.easing,
      onUpdate: ({ x, y, z }) => {
        object.position.set(x, y, z);
        if (config.onUpdate) config.onUpdate({ x, y, z } as any);
      },
      onComplete: config.onComplete,
    });

    return () => animation.stop();
  }

  /**
   * Create color animation
   */
  private createColorAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return () => {};

    const material = Array.isArray(mesh.material)
      ? mesh.material[0]
      : mesh.material;
    if (!(material instanceof THREE.MeshBasicMaterial)) return () => {};

    const startColor = config.from
      ? new THREE.Color(config.from)
      : material.color.clone();
    const endColor = config.to
      ? new THREE.Color(config.to)
      : new THREE.Color(0xff0000);

    const animation = animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration: config.duration || 1000,
      ease: AnimationCurves.easeInOut.easing,
      onUpdate: ({ progress }) => {
        material.color.lerpColors(startColor, endColor, progress);
        if (config.onUpdate) config.onUpdate(progress);
      },
      onComplete: config.onComplete,
    });

    return () => animation.stop();
  }

  /**
   * Create glow animation
   */
  private createGlowAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const glowGeometry = (object as THREE.Mesh).geometry;
    if (!glowGeometry) return () => {};

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: config.to || 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.scale.multiplyScalar(1.1);
    glowMesh.position.copy(object.position);
    glowMesh.rotation.copy(object.rotation);

    this.scene.add(glowMesh);

    const animation = animate({
      from: { opacity: 0, scale: 1 },
      to: { opacity: config.from || 0.5, scale: 1.2 },
      duration: config.duration || 800,
      ease: AnimationCurves.easeOut.easing,
      onUpdate: ({ opacity, scale }) => {
        glowMaterial.opacity = opacity;
        glowMesh.scale.setScalar(scale);
        if (config.onUpdate) config.onUpdate({ opacity, scale } as any);
      },
      onComplete: () => {
        this.scene.remove(glowMesh);
        glowGeometry.dispose();
        glowMaterial.dispose();
        if (config.onComplete) config.onComplete();
      },
    });

    return () => {
      animation.stop();
      this.scene.remove(glowMesh);
      glowGeometry.dispose();
      glowMaterial.dispose();
    };
  }

  /**
   * Create pulse animation
   */
  private createPulseAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const createPulse = () => {
      return animate({
        from: { scale: 1, opacity: config.from || 0.8 },
        to: { scale: config.to || 1.3, opacity: 0 },
        duration: config.duration || 1000,
        ease: AnimationCurves.easeOut.easing,
        onUpdate: ({ scale, opacity }) => {
          object.scale.setScalar(scale);
          if (config.onUpdate) config.onUpdate({ scale, opacity } as any);
        },
        onComplete: () => {
          if (
            config.loop &&
            this.activeAnimations.has(`pulse_${object.uuid}`)
          ) {
            createPulse();
          } else if (config.onComplete) {
            config.onComplete();
          }
        },
      });
    };

    const animation = createPulse();
    this.activeAnimations.set(`pulse_${object.uuid}`, () => animation.stop());

    return () => animation.stop();
  }

  /**
   * Create bounce animation
   */
  private createBounceAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const startY = object.position.y;
    const bounceHeight = config.to || 2;

    const animation = animate({
      from: startY,
      to: startY + bounceHeight,
      duration: config.duration || 1000,
      ease: AnimationCurves.easeOutBack.easing,
      onUpdate: (y) => {
        object.position.y = y;
        if (config.onUpdate) config.onUpdate(y);
      },
      onComplete: config.onComplete,
    });

    return () => (animation as any).stop();
  }

  /**
   * Create shake animation
   */
  private createShakeAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const originalPosition = object.position.clone();
    const shakeIntensity = config.to || 0.1;

    const animation = animate({
      from: { time: 0 },
      to: { time: config.duration || 500 },
      duration: config.duration || 500,
      ease: AnimationCurves.linear.easing,
      onUpdate: ({ time }) => {
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        const shakeZ = (Math.random() - 0.5) * shakeIntensity;

        object.position.set(
          originalPosition.x + shakeX,
          originalPosition.y + shakeY,
          originalPosition.z + shakeZ
        );

        if (config.onUpdate) config.onUpdate(time);
      },
      onComplete: () => {
        object.position.copy(originalPosition);
        if (config.onComplete) config.onComplete();
      },
    });

    return () => {
      animation.stop();
      object.position.copy(originalPosition);
    };
  }

  /**
   * Create morph animation
   */
  private createMorphAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const mesh = object as THREE.Mesh;
    if (!mesh.geometry) return () => {};

    const geometry = mesh.geometry;
    const positionAttribute = geometry.attributes.position;
    if (!positionAttribute) return () => {};

    const originalPositions = Float32Array.from(positionAttribute.array);
    const morphFactor = config.to || 0.5;

    const animation = animate({
      from: { factor: 0 },
      to: { factor: 1 },
      duration: config.duration || 2000,
      ease: AnimationCurves.easeInOut.easing,
      onUpdate: ({ factor }) => {
        for (let i = 0; i < originalPositions.length; i += 3) {
          const noise = (Math.random() - 0.5) * morphFactor * factor;
          positionAttribute.array[i] = originalPositions[i] + noise;
          positionAttribute.array[i + 1] = originalPositions[i + 1] + noise;
          positionAttribute.array[i + 2] = originalPositions[i + 2] + noise;
        }
        positionAttribute.needsUpdate = true;

        if (config.onUpdate) config.onUpdate(factor);
      },
      onComplete: () => {
        // Restore original positions
        positionAttribute.array.set(originalPositions);
        positionAttribute.needsUpdate = true;
        if (config.onComplete) config.onComplete();
      },
    });

    return () => {
      animation.stop();
      positionAttribute.array.set(originalPositions);
      positionAttribute.needsUpdate = true;
    };
  }

  /**
   * Create explode animation
   */
  private createExplodeAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const originalPosition = object.position.clone();
    const explosionForce = config.to || 5;

    // Create particle system for explosion effect
    const particleCount = 100;
    const particles = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particles[i3] = originalPosition.x;
      particles[i3 + 1] = originalPosition.y;
      particles[i3 + 2] = originalPosition.z;

      velocities[i3] = (Math.random() - 0.5) * explosionForce;
      velocities[i3 + 1] = (Math.random() - 0.5) * explosionForce;
      velocities[i3 + 2] = (Math.random() - 0.5) * explosionForce;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));

    const material = new THREE.PointsMaterial({
      color: config.from || 0xffaa00,
      size: 0.1,
      transparent: true,
      opacity: 1,
    });

    const particleSystem = new THREE.Points(geometry, material);
    this.scene.add(particleSystem);
    this.particleSystems.set(`explode_${object.uuid}`, particleSystem);

    const animation = animate({
      from: { time: 0, opacity: 1 },
      to: { time: config.duration || 1500, opacity: 0 },
      duration: config.duration || 1500,
      ease: AnimationCurves.easeOut.easing,
      onUpdate: ({ time, opacity }) => {
        const positions = geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          positions[i3] += velocities[i3] * 0.016;
          positions[i3 + 1] += velocities[i3 + 1] * 0.016;
          positions[i3 + 2] += velocities[i3 + 2] * 0.016;
        }

        geometry.attributes.position.needsUpdate = true;
        material.opacity = opacity;

        if (config.onUpdate) config.onUpdate({ time, opacity } as any);
      },
      onComplete: () => {
        this.scene.remove(particleSystem);
        geometry.dispose();
        material.dispose();
        this.particleSystems.delete(`explode_${object.uuid}`);
        if (config.onComplete) config.onComplete();
      },
    });

    return () => {
      animation.stop();
      this.scene.remove(particleSystem);
      geometry.dispose();
      material.dispose();
      this.particleSystems.delete(`explode_${object.uuid}`);
    };
  }

  /**
   * Create implode animation
   */
  private createImplodeAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const originalScale = object.scale.clone();
    // const targetScale = new THREE.Vector3(0.01, 0.01, 0.01);

    const animation = animate({
      from: { scale: 1, rotation: 0 },
      to: { scale: 0, rotation: Math.PI * 4 },
      duration: config.duration || 1000,
      ease: AnimationCurves.easeIn.easing,
      onUpdate: ({ scale, rotation }) => {
        object.scale.copy(originalScale).multiplyScalar(scale);
        object.rotation.y = rotation;
        if (config.onUpdate) config.onUpdate({ scale, rotation } as any);
      },
      onComplete: () => {
        object.visible = false;
        if (config.onComplete) config.onComplete();
      },
    });

    return () => {
      animation.stop();
      object.scale.copy(originalScale);
      object.rotation.y = 0;
      object.visible = true;
    };
  }

  /**
   * Create wave animation
   */
  private createWaveAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const originalPosition = object.position.clone();
    const waveAmplitude = config.to || 0.5;
    const waveFrequency = 0.01;

    const animation = animate({
      from: { time: 0 },
      to: { time: config.duration || 2000 },
      duration: config.duration || 2000,
      ease: AnimationCurves.linear.easing,
      onUpdate: ({ time }) => {
        const wave = Math.sin(time * waveFrequency) * waveAmplitude;
        object.position.y = originalPosition.y + wave;
        if (config.onUpdate) config.onUpdate(time);
      },
      onComplete: () => {
        object.position.copy(originalPosition);
        if (config.onComplete) config.onComplete();
      },
    });

    return () => {
      animation.stop();
      object.position.copy(originalPosition);
    };
  }

  /**
   * Create spiral animation
   */
  private createSpiralAnimation(
    object: THREE.Object3D,
    config: AnimationConfig
  ): () => void {
    const originalPosition = object.position.clone();
    const spiralRadius = config.to || 2;
    const spiralHeight = 3;

    const animation = animate({
      from: { angle: 0, height: 0 },
      to: { angle: Math.PI * 4, height: spiralHeight },
      duration: config.duration || 3000,
      ease: AnimationCurves.easeInOut.easing,
      onUpdate: ({ angle, height }) => {
        const x = originalPosition.x + Math.cos(angle) * spiralRadius;
        const z = originalPosition.z + Math.sin(angle) * spiralRadius;
        const y = originalPosition.y + height;

        object.position.set(x, y, z);
        object.rotation.y = angle;

        if (config.onUpdate) config.onUpdate({ angle, height } as any);
      },
      onComplete: () => {
        object.position.copy(originalPosition);
        object.rotation.y = 0;
        if (config.onComplete) config.onComplete();
      },
    });

    return () => {
      animation.stop();
      object.position.copy(originalPosition);
      object.rotation.y = 0;
    };
  }

  /**
   * Create animation sequence
   */
  public createSequence(
    animations: Array<{
      object: THREE.Object3D;
      config: AnimationConfig;
      delay?: number;
    }>
  ): string {
    const sequenceId = `sequence_${Date.now()}`;
    const animationIds: string[] = [];

    animations.forEach((anim, index) => {
      setTimeout(
        () => {
          const animId = this.createAnimation(anim.object, anim.config);
          animationIds.push(animId);
        },
        anim.delay || index * 200
      );
    });

    this.animationGroups.set(sequenceId, animationIds);
    return sequenceId;
  }

  /**
   * Create parallel animations
   */
  public createParallel(
    animations: Array<{ object: THREE.Object3D; config: AnimationConfig }>
  ): string {
    const parallelId = `parallel_${Date.now()}`;
    const animationIds = animations.map((anim) =>
      this.createAnimation(anim.object, anim.config)
    );

    this.animationGroups.set(parallelId, animationIds);
    return parallelId;
  }

  /**
   * Stop animation
   */
  public stopAnimation(animationId: string): void {
    const stopAnimation = this.activeAnimations.get(animationId);
    if (stopAnimation) {
      stopAnimation();
      this.activeAnimations.delete(animationId);
    }

    // Stop grouped animations
    const groupAnimations = this.animationGroups.get(animationId);
    if (groupAnimations) {
      groupAnimations.forEach((id) => this.stopAnimation(id));
      this.animationGroups.delete(animationId);
    }
  }

  /**
   * Stop all animations
   */
  public stopAllAnimations(): void {
    this.activeAnimations.forEach((stopAnimation, _id) => {
      stopAnimation();
    });
    this.activeAnimations.clear();

    // Clear particle systems
    this.particleSystems.forEach((particles, _id) => {
      this.scene.remove(particles);
      if (particles.geometry) particles.geometry.dispose();
      if (particles.material) {
        if (Array.isArray(particles.material)) {
          particles.material.forEach((mat) => mat.dispose());
        } else {
          particles.material.dispose();
        }
      }
    });
    this.particleSystems.clear();

    this.animationGroups.clear();
  }

  /**
   * Update animation system
   */
  public update(): void {
    // Update LOD manager if available
    if (this.lodManager) {
      this.lodManager.update();
    }

    // Update culling manager if available
    if (this.cullingManager) {
      this.cullingManager.updateFrustum();
      const _visibleObjects = this.cullingManager.cullObjects();
      // Handle visible objects
    }
  }

  /**
   * Set LOD manager
   */
  public setLODManager(lodManager: any): void {
    this.lodManager = lodManager;
  }

  /**
   * Set culling manager
   */
  public setCullingManager(cullingManager: any): void {
    this.cullingManager = cullingManager;
  }

  private lodManager: any;
  private cullingManager: any;

  /**
   * Dispose of animation system
   */
  public dispose(): void {
    this.stopAllAnimations();
  }
}
