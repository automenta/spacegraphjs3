/**
 * Visual Effects System - Comprehensive visual effects utilities
 * Provides unified system for particles, glows, trails, and other visual effects
 */

import * as THREE from 'three';
import { Logger } from './Logger';
import { safeDisposeObject } from './threeUtils';

export interface EffectConfig {
  intensity?: number;
  duration?: number;
  color?: string | number;
  size?: number;
  opacity?: number;
  speed?: number;
  count?: number;
}

export interface ParticleEffect extends EffectConfig {
  type: 'sparkle' | 'explosion' | 'trail' | 'rain' | 'snow' | 'fire' | 'smoke';
  position: THREE.Vector3;
  velocity?: THREE.Vector3;
  acceleration?: THREE.Vector3;
  lifetime?: number;
  gravity?: number;
  wind?: THREE.Vector3;
}

export interface GlowEffect extends EffectConfig {
  type: 'halo' | 'aura' | 'pulse' | 'beam' | 'ring';
  target: THREE.Object3D;
  radius?: number;
  thickness?: number;
  frequency?: number;
}

export interface TrailEffect extends EffectConfig {
  type: 'motion' | 'fade' | 'glow' | 'rainbow';
  target: THREE.Object3D;
  length?: number;
  fadeSpeed?: number;
  segments?: number;
}

export class VisualEffectsSystem {
  private effects: Map<string, VisualEffect> = new Map();
  private particleSystems: Map<string, THREE.Points> = new Map();
  private effectMeshes: Map<string, THREE.Mesh> = new Map();
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private performanceMode: boolean = false;

  private logger: Logger;

  constructor(scene: THREE.Scene) {
    // Validate input
    if (!scene) {
      throw new Error('Scene is required for VisualEffectsSystem');
    }

    this.scene = scene;
    this.clock = new THREE.Clock();
    this.logger = Logger.getInstance();
  }

  /**
   * Create particle effect
   */
  createParticleEffect(id: string, config: ParticleEffect): void {
    // Validate inputs
    if (!id) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create particle effect with empty ID'
      );
      return;
    }

    if (!config) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create particle effect with null config'
      );
      return;
    }

    try {
      const system = this.createParticleSystem(config);
      this.particleSystems.set(id, system);
      this.scene.add(system);
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to create particle effect',
        error
      );
    }
  }

  /**
   * Create glow effect
   */
  createGlowEffect(id: string, config: GlowEffect): void {
    // Validate inputs
    if (!id) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create glow effect with empty ID'
      );
      return;
    }

    if (!config) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create glow effect with null config'
      );
      return;
    }

    try {
      const mesh = this.createGlowMesh(config);
      this.effectMeshes.set(id, mesh);
      this.scene.add(mesh);
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to create glow effect',
        error
      );
    }
  }

  /**
   * Create trail effect
   */
  createTrailEffect(id: string, config: TrailEffect): void {
    // Validate inputs
    if (!id) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create trail effect with empty ID'
      );
      return;
    }

    if (!config) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create trail effect with null config'
      );
      return;
    }

    try {
      const trail = this.createTrailMesh(config);
      this.effectMeshes.set(id, trail);
      this.scene.add(trail);
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to create trail effect',
        error
      );
    }
  }

  /**
   * Create particle system
   */
  private createParticleSystem(config: ParticleEffect): THREE.Points {
    const count = config.count || 100;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);

    const color = new THREE.Color(config.color || 0xffffff);

    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = config.position.x + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = config.position.y + (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = config.position.z + (Math.random() - 0.5) * 2;

      // Color
      colors[i * 3] = color.r + (Math.random() - 0.5) * 0.2;
      colors[i * 3 + 1] = color.g + (Math.random() - 0.5) * 0.2;
      colors[i * 3 + 2] = color.b + (Math.random() - 0.5) * 0.2;

      // Size
      sizes[i] = (config.size || 1) * (0.5 + Math.random() * 0.5);

      // Lifetime
      lifetimes[i] = Math.random() * (config.lifetime || 2);

      // Velocity
      if (config.velocity) {
        velocities[i * 3] = config.velocity.x + (Math.random() - 0.5) * 0.1;
        velocities[i * 3 + 1] = config.velocity.y + (Math.random() - 0.5) * 0.1;
        velocities[i * 3 + 2] = config.velocity.z + (Math.random() - 0.5) * 0.1;
      } else {
        velocities[i * 3] = (Math.random() - 0.5) * 0.2;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      size: config.size || 2,
      vertexColors: true,
      transparent: true,
      opacity: config.opacity || 0.8,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Create glow mesh
   */
  private createGlowMesh(config: GlowEffect): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    switch (config.type) {
      case 'halo':
        geometry = new THREE.RingGeometry(
          config.radius || 1,
          (config.radius || 1) + (config.thickness || 0.2),
          32
        );
        break;
      case 'aura':
        geometry = new THREE.SphereGeometry(config.radius || 1, 32, 32);
        break;
      case 'ring':
        geometry = new THREE.RingGeometry(
          (config.radius || 1) - (config.thickness || 0.1),
          config.radius || 1,
          32
        );
        break;
      default:
        geometry = new THREE.SphereGeometry(config.radius || 1, 32, 32);
    }

    const material = new THREE.MeshBasicMaterial({
      color: config.color || 0xffffff,
      transparent: true,
      opacity: config.opacity || 0.3,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);

    if (config.target) {
      mesh.position.copy(config.target.position);
      mesh.quaternion.copy(config.target.quaternion);
    }

    return mesh;
  }

  /**
   * Create trail mesh
   */
  private createTrailMesh(config: TrailEffect): THREE.Mesh {
    const segments = config.segments || 20;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(segments * 3);
    const colors = new Float32Array(segments * 3);
    const alphas = new Float32Array(segments);

    const color = new THREE.Color(config.color || 0xffffff);

    for (let i = 0; i < segments; i++) {
      const alpha = 1 - i / segments;

      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      alphas[i] = alpha * (config.opacity || 0.8);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    const material = new THREE.PointsMaterial({
      size: config.size || 3,
      vertexColors: true,
      transparent: true,
      opacity: config.opacity || 0.8,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material) as any;
  }

  /**
   * Update all effects
   */
  update(deltaTime: number): void {
    try {
      const time = this.clock.getElapsedTime();

      // Update particle systems
      this.particleSystems.forEach((system, id) => {
        try {
          this.updateParticleSystem(system, deltaTime, time);
        } catch (error) {
          this.logger.error(
            'VisualEffectsSystem',
            `Failed to update particle system ${id}`,
            error
          );
        }
      });

      // Update effect meshes
      this.effectMeshes.forEach((mesh, id) => {
        try {
          this.updateEffectMesh(mesh, deltaTime, time);
        } catch (error) {
          this.logger.error(
            'VisualEffectsSystem',
            `Failed to update effect mesh ${id}`,
            error
          );
        }
      });
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to update effects',
        error
      );
    }
  }

  /**
   * Update particle system
   */
  private updateParticleSystem(
    system: THREE.Points,
    deltaTime: number,
    time: number
  ): void {
    void time; // Intentionally unused, keeping for potential future use
    const geometry = system.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const velocities = geometry.attributes.velocity.array as Float32Array;
    const lifetimes = geometry.attributes.lifetime.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < positions.length / 3; i++) {
      // Update lifetime
      lifetimes[i] -= deltaTime;

      if (lifetimes[i] <= 0) {
        // Reset particle
        lifetimes[i] = 2 + Math.random() * 2;
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
      } else {
        // Update position
        positions[i * 3] += velocities[i * 3] * deltaTime;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime;

        // Apply gravity
        velocities[i * 3 + 1] -= 9.8 * deltaTime * 0.1;

        // Fade color based on lifetime
        const alpha = lifetimes[i] / 2;
        colors[i * 3] *= alpha;
        colors[i * 3 + 1] *= alpha;
        colors[i * 3 + 2] *= alpha;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.lifetime.needsUpdate = true;
  }

  /**
   * Update effect mesh
   */
  private updateEffectMesh(
    mesh: THREE.Mesh,
    deltaTime: number,
    time: number
  ): void {
    // Pulse effect
    if (mesh.material instanceof THREE.MeshBasicMaterial) {
      const pulse = Math.sin(time * 3) * 0.3 + 0.7;
      mesh.material.opacity = pulse * (mesh.material as any).baseOpacity || 0.5;
    }

    // Rotate effect
    mesh.rotation.y += deltaTime * 0.5;
  }

  /**
   * Create explosion effect
   */
  createExplosion(
    position: THREE.Vector3,
    color: number = 0xff4444,
    intensity: number = 1
  ): void {
    // Validate inputs
    if (!position) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create explosion at null position'
      );
      return;
    }

    try {
      const particleCount = Math.floor(50 * intensity);

      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.05 * intensity, 8, 8),
          new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1,
          })
        );

        particle.position.copy(position);

        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 10 * intensity,
          (Math.random() - 0.5) * 10 * intensity,
          (Math.random() - 0.5) * 10 * intensity
        );

        this.scene.add(particle);

        // Animate explosion particle
        this.animateExplosionParticle(particle, velocity, intensity);
      }
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to create explosion',
        error
      );
    }
  }

  /**
   * Animate explosion particle
   */
  private animateExplosionParticle(
    particle: THREE.Mesh,
    velocity: THREE.Vector3,
    intensity: number
  ): void {
    const startTime = performance.now();
    const duration = 1000 + Math.random() * 500;
    const gravity = new THREE.Vector3(0, -9.8, 0);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(particle);
        particle.geometry.dispose();
        (particle.material as THREE.Material).dispose();
        return;
      }

      // Update position
      const deltaTime = 0.016; // Assume 60fps
      velocity.add(gravity.clone().multiplyScalar(deltaTime * 0.1));
      particle.position.add(velocity.clone().multiplyScalar(deltaTime));

      // Update opacity and scale
      const opacity = 1 - progress;
      const scale = (1 - progress) * intensity;

      (particle.material as THREE.MeshBasicMaterial).opacity = opacity;
      particle.scale.setScalar(scale);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Create sparkle effect
   */
  createSparkle(
    position: THREE.Vector3,
    count: number = 20,
    color: number = 0xffff00
  ): void {
    // Validate inputs
    if (!position) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create sparkle at null position'
      );
      return;
    }

    try {
      for (let i = 0; i < count; i++) {
        const sparkle = new THREE.Mesh(
          new THREE.PlaneGeometry(0.1, 0.1),
          new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
          })
        );

        sparkle.position.copy(position);
        sparkle.position.add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          )
        );

        sparkle.lookAt(this.scene.position);
        this.scene.add(sparkle);

        // Animate sparkle
        this.animateSparkle(sparkle);
      }
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to create sparkle',
        error
      );
    }
  }

  /**
   * Animate sparkle
   */
  private animateSparkle(sparkle: THREE.Mesh): void {
    const startTime = performance.now();
    const duration = 500 + Math.random() * 500;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(sparkle);
        sparkle.geometry.dispose();
        (sparkle.material as THREE.Material).dispose();
        return;
      }

      // Flicker effect
      const flicker = Math.sin(progress * Math.PI * 10) * 0.5 + 0.5;
      (sparkle.material as THREE.MeshBasicMaterial).opacity =
        (1 - progress) * flicker;

      // Scale effect
      const scale = (1 - progress) * 2;
      sparkle.scale.setScalar(scale);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Create energy beam
   */
  createEnergyBeam(
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number = 0x00ffff
  ): void {
    // Validate inputs
    if (!start || !end) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create energy beam with null start or end position'
      );
      return;
    }

    try {
      const direction = end.clone().sub(start);
      const length = direction.length();
      const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);

      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      const beam = new THREE.Mesh(geometry, material);
      beam.position.copy(start.clone().add(end).multiplyScalar(0.5));
      beam.lookAt(end);
      beam.rotateX(Math.PI / 2);

      this.scene.add(beam);

      // Animate beam
      this.animateEnergyBeam(beam);
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to create energy beam',
        error
      );
    }
  }

  /**
   * Animate energy beam
   */
  private animateEnergyBeam(beam: THREE.Mesh): void {
    const startTime = performance.now();
    const duration = 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(beam);
        beam.geometry.dispose();
        (beam.material as THREE.Material).dispose();
        return;
      }

      // Pulse effect
      const pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7;
      (beam.material as THREE.MeshBasicMaterial).opacity = pulse;

      // Scale effect
      const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.2;
      beam.scale.set(scale, 1, scale);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Create shockwave effect
   */
  createShockwave(
    position: THREE.Vector3,
    color: number = 0xffffff,
    maxRadius: number = 5
  ): void {
    // Validate inputs
    if (!position) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot create shockwave at null position'
      );
      return;
    }

    try {
      const geometry = new THREE.RingGeometry(0, 0.1, 32);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });

      const shockwave = new THREE.Mesh(geometry, material);
      shockwave.position.copy(position);
      shockwave.rotation.x = -Math.PI / 2;

      this.scene.add(shockwave);

      // Animate shockwave
      this.animateShockwave(shockwave, maxRadius);
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to create shockwave',
        error
      );
    }
  }

  /**
   * Animate shockwave
   */
  private animateShockwave(shockwave: THREE.Mesh, maxRadius: number): void {
    const startTime = performance.now();
    const duration = 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(shockwave);
        shockwave.geometry.dispose();
        (shockwave.material as THREE.Material).dispose();
        return;
      }

      // Expand and fade
      const scale = progress * maxRadius;
      const opacity = 1 - progress;

      shockwave.scale.set(scale, scale, 1);
      (shockwave.material as THREE.MeshBasicMaterial).opacity = opacity;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Remove effect
   */
  removeEffect(id: string): void {
    // Validate input
    if (!id) {
      this.logger.warn(
        'VisualEffectsSystem',
        'Cannot remove effect with empty ID'
      );
      return;
    }

    try {
      const particleSystem = this.particleSystems.get(id);
      if (particleSystem) {
        this.scene.remove(particleSystem);
        particleSystem.geometry.dispose();
        (particleSystem.material as THREE.Material).dispose();
        this.particleSystems.delete(id);
      }

      const effectMesh = this.effectMeshes.get(id);
      if (effectMesh) {
        this.scene.remove(effectMesh);
        effectMesh.geometry.dispose();
        (effectMesh.material as THREE.Material).dispose();
        this.effectMeshes.delete(id);
      }
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        `Failed to remove effect ${id}`,
        error
      );
    }
  }

  /**
   * Clear all effects
   */
  clearAllEffects(): void {
    try {
      this.particleSystems.forEach((system, id) => {
        try {
          this.scene.remove(system);
          system.geometry.dispose();
          (system.material as THREE.Material).dispose();
        } catch (error) {
          this.logger.error(
            'VisualEffectsSystem',
            `Failed to dispose particle system ${id}`,
            error
          );
        }
      });
      this.particleSystems.clear();

      this.effectMeshes.forEach((mesh, id) => {
        try {
          this.scene.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        } catch (error) {
          this.logger.error(
            'VisualEffectsSystem',
            `Failed to dispose effect mesh ${id}`,
            error
          );
        }
      });
      this.effectMeshes.clear();
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to clear all effects',
        error
      );
    }
  }

  /**
   * Set performance mode
   */
  setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled;

    if (enabled) {
      // Reduce particle counts and effect complexity
      this.particleSystems.forEach((system) => {
        const geometry = system.geometry;
        const count = Math.floor(geometry.attributes.position.count / 2);

        // Reduce particle count
        const positions = geometry.attributes.position.array as Float32Array;
        const newPositions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
          newPositions[i] = positions[i];
        }

        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(newPositions, 3)
        );
      });
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    try {
      this.clearAllEffects();
      this.effects.clear();
    } catch (error) {
      this.logger.error(
        'VisualEffectsSystem',
        'Failed to dispose visual effects system',
        error
      );
    }
  }
}

/**
 * Base visual effect class
 */
abstract class VisualEffect {
  protected id: string;
  protected config: EffectConfig;
  protected active: boolean = true;

  constructor(id: string, config: EffectConfig) {
    this.id = id;
    this.config = config;
  }

  abstract update(deltaTime: number, _time: number): void;
  abstract dispose(): void;

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }
}

export default VisualEffectsSystem;
