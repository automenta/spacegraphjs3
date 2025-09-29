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
  | 'info';

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
   * Apply visual feedback to an object
   */
  public applyFeedback(object: THREE.Object3D, config: FeedbackConfig): void {
    const objectId = object.uuid;
    this.clearFeedback(objectId);
    
    const feedbackObjects: THREE.Object3D[] = [];
    
    // Apply glow effect
    if (config.glow !== false) {
      const glow = this.createGlowEffect(object, config);
      if (glow) feedbackObjects.push(glow);
    }
    
    // Apply scaling effect
    if (config.scale && config.scale !== 1) {
      this.animateScale(object, config.scale, config.duration || 300);
    }
    
    // Apply pulsing effect
    if (config.pulse) {
      const pulse = this.createPulseEffect(object, config);
      if (pulse) feedbackObjects.push(pulse);
    }
    
    // Apply particle effects
    if (config.particles) {
      const particles = this.createParticleEffect(object, config);
      if (particles) feedbackObjects.push(particles);
    }
    
    // Apply color change
    if (config.color) {
      this.animateColorChange(object, config.color, config.duration || 300);
    }
    
    this.feedbackObjects.set(objectId, feedbackObjects);
    
    // Auto-clear after duration
    if (config.duration && config.duration > 0) {
      setTimeout(() => this.clearFeedback(objectId), config.duration);
    }
  }
  
  /**
   * Create glow effect around object
   */
  private createGlowEffect(object: THREE.Object3D, config: FeedbackConfig): THREE.Mesh | null {
    const geometry = this.getBoundingGeometry(object);
    if (!geometry) return null;
    
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: config.color || this.getDefaultColor(config.type),
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });
    
    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    glowMesh.scale.multiplyScalar(1.1);
    glowMesh.userData.isFeedback = true;
    glowMesh.userData.feedbackType = 'glow';
    
    // Position at object's world position
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    glowMesh.position.copy(worldPosition);
    
    this.scene.add(glowMesh);
    
    // Animate glow appearance
    const stopAnimation = animate({
      from: { opacity: 0, scale: 1 },
      to: { opacity: config.intensity || 0.3, scale: 1.2 },
      duration: 200,
      ease: AnimationCurves.easeOut.easing,
      onUpdate: ({ opacity, scale }) => {
        glowMaterial.opacity = opacity;
        glowMesh.scale.setScalar(scale);
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-glow`, () => stopAnimation.stop());
    
    return glowMesh;
  }
  
  /**
   * Create pulsing effect
   */
  private createPulseEffect(object: THREE.Object3D, config: FeedbackConfig): THREE.Mesh | null {
    const geometry = this.getBoundingGeometry(object);
    if (!geometry) return null;
    
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: config.color || this.getDefaultColor(config.type),
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
    
    // Create continuous pulsing animation
    const createPulse = () => {
      return animate({
        from: { scale: 1, opacity: config.intensity || 0.5 },
        to: { scale: 1.5, opacity: 0 },
        duration: 1000,
        ease: AnimationCurves.easeOut.easing,
        onUpdate: ({ scale, opacity }) => {
          pulseMesh.scale.setScalar(scale);
          pulseMaterial.opacity = opacity;
        },
        onComplete: () => {
          if (this.feedbackObjects.has(object.uuid)) {
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
   * Create particle effect
   */
  private createParticleEffect(object: THREE.Object3D, config: FeedbackConfig): THREE.Points | null {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color(config.color || this.getDefaultColor(config.type));
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions in sphere
      const radius = Math.random() * 2 + 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = Math.random() * 5 + 1;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isFeedback = true;
    particles.userData.feedbackType = 'particles';
    
    // Position at object's world position
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    particles.position.copy(worldPosition);
    
    this.scene.add(particles);
    this.particleSystems.set(object.uuid, particles);
    
    // Animate particles
    const stopAnimation = animate({
      from: { opacity: 0, scale: 0.5 },
      to: { opacity: config.intensity || 0.8, scale: 1 },
      duration: 300,
      ease: AnimationCurves.easeOut.easing,
      onUpdate: ({ opacity, scale }) => {
        material.opacity = opacity;
        particles.scale.setScalar(scale);
      }
    });
    
    this.activeAnimations.set(`${object.uuid}-particles`, () => stopAnimation.stop());
    
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
    const colors = {
      hover: '#ffffff',
      select: '#00ff00',
      drag: '#ffff00',
      click: '#00ffff',
      context: '#ff00ff',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffaa00',
      info: '#0088ff'
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
   * Dispose of the feedback system
   */
  public dispose(): void {
    this.clearAll();
    this.feedbackObjects.clear();
    this.activeAnimations.clear();
    this.particleSystems.clear();
  }
}