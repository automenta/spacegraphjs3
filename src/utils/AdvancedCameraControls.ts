import * as THREE from 'three';
import { animate } from 'popmotion';
import { AnimationCurves } from './AnimationUtils';

/**
 * Advanced camera control system with smooth animations, constraints, and enhanced features
 */
export class AdvancedCameraControls {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;
  private distance: number;
  private phi: number; // vertical angle
  private theta: number; // horizontal angle
  private minDistance: number = 1;
  private maxDistance: number = 1000;
  private minPhi: number = 0.1;
  private maxPhi: number = Math.PI - 0.1;
  private minTheta: number = -Infinity;
  private maxTheta: number = Infinity;
  private dampingFactor: number = 0.05;
  private enableDamping: boolean = true;
  private autoRotate: boolean = false;
  private autoRotateSpeed: number = 2.0;
  private enableZoom: boolean = true;
  private zoomSpeed: number = 1.0;
  private enablePan: boolean = true;
  private panSpeed: number = 1.0;
  private enableRotate: boolean = true;
  private rotateSpeed: number = 1.0;
  
  // Smooth transition properties
  private targetPosition: THREE.Vector3;
  private targetDistance: number;
  private targetPhi: number;
  private targetTheta: number;
  
  // Animation state
  private isAnimating: boolean = false;
  private animationQueue: Array<() => void> = [];
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.target = new THREE.Vector3(0, 0, 0);
    this.distance = 10;
    this.phi = Math.PI / 2;
    this.theta = 0;
    
    this.targetPosition = this.target.clone();
    this.targetDistance = this.distance;
    this.targetPhi = this.phi;
    this.targetTheta = this.theta;
  }
  
  /**
   * Update camera position based on spherical coordinates
   */
  public update(): void {
    if (this.enableDamping) {
      this.applyDamping();
    }
    
    if (this.autoRotate && !this.isAnimating) {
      this.theta += (this.autoRotateSpeed * Math.PI / 180) * 0.016; // 60fps assumption
    }
    
    this.updateCameraPosition();
  }
  
  /**
   * Apply damping for smooth camera movements
   */
  private applyDamping(): void {
    const lerpFactor = 1 - this.dampingFactor;
    
    this.target.lerp(this.targetPosition, lerpFactor);
    this.distance += (this.targetDistance - this.distance) * lerpFactor;
    this.phi += (this.targetPhi - this.phi) * lerpFactor;
    this.theta += (this.targetTheta - this.theta) * lerpFactor;
  }
  
  /**
   * Update camera position from spherical coordinates
   */
  private updateCameraPosition(): void {
    const x = this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    const y = this.distance * Math.cos(this.phi);
    const z = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
    
    this.camera.position.set(
      this.target.x + x,
      this.target.y + y,
      this.target.z + z
    );
    
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Smoothly move camera to target position
   */
  public flyTo(target: THREE.Vector3, distance: number, phi: number, theta: number, options: {
    duration?: number;
    easing?: (t: number) => number;
    onComplete?: () => void;
  } = {}): void {
    const {
      duration = 1000,
      easing = AnimationCurves.easeInOut.easing,
      onComplete
    } = options;
    
    if (this.isAnimating) {
      this.animationQueue.push(() => this.flyTo(target, distance, phi, theta, options));
      return;
    }
    
    this.isAnimating = true;
    
    const startTarget = this.target.clone();
    const startDistance = this.distance;
    const startPhi = this.phi;
    const startTheta = this.theta;
    
    animate({
      from: { progress: 0 },
      to: { progress: 1 },
      duration,
      ease: easing,
      onUpdate: ({ progress }) => {
        this.targetPosition.lerpVectors(startTarget, target, progress);
        this.targetDistance = startDistance + (distance - startDistance) * progress;
        this.targetPhi = startPhi + (phi - startPhi) * progress;
        this.targetTheta = startTheta + (theta - startTheta) * progress;
      },
      onComplete: () => {
        this.isAnimating = false;
        if (onComplete) onComplete();
        
        // Process next animation in queue
        if (this.animationQueue.length > 0) {
          const nextAnimation = this.animationQueue.shift();
          if (nextAnimation) nextAnimation();
        }
      }
    });
  }
  
  /**
   * Smoothly frame a set of objects
   */
  public frameObjects(objects: THREE.Object3D[], options: {
    duration?: number;
    padding?: number;
    offset?: THREE.Vector3;
  } = {}): void {
    const {
      duration = 1000,
      padding = 1.5,
      offset = new THREE.Vector3(0, 0, 0)
    } = options;
    
    if (objects.length === 0) return;
    
    // Calculate bounding box
    const box = new THREE.Box3();
    objects.forEach(obj => {
      box.expandByObject(obj);
    });
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Calculate optimal distance
    const fov = this.camera.fov * (Math.PI / 180);
    let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    distance *= padding;
    
    // Calculate optimal angles
    const targetPosition = center.clone().add(offset);
    const currentPosition = this.camera.position.clone();
    const direction = new THREE.Vector3().subVectors(currentPosition, targetPosition).normalize();
    
    const phi = Math.acos(direction.y);
    const theta = Math.atan2(direction.z, direction.x);
    
    this.flyTo(targetPosition, distance, phi, theta, { duration });
  }
  
  /**
   * Handle mouse/touch rotation
   */
  public rotate(deltaX: number, deltaY: number): void {
    if (!this.enableRotate) return;
    
    const element = document.body; // Or specific container
    const rect = element.getBoundingClientRect();
    
    this.targetTheta -= (2 * Math.PI * deltaX) / rect.width * this.rotateSpeed;
    this.targetPhi -= (2 * Math.PI * deltaY) / rect.height * this.rotateSpeed;
    
    // Constrain phi
    this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi));
  }
  
  /**
   * Handle zoom
   */
  public zoom(delta: number): void {
    if (!this.enableZoom) return;
    
    this.targetDistance *= Math.pow(0.95, delta * this.zoomSpeed);
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }
  
  /**
   * Handle pan
   */
  public pan(deltaX: number, deltaY: number): void {
    if (!this.enablePan) return;
    
    const element = document.body; // Or specific container
    const rect = element.getBoundingClientRect();
    
    const targetDistance = this.targetDistance;
    const targetPosition = this.targetPosition;
    
    // Calculate pan vectors
    const panLeft = new THREE.Vector3()
      .setFromMatrixColumn(this.camera.matrix, 0)
      .multiplyScalar(-deltaX * targetDistance / rect.width * this.panSpeed);
    
    const panUp = new THREE.Vector3()
      .setFromMatrixColumn(this.camera.matrix, 1)
      .multiplyScalar(deltaY * targetDistance / rect.height * this.panSpeed);
    
    this.targetPosition.add(panLeft).add(panUp);
  }
  
  /**
   * Set constraints for camera movement
   */
  public setConstraints(constraints: {
    minDistance?: number;
    maxDistance?: number;
    minPhi?: number;
    maxPhi?: number;
    minTheta?: number;
    maxTheta?: number;
  }): void {
    if (constraints.minDistance !== undefined) this.minDistance = constraints.minDistance;
    if (constraints.maxDistance !== undefined) this.maxDistance = constraints.maxDistance;
    if (constraints.minPhi !== undefined) this.minPhi = constraints.minPhi;
    if (constraints.maxPhi !== undefined) this.maxPhi = constraints.maxPhi;
    if (constraints.minTheta !== undefined) this.minTheta = constraints.minTheta;
    if (constraints.maxTheta !== undefined) this.maxTheta = constraints.maxTheta;
  }
  
  /**
   * Enable/disable auto rotation
   */
  public setAutoRotate(enabled: boolean, speed: number = 2.0): void {
    this.autoRotate = enabled;
    this.autoRotateSpeed = speed;
  }
  
  /**
   * Reset camera to default position
   */
  public reset(): void {
    this.targetPosition.set(0, 0, 0);
    this.targetDistance = 10;
    this.targetPhi = Math.PI / 2;
    this.targetTheta = 0;
  }
  
  /**
   * Get current camera state
   */
  public getState(): {
    target: THREE.Vector3;
    distance: number;
    phi: number;
    theta: number;
  } {
    return {
      target: this.target.clone(),
      distance: this.distance,
      phi: this.phi,
      theta: this.theta
    };
  }
  
  /**
   * Set camera state
   */
  public setState(state: {
    target?: THREE.Vector3;
    distance?: number;
    phi?: number;
    theta?: number;
  }): void {
    if (state.target) this.targetPosition.copy(state.target);
    if (state.distance !== undefined) this.targetDistance = state.distance;
    if (state.phi !== undefined) this.targetPhi = state.phi;
    if (state.theta !== undefined) this.targetTheta = state.theta;
  }
}