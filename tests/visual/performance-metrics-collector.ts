import fs from 'fs/promises';
import path from 'path';

/**
 * Performance Metrics Collector for Visual Semantics Tests
 * 
 * This system collects, analyzes, and reports performance metrics
 * for all UI interactions in SpaceGraphJS visual semantics tests.
 */

export class PerformanceMetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private baselineMetrics: Map<string, PerformanceBaseline> = new Map();
  private reportPath: string;

  constructor(reportPath: string = 'tests/visual/reports') {
    this.reportPath = reportPath;
  }

  /**
   * Initialize the performance metrics collector
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.reportPath, { recursive: true });
    await this.loadBaselines();
  }

  /**
   * Record a performance metric
   * @param metric Performance metric to record
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record multiple performance metrics
   * @param metrics Array of performance metrics
   */
  recordMetrics(metrics: Omit<PerformanceMetric, 'timestamp'>[]): void {
    for (const metric of metrics) {
      this.recordMetric(metric);
    }
  }

  /**
   * Get all recorded metrics
   * @returns Array of performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific interaction type
   * @param interactionType Type of interaction
   * @returns Filtered metrics
   */
  getMetricsByType(interactionType: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.interactionType === interactionType);
  }

  /**
   * Get metrics for a specific component
   * @param component Component name
   * @returns Filtered metrics
   */
  getMetricsByComponent(component: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.component === component);
  }

  /**
   * Calculate performance statistics
   * @param metrics Metrics to analyze
   * @returns Performance statistics
   */
  calculateStatistics(metrics: PerformanceMetric[]): PerformanceStatistics {
    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0
      };
    }

    const durations = metrics.map(m => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);
    
    const count = durations.length;
    const average = durations.reduce((sum, d) => sum + d, 0) / count;
    const median = sorted[Math.floor(count / 2)];
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - average, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    return {
      count,
      average,
      median,
      min,
      max,
      stdDev
    };
  }

  /**
   * Compare current performance with baseline
   * @param component Component to compare
   * @param interactionType Interaction type to compare
   * @returns Performance comparison
   */
  compareWithBaseline(component: string, interactionType: string): PerformanceComparison | null {
    const baseline = this.baselineMetrics.get(`${component}:${interactionType}`);
    if (!baseline) {
      return null;
    }

    const currentMetrics = this.metrics.filter(
      m => m.component === component && m.interactionType === interactionType
    );
    
    if (currentMetrics.length === 0) {
      return null;
    }

    const currentStats = this.calculateStatistics(currentMetrics);
    
    return {
      component,
      interactionType,
      baseline: baseline.statistics,
      current: currentStats,
      regression: currentStats.average > baseline.statistics.average * 1.1, // 10% threshold
      improvement: currentStats.average < baseline.statistics.average * 0.9, // 10% threshold
      difference: currentStats.average - baseline.statistics.average
    };
  }

  /**
   * Set baseline performance metrics
   * @param component Component name
   * @param interactionType Interaction type
   * @param statistics Performance statistics
   */
  async setBaseline(
    component: string, 
    interactionType: string, 
    statistics: PerformanceStatistics
  ): Promise<void> {
    const baseline: PerformanceBaseline = {
      component,
      interactionType,
      statistics,
      timestamp: new Date().toISOString()
    };
    
    this.baselineMetrics.set(`${component}:${interactionType}`, baseline);
    await this.saveBaselines();
  }

  /**
   * Load baseline metrics from file
   */
  private async loadBaselines(): Promise<void> {
    try {
      const baselinePath = path.join(this.reportPath, 'performance-baselines.json');
      const data = await fs.readFile(baselinePath, 'utf-8');
      const baselines: PerformanceBaseline[] = JSON.parse(data);
      
      for (const baseline of baselines) {
        this.baselineMetrics.set(`${baseline.component}:${baseline.interactionType}`, baseline);
      }
    } catch (error) {
      // Baseline file doesn't exist yet, which is fine
      console.log('No existing performance baselines found');
    }
  }

  /**
   * Save baseline metrics to file
   */
  private async saveBaselines(): Promise<void> {
    const baselines = Array.from(this.baselineMetrics.values());
    const baselinePath = path.join(this.reportPath, 'performance-baselines.json');
    await fs.writeFile(baselinePath, JSON.stringify(baselines, null, 2));
  }

  /**
   * Generate performance report
   * @param outputPath Optional output path
   * @returns Path to generated report
   */
  async generateReport(outputPath?: string): Promise<string> {
    const reportPath = outputPath || path.join(
      this.reportPath, 
      `performance-report-${Date.now()}.json`
    );
    
    // Group metrics by component and interaction type
    const groupedMetrics = new Map<string, PerformanceMetric[]>();
    
    for (const metric of this.metrics) {
      const key = `${metric.component}:${metric.interactionType}`;
      if (!groupedMetrics.has(key)) {
        groupedMetrics.set(key, []);
      }
      groupedMetrics.get(key)!.push(metric);
    }
    
    // Calculate statistics for each group
    const analysis: PerformanceAnalysis[] = [];
    
    for (const [key, metrics] of groupedMetrics.entries()) {
      const [component, interactionType] = key.split(':');
      const statistics = this.calculateStatistics(metrics);
      const comparison = this.compareWithBaseline(component, interactionType);
      
      analysis.push({
        component,
        interactionType,
        statistics,
        comparison,
        sampleSize: metrics.length
      });
    }
    
    // Create report
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      analysis,
      summary: {
        totalComponents: new Set(this.metrics.map(m => m.component)).size,
        totalInteractions: new Set(this.metrics.map(m => m.interactionType)).size,
        averageResponseTime: analysis.reduce((sum, a) => sum + a.statistics.average, 0) / analysis.length,
        slowestInteraction: analysis.reduce((slowest, current) => 
          current.statistics.average > slowest.statistics.average ? current : slowest
        ),
        fastestInteraction: analysis.reduce((fastest, current) => 
          current.statistics.average < fastest.statistics.average ? current : fastest
        )
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }

  /**
   * Generate HTML performance dashboard
   * @param outputPath Optional output path
   * @returns Path to generated dashboard
   */
  async generateDashboard(outputPath?: string): Promise<string> {
    const reportPath = outputPath || path.join(
      this.reportPath, 
      `performance-dashboard-${Date.now()}.html`
    );
    
    const analysis = this.analyzeAllMetrics();
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>SpaceGraphJS Performance Dashboard</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background-color: #f5f5f5;
        }
        .header { 
            background-color: #333; 
            color: white; 
            padding: 20px; 
            border-radius: 5px; 
            margin-bottom: 20px;
            text-align: center;
        }
        .summary { 
            display: flex; 
            justify-content: space-around; 
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .summary-item { 
            background-color: white; 
            padding: 15px; 
            border-radius: 5px; 
            text-align: center; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 10px;
            min-width: 150px;
        }
        .analysis-table { 
            background-color: white; 
            border-radius: 5px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-bottom: 20px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        th { 
            background-color: #f2f2f2; 
        }
        tr:hover { 
            background-color: #f5f5f5; 
        }
        .regression { 
            color: #f44336; 
            font-weight: bold; 
        }
        .improvement { 
            color: #4CAF50; 
            font-weight: bold; 
        }
        .normal { 
            color: #2196F3; 
        }
        .chart-container { 
            background-color: white; 
            padding: 20px; 
            border-radius: 5px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SpaceGraphJS Performance Dashboard</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
        <div class="summary-item">
            <h2>${analysis.totalMetrics}</h2>
            <p>Total Measurements</p>
        </div>
        <div class="summary-item">
            <h2>${analysis.summary.totalComponents}</h2>
            <p>Components</p>
        </div>
        <div class="summary-item">
            <h2>${analysis.summary.totalInteractions}</h2>
            <p>Interaction Types</p>
        </div>
        <div class="summary-item">
            <h2>${analysis.summary.averageResponseTime.toFixed(2)}ms</h2>
            <p>Avg Response Time</p>
        </div>
    </div>
    
    <div class="analysis-table">
        <table>
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Interaction</th>
                    <th>Sample Size</th>
                    <th>Avg Time (ms)</th>
                    <th>Min/Max (ms)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${analysis.analysis.map(item => {
                  const statusClass = item.comparison?.regression ? 'regression' : 
                                    item.comparison?.improvement ? 'improvement' : 'normal';
                  const statusText = item.comparison?.regression ? 'REGRESSION' : 
                                   item.comparison?.improvement ? 'IMPROVEMENT' : 'STABLE';
                  
                  return `
                <tr>
                    <td>${item.component}</td>
                    <td>${item.interactionType}</td>
                    <td>${item.sampleSize}</td>
                    <td>${item.statistics.average.toFixed(2)}</td>
                    <td>${item.statistics.min.toFixed(0)}/${item.statistics.max.toFixed(0)}</td>
                    <td class="${statusClass}">${statusText}</td>
                </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
    `.trim();
    
    await fs.writeFile(reportPath, htmlContent);
    return reportPath;
  }

  /**
   * Analyze all collected metrics
   * @returns Complete performance analysis
   */
  private analyzeAllMetrics(): PerformanceReport {
    // Group metrics by component and interaction type
    const groupedMetrics = new Map<string, PerformanceMetric[]>();
    
    for (const metric of this.metrics) {
      const key = `${metric.component}:${metric.interactionType}`;
      if (!groupedMetrics.has(key)) {
        groupedMetrics.set(key, []);
      }
      groupedMetrics.get(key)!.push(metric);
    }
    
    // Calculate statistics for each group
    const analysis: PerformanceAnalysis[] = [];
    
    for (const [key, metrics] of groupedMetrics.entries()) {
      const [component, interactionType] = key.split(':');
      const statistics = this.calculateStatistics(metrics);
      const comparison = this.compareWithBaseline(component, interactionType);
      
      analysis.push({
        component,
        interactionType,
        statistics,
        comparison,
        sampleSize: metrics.length
      });
    }
    
    // Create summary
    const summary: PerformanceSummary = {
      totalComponents: new Set(this.metrics.map(m => m.component)).size,
      totalInteractions: new Set(this.metrics.map(m => m.interactionType)).size,
      averageResponseTime: analysis.reduce((sum, a) => sum + a.statistics.average, 0) / analysis.length,
      slowestInteraction: analysis.reduce((slowest, current) => 
        current.statistics.average > slowest.statistics.average ? current : slowest
      ),
      fastestInteraction: analysis.reduce((fastest, current) => 
        current.statistics.average < fastest.statistics.average ? current : fastest
      )
    };
    
    return {
      timestamp: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      analysis,
      summary
    };
  }

  /**
   * Clear all collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Interfaces
export interface PerformanceMetric {
  component: string;
  interactionType: string;
  duration: number;
  timestamp: string;
  context?: Record<string, any>;
}

export interface PerformanceStatistics {
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface PerformanceBaseline {
  component: string;
  interactionType: string;
  statistics: PerformanceStatistics;
  timestamp: string;
}

export interface PerformanceComparison {
  component: string;
  interactionType: string;
  baseline: PerformanceStatistics;
  current: PerformanceStatistics;
  regression: boolean;
  improvement: boolean;
  difference: number;
}

export interface PerformanceAnalysis {
  component: string;
  interactionType: string;
  statistics: PerformanceStatistics;
  comparison: PerformanceComparison | null;
  sampleSize: number;
}

export interface PerformanceSummary {
  totalComponents: number;
  totalInteractions: number;
  averageResponseTime: number;
  slowestInteraction: PerformanceAnalysis;
  fastestInteraction: PerformanceAnalysis;
}

export interface PerformanceReport {
  timestamp: string;
  totalMetrics: number;
  analysis: PerformanceAnalysis[];
  summary: PerformanceSummary;
}

// Export singleton instance
export const performanceMetricsCollector = new PerformanceMetricsCollector();