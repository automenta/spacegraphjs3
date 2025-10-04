import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';

/**
 * Performance measurement data
 */
export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Performance metrics for a specific operation
 */
export interface PerformanceMetrics {
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalCalls: number;
  totalTime: number;
  lastCallTime?: number;
  trend: 'improving' | 'degrading' | 'stable';
}

/**
 * Throttling configuration
 */
export interface ThrottleConfig {
  /** Maximum calls per second */
  maxCallsPerSecond: number;
  /** Whether to queue excess calls */
  queueExcess?: boolean;
  /** Maximum queue size */
  maxQueueSize?: number;
}

/**
 * Performance monitoring and throttling system
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private measurements: Map<string, PerformanceMeasurement[]> = new Map();
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private throttleQueues: Map<string, Array<{ fn: Function; timestamp: number }>> = new Map();
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
  private disposed: boolean = false;

  private constructor() {
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start measuring performance for an operation
   */
  public startMeasurement(name: string, metadata?: Record<string, any>): string {
    if (this.disposed) {
      this.logger.warn('PerformanceMonitor', 'Cannot start measurement - PerformanceMonitor is disposed');
      return '';
    }

    const measurementId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const measurement: PerformanceMeasurement = {
      name,
      startTime: performance.now(),
      metadata,
    };

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    this.measurements.get(name)!.push(measurement);

    this.logger.debug('PerformanceMonitor', `Started measurement: ${measurementId} for ${name}`);
    return measurementId;
  }

  /**
   * End a performance measurement
   */
  public endMeasurement(measurementId: string): number | null {
    if (this.disposed) {
      this.logger.warn('PerformanceMonitor', 'Cannot end measurement - PerformanceMonitor is disposed');
      return null;
    }

    for (const measurements of this.measurements.values()) {
      const measurement = measurements.find(m => m.name === measurementId.split('_')[0]);
      if (measurement && !measurement.endTime) {
        measurement.endTime = performance.now();
        measurement.duration = measurement.endTime - measurement.startTime;

        this.updateMetrics(measurement.name);
        this.logger.debug('PerformanceMonitor', `Ended measurement: ${measurementId}, duration: ${measurement.duration}ms`);
        return measurement.duration;
      }
    }

    this.logger.warn('PerformanceMonitor', `Measurement not found: ${measurementId}`);
    return null;
  }

  /**
   * Measure the execution time of a synchronous function
   */
  public measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const measurementId = this.startMeasurement(name, metadata);

    try {
      const result = fn();
      this.endMeasurement(measurementId);
      return result;
    } catch (error) {
      this.endMeasurement(measurementId);
      throw error;
    }
  }

  /**
   * Measure the execution time of an asynchronous function
   */
  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const measurementId = this.startMeasurement(name, metadata);

    try {
      const result = await fn();
      this.endMeasurement(measurementId);
      return result;
    } catch (error) {
      this.endMeasurement(measurementId);
      throw error;
    }
  }

  /**
   * Update performance metrics for a measurement type
   */
  private updateMetrics(name: string): void {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return;

    const completedMeasurements = measurements.filter(m => m.duration !== undefined);
    if (completedMeasurements.length === 0) return;

    const durations = completedMeasurements.map(m => m.duration!);
    const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
    const averageTime = totalTime / durations.length;
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);

    // Calculate trend (comparing last 10 measurements to previous 10)
    const recentCount = Math.min(10, completedMeasurements.length);
    const recentMeasurements = completedMeasurements.slice(-recentCount);
    const olderMeasurements = completedMeasurements.slice(-recentCount * 2, -recentCount);

    let trend: 'improving' | 'degrading' | 'stable' = 'stable';

    if (olderMeasurements.length > 0) {
      const recentAvg = recentMeasurements.reduce((sum, m) => sum + m.duration!, 0) / recentMeasurements.length;
      const olderAvg = olderMeasurements.reduce((sum, m) => sum + m.duration!, 0) / olderMeasurements.length;

      const change = (recentAvg - olderAvg) / olderAvg;

      if (change > 0.1) {
        trend = 'degrading';
      } else if (change < -0.1) {
        trend = 'improving';
      }
    }

    const metrics: PerformanceMetrics = {
      averageTime,
      minTime,
      maxTime,
      totalCalls: completedMeasurements.length,
      totalTime,
      lastCallTime: completedMeasurements[completedMeasurements.length - 1]?.endTime,
      trend,
    };

    this.metrics.set(name, metrics);

    // Log performance warnings
    if (averageTime > 100) {
      this.logger.warn('PerformanceMonitor', `Slow operation detected: ${name} (${averageTime.toFixed(2)}ms average)`);
    }

    if (trend === 'degrading' && averageTime > 50) {
      this.logger.warn('PerformanceMonitor', `Performance degrading for: ${name}`);
    }
  }

  /**
   * Get performance metrics for an operation
   */
  public getMetrics(name: string): PerformanceMetrics | null {
    return this.metrics.get(name) || null;
  }

  /**
   * Get all performance metrics
   */
  public getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Throttle function calls to prevent performance issues
   */
  public throttle<T extends (...args: any[]) => any>(
    name: string,
    fn: T,
    config: ThrottleConfig
  ): T {
    if (this.disposed) {
      return fn;
    }

    const { maxCallsPerSecond, queueExcess = true, maxQueueSize = 100 } = config;
    const interval = 1000 / maxCallsPerSecond;

    if (!this.throttleQueues.has(name)) {
      this.throttleQueues.set(name, []);
    }

    const wrappedFn = ((...args: Parameters<T>) => {
      const now = Date.now();
      const queue = this.throttleQueues.get(name)!;

      if (queueExcess) {
        // Add to queue if under limit
        if (queue.length < maxQueueSize) {
          queue.push({ fn: () => fn(...args), timestamp: now });

          if (queue.length === 1) {
            this.processThrottleQueue(name, interval);
          }
        } else {
          this.logger.warn('PerformanceMonitor', `Throttle queue full for ${name}, dropping call`);
        }
      } else {
        // Execute immediately if under rate limit
        const recentCalls = queue.filter(call => now - call.timestamp < 1000).length;
        if (recentCalls < maxCallsPerSecond) {
          queue.push({ fn: () => fn(...args), timestamp: now });
          if (queue.length === 1) {
            this.processThrottleQueue(name, interval);
          }
        }
      }
    }) as T;

    return wrappedFn;
  }

  /**
   * Process throttled function calls
   */
  private processThrottleQueue(name: string, interval: number): void {
    const queue = this.throttleQueues.get(name);
    if (!queue || queue.length === 0) return;

    const { fn } = queue.shift()!;

    try {
      fn();
    } catch (error) {
      this.errorHandler.handleError('PerformanceMonitor', `Throttled function failed: ${name}`, error);
    }

    if (queue.length > 0) {
      const timer = setTimeout(() => {
        this.processThrottleQueue(name, interval);
      }, interval);
      this.throttleTimers.set(name, timer);
    } else {
      const timer = this.throttleTimers.get(name);
      if (timer) {
        clearTimeout(timer);
        this.throttleTimers.delete(name);
      }
    }
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): {
    totalOperations: number;
    slowOperations: string[];
    degradingOperations: string[];
    recommendations: string[];
  } {
    const slowOperations: string[] = [];
    const degradingOperations: string[] = [];
    const recommendations: string[] = [];

    for (const [name, metrics] of this.metrics) {
      if (metrics.averageTime > 100) {
        slowOperations.push(`${name} (${metrics.averageTime.toFixed(2)}ms)`);
      }

      if (metrics.trend === 'degrading' && metrics.averageTime > 50) {
        degradingOperations.push(`${name} (${metrics.averageTime.toFixed(2)}ms)`);
      }
    }

    if (slowOperations.length > 0) {
      recommendations.push(`Optimize slow operations: ${slowOperations.join(', ')}`);
    }

    if (degradingOperations.length > 0) {
      recommendations.push(`Address degrading performance: ${degradingOperations.join(', ')}`);
    }

    if (this.metrics.size > 50) {
      recommendations.push('Consider reducing the number of tracked operations');
    }

    return {
      totalOperations: this.metrics.size,
      slowOperations,
      degradingOperations,
      recommendations,
    };
  }

  /**
   * Clear all measurements and metrics
   */
  public clear(): void {
    this.measurements.clear();
    this.metrics.clear();

    // Clear throttle queues and timers
    for (const timer of this.throttleTimers.values()) {
      clearTimeout(timer);
    }
    this.throttleQueues.clear();
    this.throttleTimers.clear();
  }

  /**
   * Dispose of the PerformanceMonitor
   */
  public dispose(): void {
    this.disposed = true;
    this.clear();
  }
}