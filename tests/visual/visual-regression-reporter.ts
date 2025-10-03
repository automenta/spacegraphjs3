import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Visual Regression Reporter
 *
 * This module detects visual regressions and generates detailed reports
 * to help developers understand and fix visual issues.
 */

interface RegressionReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  regressionDetails: RegressionDetail[];
  summary: string;
}

interface RegressionDetail {
  componentName: string;
  testName: string;
  failureType: 'visual' | 'ergonomic' | 'performance';
  description: string;
  screenshotPath?: string;
  diffPath?: string;
  metrics?: PerformanceMetrics;
}

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

class VisualRegressionReporter {
  private reportDir: string;
  private reports: RegressionReport[] = [];

  constructor(reportDir: string = 'tests/visual/reports') {
    this.reportDir = reportDir;
  }

  /**
   * Initialize the reporter by creating the reports directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.reportDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create reports directory:', error);
    }
  }

  /**
   * Report a visual regression
   */
  async reportRegression(detail: RegressionDetail): Promise<void> {
    // In a real implementation, this would integrate with the testing framework
    // to automatically detect and report regressions

    console.log(
      `Visual Regression Detected: ${detail.componentName} - ${detail.testName}`
    );
    console.log(`Failure Type: ${detail.failureType}`);
    console.log(`Description: ${detail.description}`);

    if (detail.screenshotPath) {
      console.log(`Screenshot: ${detail.screenshotPath}`);
    }

    if (detail.diffPath) {
      console.log(`Diff Image: ${detail.diffPath}`);
    }
  }

  /**
   * Generate a comprehensive regression report
   */
  async generateReport(testResults: TestResult[]): Promise<RegressionReport> {
    const timestamp = new Date().toISOString();
    const totalTests = testResults.length;
    const failedTests = testResults.filter((result) => !result.passed).length;
    const passedTests = totalTests - failedTests;

    const regressionDetails: RegressionDetail[] = [];

    // Process failed tests to create regression details
    for (const result of testResults.filter((r) => !r.passed)) {
      regressionDetails.push({
        componentName: result.componentName,
        testName: result.testName,
        failureType: result.failureType || 'visual',
        description: result.errorMessage || 'Unknown failure',
        screenshotPath: result.screenshotPath,
        diffPath: result.diffPath,
        metrics: result.metrics,
      });
    }

    const summary = this.generateSummary(totalTests, passedTests, failedTests);

    const report: RegressionReport = {
      timestamp,
      totalTests,
      passedTests,
      failedTests,
      regressionDetails,
      summary,
    };

    this.reports.push(report);
    await this.saveReport(report);

    return report;
  }

  /**
   * Generate a summary of the test results
   */
  private generateSummary(
    total: number,
    passed: number,
    failed: number
  ): string {
    const passRate = ((passed / total) * 100).toFixed(2);
    return `Test Results: ${passed}/${total} passed (${passRate}%) - ${failed} regressions detected`;
  }

  /**
   * Save the report to a file
   */
  private async saveReport(report: RegressionReport): Promise<void> {
    try {
      const filename = `regression-report-${report.timestamp.replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(this.reportDir, filename);

      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      console.log(`Regression report saved to: ${filepath}`);
    } catch (error) {
      console.error('Failed to save regression report:', error);
    }
  }

  /**
   * Get all reports
   */
  getReports(): RegressionReport[] {
    return [...this.reports];
  }

  /**
   * Clear all reports
   */
  clearReports(): void {
    this.reports = [];
  }

  /**
   * Generate an HTML report for better visualization
   */
  async generateHtmlReport(report: RegressionReport): Promise<string> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
        .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-passed { color: #28a745; }
        .stat-failed { color: #dc3545; }
        .regressions { margin-top: 30px; }
        .regression { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 15px; }
        .regression-header { font-weight: bold; margin-bottom: 10px; }
        .failure-type { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-size: 12px; }
        .visual { background-color: #007bff; }
        .ergonomic { background-color: #ffc107; color: black; }
        .performance { background-color: #17a2b8; }
        .screenshot { max-width: 300px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Regression Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>${report.summary}</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${report.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="stat">
            <div class="stat-value stat-passed">${report.passedTests}</div>
            <div>Passed</div>
        </div>
        <div class="stat">
            <div class="stat-value stat-failed">${report.failedTests}</div>
            <div>Failed</div>
        </div>
    </div>
    
    <div class="regressions">
        <h2>Regressions Detected (${report.regressionDetails.length})</h2>
        ${report.regressionDetails
          .map(
            (detail) => `
        <div class="regression">
            <div class="regression-header">
                <span>${detail.componentName} - ${detail.testName}</span>
                <span class="failure-type ${detail.failureType}">${detail.failureType}</span>
            </div>
            <div class="description">${detail.description}</div>
            ${detail.screenshotPath ? `<img src="${detail.screenshotPath}" alt="Screenshot" class="screenshot">` : ''}
            ${detail.diffPath ? `<img src="${detail.diffPath}" alt="Diff" class="screenshot">` : ''}
        </div>
        `
          )
          .join('')}
    </div>
</body>
</html>`;

    const filename = `regression-report-${report.timestamp.replace(/[:.]/g, '-')}.html`;
    const filepath = path.join(this.reportDir, filename);

    await fs.writeFile(filepath, html);
    console.log(`HTML regression report saved to: ${filepath}`);

    return filepath;
  }
}

interface TestResult {
  componentName: string;
  testName: string;
  passed: boolean;
  failureType?: 'visual' | 'ergonomic' | 'performance';
  errorMessage?: string;
  screenshotPath?: string;
  diffPath?: string;
  metrics?: PerformanceMetrics;
}

// Export the reporter and related interfaces
export {
  VisualRegressionReporter,
  type RegressionReport,
  type RegressionDetail,
  type TestResult,
  type PerformanceMetrics,
};
