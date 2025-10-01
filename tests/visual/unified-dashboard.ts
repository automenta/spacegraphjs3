import * as fs from 'fs/promises';
import * as path from 'path';
import { RegressionReport } from './visual-regression-reporter';
import { PerformanceMetrics } from './performance-metrics-collector';

/**
 * Unified Dashboard for Visual Semantics Testing
 * 
 * This module creates a unified dashboard that displays all test results,
 * including visual regressions, performance metrics, and ergonomic compliance.
 */

interface DashboardData {
  timestamp: string;
  visualTests: VisualTestSummary[];
  performanceTests: PerformanceTestSummary[];
  ergonomicTests: ErgonomicTestSummary[];
  overallStatus: 'pass' | 'fail' | 'warning';
  summary: DashboardSummary;
}

interface VisualTestSummary {
  componentName: string;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  screenshotPath?: string;
  diffPath?: string;
  errorMessage?: string;
}

interface PerformanceTestSummary {
  componentName: string;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  metrics: PerformanceMetrics;
  regression?: boolean;
  regressionPercentage?: number;
}

interface ErgonomicTestSummary {
  componentName: string;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  requirements: string[];
  failures: string[];
}

interface DashboardSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  passRate: number;
  lastUpdated: string;
}

class UnifiedDashboard {
  private dashboardDir: string;
  private data: DashboardData;

  constructor(dashboardDir: string = 'tests/visual/dashboard') {
    this.dashboardDir = dashboardDir;
    this.data = this.initializeData();
  }

  /**
   * Initialize dashboard data structure
   */
  private initializeData(): DashboardData {
    return {
      timestamp: new Date().toISOString(),
      visualTests: [],
      performanceTests: [],
      ergonomicTests: [],
      overallStatus: 'pass',
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warningTests: 0,
        passRate: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Add visual test results to the dashboard
   */
  addVisualTestResults(results: VisualTestSummary[]): void {
    this.data.visualTests = [...this.data.visualTests, ...results];
    this.updateSummary();
  }

  /**
   * Add performance test results to the dashboard
   */
  addPerformanceTestResults(results: PerformanceTestSummary[]): void {
    this.data.performanceTests = [...this.data.performanceTests, ...results];
    this.updateSummary();
  }

  /**
   * Add ergonomic test results to the dashboard
   */
  addErgonomicTestResults(results: ErgonomicTestSummary[]): void {
    this.data.ergonomicTests = [...this.data.ergonomicTests, ...results];
    this.updateSummary();
  }

  /**
   * Update dashboard summary statistics
   */
  private updateSummary(): void {
    const allTests = [
      ...this.data.visualTests,
      ...this.data.performanceTests,
      ...this.data.ergonomicTests
    ];
    
    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => test.status === 'pass').length;
    const failedTests = allTests.filter(test => test.status === 'fail').length;
    const warningTests = allTests.filter(test => test.status === 'warning').length;
    
    this.data.summary = {
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      lastUpdated: new Date().toISOString()
    };
    
    // Update overall status
    if (failedTests > 0) {
      this.data.overallStatus = 'fail';
    } else if (warningTests > 0) {
      this.data.overallStatus = 'warning';
    } else {
      this.data.overallStatus = 'pass';
    }
    
    this.data.timestamp = new Date().toISOString();
  }

  /**
   * Generate HTML dashboard
   */
  async generateHtmlDashboard(): Promise<string> {
    await this.createDashboardDirectory();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SpaceGraphJS Visual Semantics Testing Dashboard</title>
    <style>
        :root {
            --pass-color: #28a745;
            --fail-color: #dc3545;
            --warning-color: #ffc107;
            --pass-bg: #d4edda;
            --fail-bg: #f8d7da;
            --warning-bg: #fff3cd;
            --header-bg: #f8f9fa;
            --border-color: #dee2e6;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f7fa;
            color: #333;
        }
        
        .header {
            background-color: var(--header-bg);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        
        .status-indicator {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
        }
        
        .status-pass { background-color: var(--pass-color); color: white; }
        .status-fail { background-color: var(--fail-color); color: white; }
        .status-warning { background-color: var(--warning-color); color: black; }
        
        .summary-stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            flex: 1;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .stat-pass { color: var(--pass-color); }
        .stat-fail { color: var(--fail-color); }
        .stat-warning { color: var(--warning-color); }
        
        .test-section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .section-header {
            background-color: var(--header-bg);
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .test-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .test-table th {
            background-color: var(--header-bg);
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        .test-table td {
            padding: 12px 15px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .test-table tr:hover {
            background-color: #f8f9fa;
        }
        
        .status-cell {
            text-align: center;
        }
        
        .screenshot-link {
            color: #007bff;
            text-decoration: none;
        }
        
        .screenshot-link:hover {
            text-decoration: underline;
        }
        
        .regression-badge {
            background-color: var(--warning-color);
            color: black;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .failures-list {
            color: var(--fail-color);
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SpaceGraphJS Visual Semantics Testing Dashboard</h1>
        <div>
            Status: <span class="status-indicator status-${this.data.overallStatus}">${this.data.overallStatus.toUpperCase()}</span>
            <span style="margin-left: 20px;">Last Updated: ${new Date(this.data.timestamp).toLocaleString()}</span>
        </div>
    </div>
    
    <div class="summary-stats">
        <div class="stat-card">
            <div>Total Tests</div>
            <div class="stat-value">${this.data.summary.totalTests}</div>
        </div>
        <div class="stat-card">
            <div>Passed</div>
            <div class="stat-value stat-pass">${this.data.summary.passedTests}</div>
        </div>
        <div class="stat-card">
            <div>Failed</div>
            <div class="stat-value stat-fail">${this.data.summary.failedTests}</div>
        </div>
        <div class="stat-card">
            <div>Warnings</div>
            <div class="stat-value stat-warning">${this.data.summary.warningTests}</div>
        </div>
        <div class="stat-card">
            <div>Pass Rate</div>
            <div class="stat-value">${this.data.summary.passRate.toFixed(1)}%</div>
        </div>
    </div>
    
    <div class="test-section">
        <div class="section-header">
            <span>Visual Tests (${this.data.visualTests.length})</span>
        </div>
        <table class="test-table">
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Test</th>
                    <th>Status</th>
                    <th>Screenshots</th>
                </tr>
            </thead>
            <tbody>
                ${this.data.visualTests.map(test => `
                <tr>
                    <td>${test.componentName}</td>
                    <td>${test.testName}</td>
                    <td class="status-cell">
                        <span class="status-indicator status-${test.status}">${test.status.toUpperCase()}</span>
                        ${test.errorMessage ? `<div style="color: var(--fail-color); font-size: 0.8em; margin-top: 5px;">${test.errorMessage}</div>` : ''}
                    </td>
                    <td>
                        ${test.screenshotPath ? `<a href="${test.screenshotPath}" class="screenshot-link">Actual</a>` : ''}
                        ${test.diffPath ? ` | <a href="${test.diffPath}" class="screenshot-link">Diff</a>` : ''}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="test-section">
        <div class="section-header">
            <span>Performance Tests (${this.data.performanceTests.length})</span>
        </div>
        <table class="test-table">
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Test</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Memory Usage</th>
                    <th>CPU Usage</th>
                </tr>
            </thead>
            <tbody>
                ${this.data.performanceTests.map(test => `
                <tr>
                    <td>${test.componentName}</td>
                    <td>${test.testName}</td>
                    <td class="status-cell">
                        <span class="status-indicator status-${test.status}">${test.status.toUpperCase()}</span>
                        ${test.regression ? `<span class="regression-badge">REGRESSION</span>` : ''}
                    </td>
                    <td>${test.metrics.responseTime.toFixed(2)}ms</td>
                    <td>${test.metrics.memoryUsage.toFixed(2)}MB</td>
                    <td>${test.metrics.cpuUsage.toFixed(2)}%</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="test-section">
        <div class="section-header">
            <span>Ergonomic Tests (${this.data.ergonomicTests.length})</span>
        </div>
        <table class="test-table">
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Test</th>
                    <th>Status</th>
                    <th>Failures</th>
                </tr>
            </thead>
            <tbody>
                ${this.data.ergonomicTests.map(test => `
                <tr>
                    <td>${test.componentName}</td>
                    <td>${test.testName}</td>
                    <td class="status-cell">
                        <span class="status-indicator status-${test.status}">${test.status.toUpperCase()}</span>
                    </td>
                    <td>
                        ${test.failures.length > 0 ? `<div class="failures-list">${test.failures.join(', ')}</div>` : 'All requirements met'}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
    
    const filepath = path.join(this.dashboardDir, 'index.html');
    await fs.writeFile(filepath, html);
    console.log(`Dashboard generated at: ${filepath}`);
    
    return filepath;
  }

  /**
   * Create dashboard directory if it doesn't exist
   */
  private async createDashboardDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dashboardDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create dashboard directory:', error);
    }
  }

  /**
   * Load data from a regression report
   */
  loadFromRegressionReport(report: RegressionReport): void {
    // Convert regression report to visual test summaries
    const visualTests: VisualTestSummary[] = report.regressionDetails.map(detail => ({
      componentName: detail.componentName,
      testName: detail.testName,
      status: 'fail',
      screenshotPath: detail.screenshotPath,
      diffPath: detail.diffPath,
      errorMessage: detail.description
    }));
    
    this.addVisualTestResults(visualTests);
  }

  /**
   * Get current dashboard data
   */
  getData(): DashboardData {
    return { ...this.data };
  }

  /**
   * Reset dashboard data
   */
  reset(): void {
    this.data = this.initializeData();
  }
}

// Export the dashboard class
export { UnifiedDashboard, type DashboardData, type VisualTestSummary, type PerformanceTestSummary, type ErgonomicTestSummary };