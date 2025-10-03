import { animate } from 'popmotion';
import { AnimationCurves } from './AnimationUtils';

/**
 * HUD element configuration
 */
export interface HUDElementConfig {
  id: string;
  type: 'text' | 'button' | 'slider' | 'chart' | 'panel' | 'icon';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: number;
    fontSize?: number;
    opacity?: number;
  };
  content?: string;
  visible?: boolean;
  interactive?: boolean;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  nodes: number;
  edges: number;
}

/**
 * Enhanced HUD system with interactive elements
 */
export class EnhancedHUDSystem {
  private container: HTMLElement;
  private elements: Map<string, HTMLElement> = new Map();
  private animations: Map<string, () => void> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    nodes: 0,
    edges: 0,
  };

  private fpsHistory: number[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupContainer();
    this.createDefaultElements();
    this.startPerformanceMonitoring();
  }

  /**
   * Setup HUD container
   */
  private setupContainer(): void {
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '1000';
  }

  /**
   * Create default HUD elements
   */
  private createDefaultElements(): void {
    // Performance panel
    this.createElement({
      id: 'performance-panel',
      type: 'panel',
      position: { x: 10, y: 10 },
      size: { width: 200, height: 150 },
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#00ff00',
        borderRadius: 5,
        opacity: 0.9,
      },
      visible: true,
    });

    // FPS counter
    this.createElement({
      id: 'fps-counter',
      type: 'text',
      position: { x: 20, y: 30 },
      size: { width: 180, height: 20 },
      content: 'FPS: 0',
      style: {
        textColor: '#00ff00',
        fontSize: 14,
      },
      visible: true,
    });

    // Memory usage
    this.createElement({
      id: 'memory-usage',
      type: 'text',
      position: { x: 20, y: 55 },
      size: { width: 180, height: 20 },
      content: 'Memory: 0 MB',
      style: {
        textColor: '#00ff00',
        fontSize: 14,
      },
      visible: true,
    });

    // Node count
    this.createElement({
      id: 'node-count',
      type: 'text',
      position: { x: 20, y: 80 },
      size: { width: 180, height: 20 },
      content: 'Nodes: 0',
      style: {
        textColor: '#00ff00',
        fontSize: 14,
      },
      visible: true,
    });

    // Edge count
    this.createElement({
      id: 'edge-count',
      type: 'text',
      position: { x: 20, y: 105 },
      size: { width: 180, height: 20 },
      content: 'Edges: 0',
      style: {
        textColor: '#00ff00',
        fontSize: 14,
      },
      visible: true,
    });

    // Draw calls
    this.createElement({
      id: 'draw-calls',
      type: 'text',
      position: { x: 20, y: 130 },
      size: { width: 180, height: 20 },
      content: 'Draw Calls: 0',
      style: {
        textColor: '#00ff00',
        fontSize: 14,
      },
      visible: true,
    });

    // Control panel
    this.createElement({
      id: 'control-panel',
      type: 'panel',
      position: { x: 10, y: 170 },
      size: { width: 200, height: 200 },
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#0088ff',
        borderRadius: 5,
        opacity: 0.9,
      },
      visible: true,
    });

    // Control buttons
    const buttons = [
      { id: 'reset-camera', label: 'Reset Camera', y: 190 },
      { id: 'toggle-physics', label: 'Toggle Physics', y: 220 },
      { id: 'toggle-wireframe', label: 'Wireframe', y: 250 },
      { id: 'toggle-stats', label: 'Toggle Stats', y: 280 },
      { id: 'export-scene', label: 'Export Scene', y: 310 },
    ];

    buttons.forEach((button) => {
      this.createElement({
        id: button.id,
        type: 'button',
        position: { x: 20, y: button.y },
        size: { width: 160, height: 25 },
        content: button.label,
        style: {
          backgroundColor: 'rgba(0, 136, 255, 0.7)',
          textColor: '#ffffff',
          borderColor: '#0088ff',
          borderRadius: 3,
          fontSize: 12,
        },
        visible: true,
        interactive: true,
      });
    });

    // Status bar
    this.createElement({
      id: 'status-bar',
      type: 'panel',
      position: { x: 10, y: window.innerHeight - 40 },
      size: { width: 300, height: 30 },
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#666666',
        borderRadius: 5,
        opacity: 0.95,
      },
      visible: true,
    });

    // Status text
    this.createElement({
      id: 'status-text',
      type: 'text',
      position: { x: 20, y: window.innerHeight - 30 },
      size: { width: 280, height: 20 },
      content: 'Ready',
      style: {
        textColor: '#ffffff',
        fontSize: 12,
      },
      visible: true,
    });

    // FPS chart
    this.createElement({
      id: 'fps-chart',
      type: 'chart',
      position: { x: window.innerWidth - 220, y: 10 },
      size: { width: 200, height: 100 },
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#00ff00',
        borderRadius: 5,
        opacity: 0.9,
      },
      visible: true,
    });
  }

  /**
   * Create HUD element
   */
  public createElement(config: HUDElementConfig): HTMLElement {
    const element = document.createElement('div');
    element.id = config.id;
    element.style.position = 'absolute';
    element.style.left = `${config.position.x}px`;
    element.style.top = `${config.position.y}px`;
    element.style.width = `${config.size.width}px`;
    element.style.height = `${config.size.height}px`;
    element.style.pointerEvents = config.interactive ? 'auto' : 'none';
    element.style.display = config.visible !== false ? 'block' : 'none';

    // Apply styles
    if (config.style) {
      if (config.style.backgroundColor) {
        element.style.backgroundColor = config.style.backgroundColor;
      }
      if (config.style.textColor) {
        element.style.color = config.style.textColor;
      }
      if (config.style.borderColor) {
        element.style.border = `1px solid ${config.style.borderColor}`;
      }
      if (config.style.borderRadius) {
        element.style.borderRadius = `${config.style.borderRadius}px`;
      }
      if (config.style.fontSize) {
        element.style.fontSize = `${config.style.fontSize}px`;
      }
      if (config.style.opacity !== undefined) {
        element.style.opacity = config.style.opacity.toString();
      }
    }

    // Set content based on type
    switch (config.type) {
      case 'button':
        element.innerHTML = `<button style="width: 100%; height: 100%; background: transparent; border: none; color: inherit; cursor: pointer;">${config.content}</button>`;
        break;
      case 'text':
        element.innerHTML = config.content || '';
        break;
      case 'panel':
        // Panel is just a styled div
        break;
      case 'chart':
        element.innerHTML = '<canvas width="100%" height="100%"></canvas>';
        break;
      case 'icon':
        element.innerHTML = config.content || '';
        break;
      case 'slider':
        element.innerHTML = `<input type="range" style="width: 100%;" value="50">`;
        break;
    }

    this.container.appendChild(element);
    this.elements.set(config.id, element);

    return element;
  }

  /**
   * Update element content
   */
  public updateElement(id: string, content: string): void {
    const element = this.elements.get(id);
    if (element) {
      if (element.querySelector('button')) {
        element.querySelector('button')!.textContent = content;
      } else if (element.querySelector('canvas')) {
        // Update chart
        this.updateChart(id, content);
      } else {
        element.textContent = content;
      }
    }
  }

  /**
   * Show/hide element with animation
   */
  public toggleElement(
    id: string,
    show: boolean,
    duration: number = 300
  ): void {
    const element = this.elements.get(id);
    if (!element) return;

    // Stop existing animation
    const existingAnimation = this.animations.get(id);
    if (existingAnimation) {
      existingAnimation();
    }

    if (show) {
      element.style.display = 'block';

      const stopAnimation = animate({
        from: { opacity: 0, scale: 0.8 },
        to: { opacity: 1, scale: 1 },
        duration,
        ease: AnimationCurves.easeOut.easing,
        onUpdate: ({ opacity, scale }) => {
          element.style.opacity = opacity.toString();
          element.style.transform = `scale(${scale})`;
        },
      });

      this.animations.set(id, () => stopAnimation.stop());
    } else {
      const stopAnimation = animate({
        from: { opacity: 1, scale: 1 },
        to: { opacity: 0, scale: 0.8 },
        duration,
        ease: AnimationCurves.easeIn.easing,
        onUpdate: ({ opacity, scale }) => {
          element.style.opacity = opacity.toString();
          element.style.transform = `scale(${scale})`;
        },
        onComplete: () => {
          element.style.display = 'none';
        },
      });

      this.animations.set(id, () => stopAnimation.stop());
    }
  }

  /**
   * Update performance metrics
   */
  public updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    Object.assign(this.performanceMetrics, metrics);

    // Update display
    this.updateElement(
      'fps-counter',
      `FPS: ${Math.round(this.performanceMetrics.fps)}`
    );
    this.updateElement(
      'memory-usage',
      `Memory: ${Math.round(this.performanceMetrics.memoryUsage)} MB`
    );
    this.updateElement('node-count', `Nodes: ${this.performanceMetrics.nodes}`);
    this.updateElement('edge-count', `Edges: ${this.performanceMetrics.edges}`);
    this.updateElement(
      'draw-calls',
      `Draw Calls: ${this.performanceMetrics.drawCalls}`
    );
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    const updateLoop = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;

      this.frameCount++;

      if (this.frameCount % 60 === 0) {
        // Update every 60 frames
        const fps = 1000 / deltaTime;
        this.fpsHistory.push(fps);

        if (this.fpsHistory.length > 100) {
          this.fpsHistory.shift();
        }

        // Update FPS chart
        this.updateFPSChart();

        // Update memory usage if available
        if ((performance as any).memory) {
          this.performanceMetrics.memoryUsage =
            (performance as any).memory.usedJSHeapSize / 1048576;
        }

        this.updatePerformanceMetrics({
          fps:
            this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length,
        });
      }

      this.lastFrameTime = currentTime;
      requestAnimationFrame(updateLoop);
    };

    updateLoop();
  }

  /**
   * Update FPS chart
   */
  private updateFPSChart(): void {
    const element = this.elements.get('fps-chart');
    if (!element) return;

    const canvas = element.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw FPS line
    if (this.fpsHistory.length > 1) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const step = width / (this.fpsHistory.length - 1);
      const maxFPS = Math.max(...this.fpsHistory, 60);

      this.fpsHistory.forEach((fps, index) => {
        const x = index * step;
        const y = height - (fps / maxFPS) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw current FPS text
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`${Math.round(this.performanceMetrics.fps)} FPS`, 5, 15);
  }

  /**
   * Update chart data
   */
  private updateChart(id: string, data: string): void {
    // Implementation for updating chart data
    const element = this.elements.get(id);
    if (element && element.querySelector('canvas')) {
      // Parse and update chart data
      console.log(`Updating chart ${id} with data: ${data}`);
    }
  }

  /**
   * Set status text
   */
  public setStatus(text: string, duration: number = 3000): void {
    this.updateElement('status-text', text);

    if (duration > 0) {
      setTimeout(() => {
        this.updateElement('status-text', 'Ready');
      }, duration);
    }
  }

  /**
   * Show notification
   */
  public showNotification(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 3000
  ): void {
    const notificationId = `notification-${Date.now()}`;

    const colors = {
      info: '#0088ff',
      success: '#00ff00',
      warning: '#ffaa00',
      error: '#ff0000',
    };

    this.createElement({
      id: notificationId,
      type: 'panel',
      position: { x: window.innerWidth - 310, y: 120 },
      size: { width: 300, height: 50 },
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: colors[type],
        borderRadius: 5,
        opacity: 0,
      },
      visible: true,
    });

    this.createElement({
      id: `${notificationId}-text`,
      type: 'text',
      position: { x: window.innerWidth - 300, y: 135 },
      size: { width: 280, height: 20 },
      content: message,
      style: {
        textColor: colors[type],
        fontSize: 14,
      },
      visible: true,
    });

    // Animate in
    this.toggleElement(notificationId, true, 200);
    this.toggleElement(`${notificationId}-text`, true, 200);

    // Auto remove
    setTimeout(() => {
      this.toggleElement(notificationId, false, 200);
      this.toggleElement(`${notificationId}-text`, false, 200);

      setTimeout(() => {
        const element = this.elements.get(notificationId);
        const textElement = this.elements.get(`${notificationId}-text`);

        if (element) {
          element.remove();
          this.elements.delete(notificationId);
        }

        if (textElement) {
          textElement.remove();
          this.elements.delete(`${notificationId}-text`);
        }
      }, 200);
    }, duration);
  }

  /**
   * Get element by ID
   */
  public getElement(id: string): HTMLElement | undefined {
    return this.elements.get(id);
  }

  /**
   * Remove element
   */
  public removeElement(id: string): void {
    const element = this.elements.get(id);
    if (element) {
      element.remove();
      this.elements.delete(id);
    }
  }

  /**
   * Clear all elements
   */
  public clear(): void {
    this.elements.forEach((element, _id) => {
      element.remove();
    });
    this.elements.clear();
    this.animations.clear();
  }

  /**
   * Dispose of HUD system
   */
  public dispose(): void {
    this.clear();

    // Stop all animations
    this.animations.forEach((stopAnimation) => stopAnimation());
    this.animations.clear();
  }
}
