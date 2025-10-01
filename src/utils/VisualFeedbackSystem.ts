import * as THREE from 'three';
import { animate } from 'popmotion';
import { AnimationCurves } from './AnimationUtils';

/**
 * Visual feedback types for different interaction states
 */
export type FeedbackType =
  | 'hover'
  | 'select'
  | 'drag'
  | 'click'
  | 'context'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'loading'
  | 'highlight'
  | 'dim'
  | 'bounce';

/**
 * Visual feedback configuration
 */
export interface FeedbackConfig {
  type: FeedbackType;
  color?: string;
  intensity?: number;
  duration?: number;
  scale?: number;
  pulse?: boolean;
  glow?: boolean;
  particles?: boolean;
  sound?: boolean;
  animation?: 'fade' | 'scale' | 'rotate' | 'bounce' | 'shake' | 'wave';
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
  delay?: number;
  repeat?: number | 'infinite';
  cascade?: boolean;
  followCursor?: boolean;
}

/**
 * Enhanced visual feedback system for interactive elements
 */
export class VisualFeedbackSystem {
  private scene: THREE.Scene;
  private feedbackObjects: Map<string, THREE.Object3D[]> = new Map();
  private activeAnimations: Map<string, () => void> = new Map();
  private particleSystems: Map<string, THREE.Points> = new Map();
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * Apply visual feedback to an object with enhanced animations
   */
  public applyFeedback(object: THREE.Object3D, config: FeedbackConfig): void {
    const objectId = object.uuid;
    this.clearFeedback(objectId);
    
    const feedbackObjects: THREE.Object3D[] = [];
    
    // Apply delay if specified
    const applyEffects = () => {
      // Apply glow effect
      if (config.glow !== false) {
        const glow = this.createEnhancedGlowEffect(object, config);
        if (glow) feedbackObjects.push(glow);
      }
      
      // Apply scaling effect with enhanced animation
      if (config.scale && config.scale !== 1) {
        this.animateEnhancedScale(object, config.scale, config);
      }
      
      // Apply pulsing effect
      if (config.pulse) {
        const pulse = this.createEnhancedPulseEffect(object, config);
        if (pulse) feedbackObjects.push(pulse);
      }
      
      // Apply particle effects
      if (config.particles) {
        const particles = this.createEnhancedParticleEffect(object, config);
        if (particles) feedbackObjects.push(particles);
      }
      
      // Apply color change with enhanced animation
      if (config.color) {
        this.animateEnhancedColorChange(object, config.color, config);
      }
      
      // Apply special animations
      if (config.animation) {
        this.applySpecialAnimation(object, config);
      }
      
      this.feedbackObjects.set(objectId, feedbackObjects);
      
      // Handle repeat animations
      if (config.repeat === 'infinite') {
        // Keep the feedback active
      } else if (config.repeat && config.repeat > 1) {
        let repeatCount = 0;
        const repeatInterval = setInterval(() => {
          repeatCount++;
          if (typeof config.repeat === 'number' && repeatCount >= config.repeat) {
            clearInterval(repeatInterval);
            setTimeout(() => this.clearFeedback(objectId), config.duration || 300);
          } else {
            this.reapplyFeedback(object, config);
          }
        }, (config.duration || 300) + 100);
      } else if (config.duration && config.duration > 0) {
        // Auto-clear after duration
        setTimeout(() => this.clearFeedback(objectId), config.duration);
      }
    };
    
    if (config.delay && config.delay > 0) {
      setTimeout(applyEffects, config.delay);
    } else {
      applyEffects();
    }
  }
  
  /**
   * Create enhanced glow effect around object with customizable appearance
   */
  private createEnhancedGlowEffect(object: THREE.Object3D, config: FeedbackConfig): THREE.Mesh | null {
    const geometry = this.getBoundingGeometry(object);
    if (!geometry) return null;
    
    const glowColor = config.color || this.getDefaultColor(config.type);
    const glowIntensity = config.intensity || 0.3;
    
    // Create multiple glow layers for better effect
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });
    
    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    glowMesh.userData.isFeedback = true;
    glowMesh.userData.feedbackType = 'glow';
    
    // Position at object's world position
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    glowMesh.position.copy(worldPosition);
    
    this.scene.add(glowMesh);
    
    // Enhanced glow animation with easing options
    const easingFunction = this.getEasingFunction(config.easing || 'easeOut');
    
    const stopAnimation = animate({
      from: { opacity: 0, scale: 1, intensity: 0 },
      to: { opacity: glowIntensity, scale: 1.3, intensity: glowIntensity },
      duration: config.duration || 300,
      ease: easingFunction,
      onUpdate: ({ opacity, scale, intensity }) => {
        glowMaterial.opacity = opacity;
        glowMesh.scale.setScalar(scale);
        
        // Add color intensity variation
        const color = new THREE.Color(glowColor);
        color.multiplyScalar(1 + intensity * 0.5);
        glowMaterial.color = color;
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-glow`, () => stopAnimation.stop());
    
    return glowMesh;
  }
  
  /**
   * Create enhanced pulsing effect with customizable patterns
   */
  private createEnhancedPulseEffect(object: THREE.Object3D, config: FeedbackConfig): THREE.Mesh | null {
    const geometry = this.getBoundingGeometry(object);
    if (!geometry) return null;
    
    const pulseColor = config.color || this.getDefaultColor(config.type);
    const pulseIntensity = config.intensity || 0.5;
    
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: pulseColor,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    
    const pulseMesh = new THREE.Mesh(geometry, pulseMaterial);
    pulseMesh.userData.isFeedback = true;
    pulseMesh.userData.feedbackType = 'pulse';
    
    // Position at object's world position
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    pulseMesh.position.copy(worldPosition);
    
    this.scene.add(pulseMesh);
    
    // Enhanced pulsing with different patterns
    const easingFunction = this.getEasingFunction(config.easing || 'easeInOut');
    const pulseDuration = config.duration || 1000;
    
    const createPulse = () => {
      return animate({
        from: { scale: 1, opacity: pulseIntensity, thickness: 1 },
        to: { scale: 1.8, opacity: 0, thickness: 0.2 },
        duration: pulseDuration,
        ease: easingFunction,
        onUpdate: ({ scale, opacity, thickness }) => {
          void thickness; // Intentionally unused, keeping for potential future use
          pulseMesh.scale.setScalar(scale);
          pulseMaterial.opacity = opacity;
          
          // Vary line thickness for more dynamic effect
          if (pulseMaterial instanceof THREE.MeshBasicMaterial) {
            // Note: Three.js doesn't directly support wireframe line width changes
            // This is a conceptual implementation
          }
        },
        onComplete: () => {
          if (this.feedbackObjects.has(object.uuid) && config.repeat !== 1) {
            createPulse();
          }
        }
      });
    };
    
    const stopAnimation = createPulse();
    this.activeAnimations.set(`${object.uuid}-pulse`, () => stopAnimation.stop());
    
    return pulseMesh;
  }
  
  /**
   * Create enhanced particle effect with customizable patterns and behaviors
   */
  private createEnhancedParticleEffect(object: THREE.Object3D, config: FeedbackConfig): THREE.Points | null {
    const particleCount = config.type === 'click' ? 30 : 80;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    
    const particleColor = new THREE.Color(config.color || this.getDefaultColor(config.type));
    const intensity = config.intensity || 0.8;
    void intensity; // Intentionally unused, keeping for potential future use
    
    // Different emission patterns based on feedback type
    const emissionPattern = this.getEmissionPattern(config.type);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Generate particles based on emission pattern
      const particleData = emissionPattern(i, particleCount);
      
      positions[i3] = particleData.position.x;
      positions[i3 + 1] = particleData.position.y;
      positions[i3 + 2] = particleData.position.z;
      
      velocities[i3] = particleData.velocity.x;
      velocities[i3 + 1] = particleData.velocity.y;
      velocities[i3 + 2] = particleData.velocity.z;
      
      // Vary colors slightly for more natural effect
      const colorVariation = 0.2;
      colors[i3] = particleColor.r + (Math.random() - 0.5) * colorVariation;
      colors[i3 + 1] = particleColor.g + (Math.random() - 0.5) * colorVariation;
      colors[i3 + 2] = particleColor.b + (Math.random() - 0.5) * colorVariation;
      
      sizes[i] = particleData.size * (0.5 + Math.random() * 0.5);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isFeedback = true;
    particles.userData.feedbackType = 'particles';
    particles.userData.velocities = velocities;
    
    // Position at object's world position
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    particles.position.copy(worldPosition);
    
    this.scene.add(particles);
    this.particleSystems.set(object.uuid, particles);
    
    // Enhanced particle animation with physics
    const stopAnimation = this.animateParticles(particles, config);
    this.activeAnimations.set(`${object.uuid}-particles`, () => stopAnimation());
    
    return particles;
  }
  
  /**
   * Animate scale change
   */
  private animateScale(object: THREE.Object3D, targetScale: number, duration: number): void {
    const startScale = object.scale.x;
    const scaleDelta = targetScale - startScale;
    
    const stopAnimation = animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration,
      ease: AnimationCurves.easeInOut.easing,
      onUpdate: ({ progress }) => {
        const currentScale = startScale + scaleDelta * progress;
        object.scale.setScalar(currentScale);
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-scale`, () => stopAnimation.stop());
  }
  
  /**
   * Animate color change
   */
  private animateColorChange(object: THREE.Object3D, targetColor: string, duration: number): void {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return;
    
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!(material instanceof THREE.MeshBasicMaterial)) return;
    
    const startColor = material.color.clone();
    const endColor = new THREE.Color(targetColor);
    
    const stopAnimation = animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration,
      ease: AnimationCurves.easeInOut.easing,
      onUpdate: ({ progress }) => {
        material.color.lerpColors(startColor, endColor, progress);
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-color`, () => stopAnimation.stop());
  }
  
  /**
   * Get bounding geometry for an object
   */
  private getBoundingGeometry(object: THREE.Object3D): THREE.BufferGeometry | null {
    if (object instanceof THREE.Mesh && object.geometry) {
      return object.geometry;
    }
    
    // Create a simple box geometry as fallback
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    
    if (size.length() === 0) return null;
    
    return new THREE.BoxGeometry(size.x, size.y, size.z);
  }
  
  /**
   * Get default color for feedback type
   */
  private getDefaultColor(type: FeedbackType): string {
    const colors: Record<FeedbackType, string> = {
      hover: '#ffffff',
      select: '#00ff00',
      drag: '#ffff00',
      click: '#00ffff',
      context: '#ff00ff',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffaa00',
      info: '#0088ff',
      loading: '#0088ff',
      highlight: '#ffff00',
      dim: '#666666',
      bounce: '#00ff00'
    };
    
    return colors[type] || '#ffffff';
  }
  
  /**
   * Clear all feedback for an object
   */
  public clearFeedback(objectId: string): void {
    // Stop active animations
    const animationKeys = Array.from(this.activeAnimations.keys()).filter(key => 
      key.startsWith(objectId)
    );
    
    animationKeys.forEach(key => {
      const stopAnimation = this.activeAnimations.get(key);
      if (stopAnimation) stopAnimation();
      this.activeAnimations.delete(key);
    });
    
    // Remove feedback objects
    const feedbackObjects = this.feedbackObjects.get(objectId);
    if (feedbackObjects) {
      feedbackObjects.forEach(obj => {
        if (obj.parent) {
          obj.parent.remove(obj);
        }
        
        // Dispose of geometry and materials
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        } else if (obj instanceof THREE.Points) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
      this.feedbackObjects.delete(objectId);
    }
    
    // Remove particle systems
    const particles = this.particleSystems.get(objectId);
    if (particles) {
      if (particles.parent) {
        particles.parent.remove(particles);
      }
      if (particles.geometry) particles.geometry.dispose();
      if (particles.material) {
        if (Array.isArray(particles.material)) {
          particles.material.forEach(mat => mat.dispose());
        } else {
          particles.material.dispose();
        }
      }
      this.particleSystems.delete(objectId);
    }
  }
  
  /**
   * Clear all feedback effects
   */
  public clearAll(): void {
    const objectIds = Array.from(this.feedbackObjects.keys());
    objectIds.forEach(id => this.clearFeedback(id));
  }
  
  /**
   * Get easing function by name
   */
  private getEasingFunction(easingName: string): (t: number) => number {
    const easingFunctions = {
      linear: (t: number) => t,
      easeIn: (t: number) => t * t,
      easeOut: (t: number) => t * (2 - t),
      easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
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
      }
    };
    
    return easingFunctions[easingName as keyof typeof easingFunctions] || easingFunctions.easeOut;
  }

  /**
   * Get emission pattern for particles based on feedback type
   */
  private getEmissionPattern(type: FeedbackType): (index: number, total: number) => {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    size: number;
  } {
    const patterns = {
      click: (index: number, total: number) => {
        // Explosive pattern from center
        const angle = (index / total) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        return {
          position: new THREE.Vector3(0, 0, 0),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            (Math.random() - 0.5) * speed * 0.5
          ),
          size: 0.1 + Math.random() * 0.2
        };
      },
      hover: (index: number, total: number) => {
        void index; // Intentionally unused, keeping for potential future use
        void total; // Intentionally unused, keeping for potential future use
        // Gentle upward drift
        return {
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 1,
            (Math.random() - 0.5) * 2
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            0.5 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
          ),
          size: 0.05 + Math.random() * 0.1
        };
      },
      select: (index: number, total: number) => {
        // Circular burst pattern
        const angle = (index / total) * Math.PI * 2;
        const radius = 1 + Math.random() * 2;
        return {
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 0.5,
            Math.sin(angle) * radius
          ),
          velocity: new THREE.Vector3(
            Math.cos(angle) * 1.5,
            (Math.random() - 0.5) * 0.5,
            Math.sin(angle) * 1.5
          ),
          size: 0.08 + Math.random() * 0.15
        };
      },
      success: (index: number, total: number) => {
        void index; // Intentionally unused, keeping for potential future use
        void total; // Intentionally unused, keeping for potential future use
        // Upward celebratory burst
        return {
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 3
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            1 + Math.random() * 2,
            (Math.random() - 0.5) * 2
          ),
          size: 0.1 + Math.random() * 0.2
        };
      },
      error: (index: number, total: number) => {
        void index; // Intentionally unused, keeping for potential future use
        void total; // Intentionally unused, keeping for potential future use
        // Erratic, chaotic movement
        return {
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
          ),
          size: 0.06 + Math.random() * 0.12
        };
      }
    };
    
    const defaultPattern = patterns.click;
    return patterns[type as keyof typeof patterns] || defaultPattern;
  }

  /**
   * Animate particles with physics
   */
  private animateParticles(particles: THREE.Points, config: FeedbackConfig): () => void {
    const geometry = particles.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const velocities = geometry.attributes.velocity.array as Float32Array;
    const _sizes = geometry.attributes.size.array as Float32Array;
    void _sizes; // Intentionally unused, keeping for potential future use
    const material = particles.material as THREE.PointsMaterial;
    
    let animationId: number;
    const startTime = Date.now();
    const duration = config.duration || 2000;
    const gravity = config.type === 'error' ? -0.01 : -0.005;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Update particle positions
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1] + gravity;
        positions[i + 2] += velocities[i + 2];
        
        // Apply drag
        velocities[i] *= 0.98;
        velocities[i + 1] *= 0.98;
        velocities[i + 2] *= 0.98;
      }
      
      // Update material opacity
      material.opacity = (1 - progress) * 0.8;
      
      geometry.attributes.position.needsUpdate = true;
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    // Fade in using manual animation
    const fadeInStartTime = Date.now();
    const fadeInDuration = 200;
    
    const fadeIn = () => {
      const elapsed = Date.now() - fadeInStartTime;
      const progress = Math.min(elapsed / fadeInDuration, 1);
      const easedProgress = AnimationCurves.easeOut.easing(progress);
      
      material.opacity = easedProgress * 0.8;
      
      if (progress < 1) {
        requestAnimationFrame(fadeIn);
      } else {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    fadeIn();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }

  /**
   * Animate enhanced scale with easing options
   */
  private animateEnhancedScale(object: THREE.Object3D, targetScale: number, config: FeedbackConfig): void {
    const startScale = object.scale.x;
    const scaleDelta = targetScale - startScale;
    const duration = config.duration || 300;
    const easingFunction = this.getEasingFunction(config.easing || 'easeInOut');
    
    const stopAnimation = animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration,
      ease: easingFunction,
      onUpdate: ({ progress }) => {
        const currentScale = startScale + scaleDelta * progress;
        object.scale.setScalar(currentScale);
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-scale`, () => stopAnimation.stop());
  }

  /**
   * Animate enhanced color change with easing options
   */
  private animateEnhancedColorChange(object: THREE.Object3D, targetColor: string, config: FeedbackConfig): void {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return;
    
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!(material instanceof THREE.MeshBasicMaterial)) return;
    
    const startColor = material.color.clone();
    const endColor = new THREE.Color(targetColor);
    const duration = config.duration || 300;
    const easingFunction = this.getEasingFunction(config.easing || 'easeInOut');
    
    const stopAnimation = animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration,
      ease: easingFunction,
      onUpdate: ({ progress }) => {
        material.color.lerpColors(startColor, endColor, progress);
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-color`, () => stopAnimation.stop());
  }

  /**
   * Apply special animations (bounce, shake, wave, etc.)
   */
  private applySpecialAnimation(object: THREE.Object3D, config: FeedbackConfig): void {
    const animation = config.animation;
    const duration = config.duration || 500;
    const easingFunction = this.getEasingFunction(config.easing || 'easeOut');
    
    switch (animation) {
      case 'bounce':
        this.animateBounce(object, duration, easingFunction);
        break;
      case 'shake':
        this.animateShake(object, duration);
        break;
      case 'wave':
        this.animateWave(object, duration);
        break;
      case 'rotate':
        this.animateRotation(object, duration, easingFunction);
        break;
    }
  }

  /**
   * Animate bounce effect
   */
  private animateBounce(object: THREE.Object3D, duration: number, easing: (t: number) => number): void {
    const originalY = object.position.y;
    const bounceHeight = 0.5;
    
    const stopAnimation = animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration,
      ease: easing,
      onUpdate: ({ progress }) => {
        // Create bounce motion using sine wave
        const bounce = Math.abs(Math.sin(progress * Math.PI * 4)) * bounceHeight * (1 - progress);
        object.position.y = originalY + bounce;
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-bounce`, () => stopAnimation.stop());
  }

  /**
   * Animate shake effect
   */
  private animateShake(object: THREE.Object3D, duration: number): void {
    const originalPosition = object.position.clone();
    const shakeIntensity = 0.1;
    const startTime = Date.now();
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        object.position.copy(originalPosition);
        return;
      }
      
      const progress = elapsed / duration;
      const intensity = shakeIntensity * (1 - progress);
      
      object.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
      object.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
      object.position.z = originalPosition.z + (Math.random() - 0.5) * intensity;
      
      requestAnimationFrame(shake);
    };
    
    shake();
  }

  /**
   * Animate wave effect
   */
  private animateWave(object: THREE.Object3D, duration: number): void {
    const originalScale = object.scale.clone();
    const waveIntensity = 0.2;
    const startTime = Date.now();
    
    const wave = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        object.scale.copy(originalScale);
        return;
      }
      
      const time = elapsed * 0.01;
      const scaleX = originalScale.x * (1 + Math.sin(time) * waveIntensity);
      const scaleY = originalScale.y * (1 + Math.cos(time * 1.1) * waveIntensity);
      const scaleZ = originalScale.z * (1 + Math.sin(time * 0.9) * waveIntensity);
      
      object.scale.set(scaleX, scaleY, scaleZ);
      
      requestAnimationFrame(wave);
    };
    
    wave();
  }

  /**
   * Animate rotation effect
   */
  private animateRotation(object: THREE.Object3D, duration: number, easing: (t: number) => number): void {
    const originalRotation = object.rotation.clone();
    const rotationAmount = Math.PI * 2;
    
    const stopAnimation = animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration,
      ease: easing,
      onUpdate: ({ progress }) => {
        object.rotation.z = originalRotation.z + rotationAmount * progress;
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-rotation`, () => stopAnimation.stop());
  }

  /**
   * Reapply feedback for repeat animations
   */
  private reapplyFeedback(object: THREE.Object3D, config: FeedbackConfig): void {
    // Clear existing feedback and reapply
    this.clearFeedback(object.uuid);
    setTimeout(() => this.applyFeedback(object, config), 50);
  }

  /**
   * Dispose of the feedback system
   */
  public dispose(): void {
    this.clearAll();
    this.feedbackObjects.clear();
    this.activeAnimations.clear();
    this.particleSystems.clear();
  }
}