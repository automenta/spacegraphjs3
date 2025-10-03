/**
 * Performance Utilities - Common performance optimization functions
 * Provides reusable utilities for performance monitoring and optimization
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  renderTime: number;
}

export interface PerformanceConfig {
  enableFPSMonitoring?: boolean;
  enableMemoryTracking?: boolean;
  enableRenderTiming?: boolean;
  updateInterval?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export class PerformanceUtils {
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    nodeCount: 0,
    edgeCount: 0,
    renderTime: 0,
  };

  private config: PerformanceConfig;
  private isMonitoring: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private frameTimes: number[] = [];
  private maxFrameSamples: number = 60;
  private monitoringId: number | null = null;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableFPSMonitoring: true,
      enableMemoryTracking: true,
      enableRenderTiming: true,
      updateInterval: 1000,
      ...config,
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.frameTimes = [];

    const monitor = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      this.frameCount++;

      // Calculate frame time
      const frameTime = currentTime - this.lastFrameTime;
      this.frameTimes.push(frameTime);

      // Keep only recent samples
      if (this.frameTimes.length > this.maxFrameSamples) {
        this.frameTimes.shift();
      }

      // Update FPS every second
      if (currentTime - this.lastFrameTime >= this.config.updateInterval!) {
        this.updateMetrics(currentTime);
      }

      this.lastFrameTime = currentTime;
      this.monitoringId = requestAnimationFrame(monitor);
    };

    this.monitoringId = requestAnimationFrame(monitor);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringId !== null) {
      cancelAnimationFrame(this.monitoringId);
      this.monitoringId = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(currentTime: number): void {
    if (this.config.enableFPSMonitoring) {
      this.metrics.fps = Math.round(
        (this.frameCount * 1000) /
          (currentTime - this.lastFrameTime + this.config.updateInterval!)
      );
      this.metrics.frameTime =
        this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }

    if (this.config.enableMemoryTracking && (performance as any).memory) {
      this.metrics.memoryUsage =
        (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    if (this.config.onMetricsUpdate) {
      this.config.onMetricsUpdate({ ...this.metrics });
    }

    // Reset counters
    this.frameCount = 0;
  }

  /**
   * Update node and edge counts
   */
  updateElementCounts(nodeCount: number, edgeCount: number): void {
    this.metrics.nodeCount = nodeCount;
    this.metrics.edgeCount = edgeCount;
  }

  /**
   * Measure render time for a specific operation
   */
  async measureRenderTime<T>(
    operation: () => T | Promise<T>
  ): Promise<{ result: T; renderTime: number }> {
    if (!this.config.enableRenderTiming) {
      const result = await operation();
      return { result, renderTime: 0 };
    }

    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    this.metrics.renderTime = renderTime;

    return { result, renderTime };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(
    thresholds: Partial<PerformanceMetrics> = {}
  ): boolean {
    const defaultThresholds = {
      fps: 30,
      frameTime: 33.33, // ~30 FPS
      memoryUsage: 100, // MB
      renderTime: 16.67, // ~60 FPS
    };

    const actualThresholds = { ...defaultThresholds, ...thresholds };

    return (
      this.metrics.fps >= actualThresholds.fps! &&
      this.metrics.frameTime <= actualThresholds.frameTime! &&
      this.metrics.memoryUsage <= actualThresholds.memoryUsage! &&
      this.metrics.renderTime <= actualThresholds.renderTime!
    );
  }

  /**
   * Get performance status color
   */
  getPerformanceColor(): string {
    if (this.metrics.fps > 50) return '#00ff00'; // Green
    if (this.metrics.fps > 30) return '#ffff00'; // Yellow
    return '#ff0000'; // Red
  }

  /**
   * Create performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.fps < 30) {
      recommendations.push('Consider reducing node count or complexity');
      recommendations.push('Enable LOD (Level of Detail) for distant objects');
      recommendations.push('Reduce animation complexity');
    }

    if (this.metrics.frameTime > 33) {
      recommendations.push('Optimize rendering pipeline');
      recommendations.push('Consider culling off-screen objects');
    }

    if (this.metrics.memoryUsage > 100) {
      recommendations.push('Monitor memory usage - consider object pooling');
      recommendations.push('Check for memory leaks in event listeners');
    }

    if (this.metrics.renderTime > 16) {
      recommendations.push('Optimize individual render operations');
      recommendations.push('Consider batching similar operations');
    }

    return recommendations;
  }

  /**
   * Create a simple performance monitor element
   */
  createPerformanceMonitor(): HTMLElement {
    const monitor = document.createElement('div');
    monitor.style.position = 'fixed';
    monitor.style.top = '10px';
    monitor.style.right = '10px';
    monitor.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    monitor.style.color = 'white';
    monitor.style.padding = '10px';
    monitor.style.borderRadius = '5px';
    monitor.style.fontFamily = 'monospace';
    monitor.style.fontSize = '12px';
    monitor.style.zIndex = '10000';
    monitor.style.minWidth = '150px';

    const updateDisplay = () => {
      const color = this.getPerformanceColor();
      monitor.innerHTML = `
        <div style="color: ${color}; font-weight: bold;">FPS: ${this.metrics.fps}</div>
        <div>Frame: ${this.metrics.frameTime.toFixed(2)}ms</div>
        <div>Memory: ${this.metrics.memoryUsage.toFixed(1)}MB</div>
        <div>Nodes: ${this.metrics.nodeCount}</div>
        <div>Edges: ${this.metrics.edgeCount}</div>
      `;
    };

    // Update display periodically
    setInterval(updateDisplay, 1000);
    updateDisplay();

    return monitor;
  }

  /**
   * Batch operations for better performance
   */
  static batchOperations<T>(
    operations: (() => T)[],
    batchSize: number = 10
  ): T[] {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = batch.map((op) => op());
      results.push(...batchResults);

      // Yield to browser between batches
      if (i + batchSize < operations.length) {
        // Use setTimeout to yield control
        setTimeout(() => {}, 0);
      }
    }

    return results;
  }

  /**
   * Debounce function calls for performance
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Throttle function calls for performance
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Optimize array operations
   */
  static optimizeArrayOperations<T>(
    array: T[],
    operation: (item: T) => void
  ): void {
    // Use chunked processing for large arrays
    const chunkSize = 1000;

    if (array.length <= chunkSize) {
      array.forEach(operation);
      return;
    }

    let index = 0;
    const processChunk = () => {
      const endIndex = Math.min(index + chunkSize, array.length);

      for (let i = index; i < endIndex; i++) {
        operation(array[i]);
      }

      index = endIndex;

      if (index < array.length) {
        setTimeout(processChunk, 0);
      }
    };

    processChunk();
  }

  /**
   * Create a performance profiler
   */
  createProfiler(name: string): PerformanceProfiler {
    return new PerformanceProfiler(name, this);
  }
}

/**
 * Performance Profiler for specific operations
 */
export class PerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  constructor(
    private name: string,
    private performanceUtils: PerformanceUtils
  ) {}

  /**
   * Mark a performance checkpoint
   */
  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * Measure time between two marks
   */
  measure(startLabel: string, endLabel: string, measureName?: string): number {
    const startTime = this.marks.get(startLabel);
    const endTime = this.marks.get(endLabel);

    if (startTime === undefined || endTime === undefined) {
      console.warn(`PerformanceProfiler: Missing marks for measurement`);
      return 0;
    }

    const duration = endTime - startTime;
    const name = measureName || `${startLabel}-${endLabel}`;
    this.measures.set(name, duration);

    return duration;
  }

  /**
   * Get all measurements
   */
  getMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    console.group(`Performance Profile: ${this.name}`);

    this.measures.forEach((duration, name) => {
      console.log(`${name}: ${duration.toFixed(2)}ms`);
    });

    console.groupEnd();
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

export default PerformanceUtils;
