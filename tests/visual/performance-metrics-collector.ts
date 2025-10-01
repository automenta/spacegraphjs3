/**
 * Performance Metrics Collector
 * 
 * This module collects and analyzes performance metrics for visual interactions
 * to detect performance regressions and optimize user experience.
 */

interface PerformanceMetrics {
  componentName: string;
  testName: string;
  responseTime: number; // ms
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  frameRate: number; // FPS
  interactionLatency: number; // ms
  renderTime: number; // ms
  timestamp: string;
}

interface PerformanceBenchmark {
  baseline: PerformanceMetrics;
  current: PerformanceMetrics;
  regression: boolean;
  regressionPercentage: number;
}

class PerformanceMetricsCollector {
  private baselines: Map<string, PerformanceMetrics> = new Map();
  private metricsHistory: PerformanceMetrics[] = [];
  private threshold: number = 10; // Percentage threshold for regression detection

  /**
   * Collect performance metrics for a specific interaction
   */
  async collectMetrics(
    componentName: string,
    testName: string,
    interactionFn: () => Promise<any>
  ): Promise<PerformanceMetrics> {
    // Record initial state
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    const startCpu = this.getCpuUsage();
    
    // Execute the interaction
    await interactionFn();
    
    // Record final state
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    const endCpu = this.getCpuUsage();
    
    // Calculate metrics
    const metrics: PerformanceMetrics = {
      componentName,
      testName,
      responseTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      cpuUsage: endCpu - startCpu,
      frameRate: this.estimateFrameRate(endTime - startTime),
      interactionLatency: this.calculateLatency(),
      renderTime: this.calculateRenderTime(),
      timestamp: new Date().toISOString()
    };
    
    // Store metrics
    this.metricsHistory.push(metrics);
    
    return metrics;
  }

  /**
   * Set baseline metrics for regression comparison
   */
  setBaseline(identifier: string, metrics: PerformanceMetrics): void {
    this.baselines.set(identifier, metrics);
  }

  /**
   * Compare current metrics with baseline to detect regressions
   */
  compareWithBaseline(identifier: string, currentMetrics: PerformanceMetrics): PerformanceBenchmark | null {
    const baseline = this.baselines.get(identifier);
    if (!baseline) {
      console.warn(`No baseline found for ${identifier}`);
      return null;
    }
    
    const benchmark: PerformanceBenchmark = {
      baseline,
      current: currentMetrics,
      regression: false,
      regressionPercentage: 0
    };
    
    // Check for regressions in key metrics
    const responseTimeRegression = this.calculateRegressionPercentage(
      baseline.responseTime,
      currentMetrics.responseTime
    );
    
    const memoryRegression = this.calculateRegressionPercentage(
      baseline.memoryUsage,
      currentMetrics.memoryUsage
    );
    
    const cpuRegression = this.calculateRegressionPercentage(
      baseline.cpuUsage,
      currentMetrics.cpuUsage
    );
    
    // Determine if there's a significant regression
    const maxRegression = Math.max(responseTimeRegression, memoryRegression, cpuRegression);
    benchmark.regressionPercentage = maxRegression;
    
    if (maxRegression > this.threshold) {
      benchmark.regression = true;
      console.warn(`Performance regression detected in ${identifier}: ${maxRegression.toFixed(2)}% worse`);
    }
    
    return benchmark;
  }

  /**
   * Get historical performance metrics
   */
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    if (limit) {
      return this.metricsHistory.slice(-limit);
    }
    return [...this.metricsHistory];
  }

  /**
   * Clear metrics history
   */
  clearMetricsHistory(): void {
    this.metricsHistory = [];
  }

  /**
   * Set regression threshold percentage
   */
  setRegressionThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * Get performance trend analysis
   */
  getTrendAnalysis(metricName: keyof PerformanceMetrics, limit?: number): number[] {
    const history = this.getMetricsHistory(limit);
    return history.map(metrics => metrics[metricName] as number);
  }

  /**
   * Estimate frame rate based on interaction time
   */
  private estimateFrameRate(interactionTime: number): number {
    // Assuming 60fps target, calculate actual fps
    const frames = 1; // Simplified - in reality, this would count actual frames
    const seconds = interactionTime / 1000;
    return seconds > 0 ? frames / seconds : 60;
  }

  /**
   * Calculate interaction latency (simulated)
   */
  private calculateLatency(): number {
    // In a real implementation, this would measure actual input-to-response latency
    return Math.random() * 50; // Simulated latency between 0-50ms
  }

  /**
   * Calculate render time (simulated)
   */
  private calculateRenderTime(): number {
    // In a real implementation, this would measure actual rendering time
    return Math.random() * 100; // Simulated render time between 0-100ms
  }

  /**
   * Get memory usage (simulated)
   */
  private getMemoryUsage(): number {
    // In a real implementation, this would get actual memory usage
    // For browser environments, this is limited for security reasons
    return Math.random() * 100; // Simulated memory usage in MB
  }

  /**
   * Get CPU usage (simulated)
   */
  private getCpuUsage(): number {
    // In a real implementation, this would get actual CPU usage
    // For browser environments, this is limited for security reasons
    return Math.random() * 100; // Simulated CPU usage percentage
  }

  /**
   * Calculate regression percentage
   */
  private calculateRegressionPercentage(baseline: number, current: number): number {
    if (baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (this.metricsHistory.length === 0) {
      return "No performance metrics collected.";
    }
    
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const avgResponseTime = this.metricsHistory.reduce((sum, m) => sum + m.responseTime, 0) / this.metricsHistory.length;
    const avgMemoryUsage = this.metricsHistory.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metricsHistory.length;
    const avgCpuUsage = this.metricsHistory.reduce((sum, m) => sum + m.cpuUsage, 0) / this.metricsHistory.length;
    
    return `
Performance Report
==================
Component: ${latest.componentName}
Test: ${latest.testName}
Timestamp: ${latest.timestamp}

Latest Metrics:
- Response Time: ${latest.responseTime.toFixed(2)}ms
- Memory Usage: ${latest.memoryUsage.toFixed(2)}MB
- CPU Usage: ${latest.cpuUsage.toFixed(2)}%
- Frame Rate: ${latest.frameRate.toFixed(2)}FPS
- Interaction Latency: ${latest.interactionLatency.toFixed(2)}ms
- Render Time: ${latest.renderTime.toFixed(2)}ms

Averages:
- Response Time: ${avgResponseTime.toFixed(2)}ms
- Memory Usage: ${avgMemoryUsage.toFixed(2)}MB
- CPU Usage: ${avgCpuUsage.toFixed(2)}%
    `.trim();
  }
}

// Export the collector and related interfaces
export { PerformanceMetricsCollector, type PerformanceMetrics, type PerformanceBenchmark };