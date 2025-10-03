import * as THREE from 'three';
import { SpaceGraph } from '../src/index';
import { AdvancedCameraControls } from '../src/utils/AdvancedCameraControls';
import { EnhancedInteractionSystem } from '../src/utils/EnhancedInteractionSystem';
import { EnhancedHUDSystem } from '../src/utils/EnhancedHUDSystem';
import { OptimizedPerformanceSystem } from '../src/utils/OptimizedPerformanceSystem';
import { EnhancedAnimationSystem } from '../src/utils/EnhancedAnimationSystem';
import { VisualFeedbackSystem } from '../src/utils/VisualFeedbackSystem';

/**
 * Simplified enhanced integration demo showcasing all enhanced systems
 */
export class EnhancedIntegrationDemo {
  private spaceGraph!: SpaceGraph;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Enhanced systems
  private cameraControls!: AdvancedCameraControls;
  private interactionSystem!: EnhancedInteractionSystem;
  private hudSystem!: EnhancedHUDSystem;
  private performanceOptimizer!: OptimizedPerformanceSystem;
  private animationSystem!: EnhancedAnimationSystem;
  private visualFeedback!: VisualFeedbackSystem;

  private isRunning = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeScene();
    this.initializeEnhancedSystems();
    this.createSampleData();
    this.setupEventHandlers();
    this.start();
  }

  /**
   * Initialize Three.js scene
   */
  private initializeScene(): void {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Initialize SpaceGraph
    this.spaceGraph = new SpaceGraph('#enhanced-demo-container', {
      data: { nodes: [], edges: [] },
      layout: {
        type: 'force-directed',
        charge: -100,
        linkDistance: 10,
        linkStrength: 1,
      },
      camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 50 },
      controls: {
        keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 },
      },
      performance: { instancingThreshold: 100 },
      interaction: { hoveredElementId: null, selectedElementIds: [] },
      style: {},
    });

    // Get scene and camera from SpaceGraph
    this.scene = this.spaceGraph.scene;
    this.camera = this.spaceGraph.camera;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  /**
   * Initialize all enhanced systems
   */
  private initializeEnhancedSystems(): void {
    // Initialize camera controls
    this.cameraControls = new AdvancedCameraControls({
      camera: this.camera as any,
      domElement: this.renderer.domElement,
      options: {
        enableDamping: true,
        dampingFactor: 0.05,
        enableZoom: true,
        enableRotate: true,
        enablePan: true,
        autoRotate: false,
        autoRotateSpeed: 0.5,
        minDistance: 10,
        maxDistance: 200,
        minPolarAngle: 0,
        maxPolarAngle: Math.PI,
      },
    });

    // Initialize interaction system
    this.interactionSystem = new EnhancedInteractionSystem(
      this.scene,
      this.camera,
      {
        enableVisualFeedback: true,
        enableHapticFeedback: false,
        enableSoundFeedback: false,
        feedbackIntensity: 1.0,
        hoverDelay: 100,
        clickThreshold: 200,
        dragThreshold: 5,
        multiSelect: true,
        enableGestures: true,
      }
    );

    // Set camera controls for interaction system
    this.interactionSystem.setCameraControls(this.cameraControls);

    // Initialize HUD system
    this.hudSystem = new EnhancedHUDSystem(this.container);

    // Initialize performance optimizer
    this.performanceOptimizer = new OptimizedPerformanceSystem(
      this.scene,
      this.camera,
      this.renderer,
      {
        enableObjectPooling: true,
        enableFrustumCulling: true,
        enableLOD: true,
        enableMemoryManagement: true,
        enableBatching: true,
        enableInstancing: true,
        maxFPS: 60,
        targetFrameTime: 16.67,
        qualityLevel: 'high',
        adaptiveQuality: true,
      }
    );

    // Initialize animation system
    this.animationSystem = new EnhancedAnimationSystem(this.scene);

    // Initialize visual feedback system
    this.visualFeedback = new VisualFeedbackSystem(this.scene);
  }

  /**
   * Create sample graph data
   */
  private createSampleData(): void {
    // Create nodes with different types
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b];

    const nodes = [];
    for (let i = 0; i < 20; i++) {
      nodes.push({
        id: `node_${i}`,
        label: `Node ${i}`,
        type: 'sphere',
        color: `#${colors[Math.floor(Math.random() * colors.length)].toString(16).padStart(6, '0')}`,
        position: {
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 50,
          z: (Math.random() - 0.5) * 50,
        },
        data: {
          importance: Math.random(),
          category: `category_${Math.floor(Math.random() * 3)}`,
        },
      });
    }

    // Generate edges
    const edges = [];
    for (let i = 0; i < 30; i++) {
      const source = nodes[Math.floor(Math.random() * nodes.length)];
      const target = nodes[Math.floor(Math.random() * nodes.length)];

      if (source.id !== target.id) {
        edges.push({
          id: `edge_${i}`,
          source: source.id,
          target: target.id,
          color: '#666666',
        });
      }
    }

    // Add data to SpaceGraph
    this.spaceGraph.update({
      data: {
        nodes: { add: nodes },
        edges: { add: edges },
      },
    });
  }

  /**
   * Setup event handlers for enhanced interactions
   */
  private setupEventHandlers(): void {
    // Node hover events
    this.interactionSystem.on('hoverstart', (object: THREE.Object3D) => {
      this.hudSystem.setStatus(
        `Hovering over ${object.userData.label || 'object'}`,
        2000
      );
      this.visualFeedback.applyFeedback(object, {
        type: 'hover',
        intensity: 0.5,
        duration: 0,
        glow: true,
        pulse: false,
      });
    });

    this.interactionSystem.on('hoverend', (objectId: string) => {
      this.visualFeedback.clearFeedback(objectId);
    });

    // Node click events
    this.interactionSystem.on('click', (object: THREE.Object3D) => {
      this.handleNodeClick(object);
    });

    this.interactionSystem.on('doubleclick', (object: THREE.Object3D) => {
      this.cameraControls.frameObjects([object]);
      this.hudSystem.showNotification(
        `Framed ${object.userData.label || 'object'}`,
        'info',
        2000
      );
    });

    // Selection events
    this.interactionSystem.on('select', (object: THREE.Object3D) => {
      this.visualFeedback.applyFeedback(object, {
        type: 'select',
        intensity: 0.8,
        duration: 0,
        glow: true,
        pulse: true,
        particles: true,
      });

      this.hudSystem.setStatus(
        `Selected ${object.userData.label || 'object'}`,
        2000
      );
    });

    this.interactionSystem.on('deselect', (object: THREE.Object3D) => {
      this.visualFeedback.clearFeedback(object.uuid);
    });

    // Drag events
    this.interactionSystem.on('dragstart', (object: THREE.Object3D) => {
      this.visualFeedback.applyFeedback(object, {
        type: 'drag',
        intensity: 0.6,
        duration: 0,
        glow: true,
        scale: 1.1,
      });
    });

    this.interactionSystem.on('dragend', (objectId: string) => {
      this.visualFeedback.clearFeedback(objectId);
    });

    // Keyboard shortcuts
    this.interactionSystem.on('keydown', (event: KeyboardEvent) => {
      this.handleKeyboardShortcuts(event);
    });

    // HUD button events
    this.setupHUDButts();
  }

  /**
   * Setup HUD button handlers
   */
  private setupHUDButts(): void {
    const resetCameraBtn = this.hudSystem.getElement('reset-camera');
    if (resetCameraBtn) {
      resetCameraBtn.querySelector('button')?.addEventListener('click', () => {
        this.cameraControls.reset();
        this.hudSystem.showNotification(
          'Camera reset to default position',
          'info',
          2000
        );
      });
    }

    const toggleWireframeBtn = this.hudSystem.getElement('toggle-wireframe');
    if (toggleWireframeBtn) {
      toggleWireframeBtn
        .querySelector('button')
        ?.addEventListener('click', () => {
          this.toggleWireframe();
          this.hudSystem.showNotification(
            'Wireframe mode toggled',
            'info',
            2000
          );
        });
    }

    const toggleStatsBtn = this.hudSystem.getElement('toggle-stats');
    if (toggleStatsBtn) {
      toggleStatsBtn.querySelector('button')?.addEventListener('click', () => {
        this.toggleStats();
        this.hudSystem.showNotification(
          'Statistics display toggled',
          'info',
          2000
        );
      });
    }
  }

  /**
   * Handle node click with enhanced animations
   */
  private handleNodeClick(object: THREE.Object3D): void {
    // Create click animation
    this.animationSystem.createAnimation(object, {
      type: 'pulse',
      duration: 500,
      to: 0.8,
    });

    // Create particle effect
    this.animationSystem.createAnimation(object, {
      type: 'explode',
      duration: 1000,
      from: object.userData.color || 0xffffff,
      to: 0.5,
    });

    // Show node information
    this.hudSystem.showNotification(
      `Clicked on ${object.userData.label || 'object'}`,
      'info',
      2000
    );
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    switch (event.key.toLowerCase()) {
      case 'r':
        this.cameraControls.reset();
        this.hudSystem.showNotification('Camera reset', 'info', 1000);
        break;
      case 'f': {
        // Focus on selected objects
        const selectedObjects = (this.interactionSystem as any)[
          'selectedObjects'
        ];
        if (selectedObjects.size > 0) {
          const objects = Array.from(selectedObjects as Set<string>)
            .map((id: string) => this.scene.getObjectByProperty('uuid', id))
            .filter((obj): obj is THREE.Object3D => obj !== undefined);
          if (objects.length > 0) {
            this.cameraControls.frameObjects(objects);
            this.hudSystem.showNotification(
              `Focused on ${objects.length} objects`,
              'info',
              2000
            );
          }
        }
        break;
      }
      case 'a':
        if (event.ctrlKey) {
          event.preventDefault();
          this.interactionSystem.selectAllObjects();
          this.hudSystem.showNotification('All objects selected', 'info', 2000);
        }
        break;
      case 'escape':
        this.interactionSystem.clearSelection();
        this.hudSystem.showNotification('Selection cleared', 'info', 1000);
        break;
      case ' ':
        event.preventDefault();
        this.cameraControls.setAutoRotate(true);
        this.hudSystem.showNotification('Auto-rotate enabled', 'info', 2000);
        break;
      case 'p': {
        const currentLevel =
          this.performanceOptimizer.getMetrics().qualityLevel;
        const newLevel = currentLevel > 0 ? 0 : 2; // Toggle between low and high
        this.performanceOptimizer.setQualityLevel(
          newLevel === 0 ? 'low' : 'high'
        );
        this.hudSystem.showNotification(
          `Quality level set to ${newLevel === 0 ? 'low' : 'high'}`,
          'info',
          2000
        );
        break;
      }
    }
  }

  /**
   * Helper methods
   */
  private toggleWireframe(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const material = Array.isArray(object.material)
          ? object.material[0]
          : object.material;
        if (material instanceof THREE.MeshBasicMaterial) {
          material.wireframe = !material.wireframe;
        }
      }
    });
  }

  private toggleStats(): void {
    const performancePanel = this.hudSystem.getElement('performance-panel');
    if (performancePanel) {
      const isVisible = performancePanel.style.display !== 'none';
      this.hudSystem.toggleElement('performance-panel', !isVisible);
      this.hudSystem.toggleElement('fps-counter', !isVisible);
      this.hudSystem.toggleElement('memory-usage', !isVisible);
      this.hudSystem.toggleElement('node-count', !isVisible);
      this.hudSystem.toggleElement('edge-count', !isVisible);
      this.hudSystem.toggleElement('draw-calls', !isVisible);
    }
  }

  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    // Update camera controls
    this.cameraControls.update();

    // Update interaction system
    this.interactionSystem.update();

    // Update animation system
    this.animationSystem.update();

    // Update performance metrics
    const metrics = this.performanceOptimizer.getMetrics();
    this.hudSystem.updatePerformanceMetrics(metrics);

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Start the demo
   */
  public start(): void {
    this.isRunning = true;
    this.animate();

    // Add resize handler
    window.addEventListener('resize', () => this.handleResize());

    // Show welcome message
    this.hudSystem.showNotification(
      'Enhanced SpaceGraph Demo Started!\nUse mouse to interact, keyboard shortcuts for controls',
      'success',
      5000
    );

    console.log('Enhanced SpaceGraph Integration Demo started');
    console.log('Keyboard shortcuts:');
    console.log('- R: Reset camera');
    console.log('- F: Focus selected objects');
    console.log('- A: Select all (Ctrl+A)');
    console.log('- Space: Enable auto-rotate');
    console.log('- P: Toggle performance monitoring');
    console.log('- Escape: Clear selection');
  }

  /**
   * Stop the demo
   */
  public stop(): void {
    this.isRunning = false;

    // Cleanup
    window.removeEventListener('resize', this.handleResize);

    this.interactionSystem.dispose();
    this.hudSystem.dispose();
    this.performanceOptimizer.dispose();
    this.animationSystem.dispose();
    this.visualFeedback.dispose();

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

// Export function to initialize demo
export function createEnhancedIntegrationDemo(
  container: HTMLElement
): EnhancedIntegrationDemo {
  return new EnhancedIntegrationDemo(container);
}

// Auto-initialize if container is provided
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('enhanced-demo-container');
    if (container) {
      const demo = createEnhancedIntegrationDemo(container);

      // Expose demo to window for debugging
      (window as any).enhancedDemo = demo;
    }
  });
}
