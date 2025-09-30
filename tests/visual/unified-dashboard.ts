import fs from 'fs/promises';
import path from 'path';
import { PerformanceReport } from './performance-metrics-collector';
import { ScreenshotValidationResult } from './automated-screenshot-system';

/**
 * Unified Dashboard for Visual Test Results
 * 
 * This system creates a comprehensive dashboard that combines
 * performance metrics, screenshot validation results, and
 * ergonomic compliance data into a single unified view.
 */

export class UnifiedDashboard {
  private reportPath: string;
  private dashboardPath: string;

  constructor(basePath: string = 'tests/visual') {
    this.reportPath = path.join(basePath, 'reports');
    this.dashboardPath = path.join(basePath, 'dashboard');
  }

  /**
   * Initialize the unified dashboard system
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.reportPath, { recursive: true });
    await fs.mkdir(this.dashboardPath, { recursive: true });
  }

  /**
   * Generate unified dashboard combining all test results
   * @param performanceReport Performance metrics report
   * @param screenshotResults Screenshot validation results
   * @param ergonomicResults Ergonomic compliance results
   * @param outputPath Optional output path
   */
  async generateUnifiedDashboard(
    performanceReport: PerformanceReport | null,
    screenshotResults: ScreenshotValidationResult[] | null,
    ergonomicResults: any[] | null,
    outputPath?: string
  ): Promise<string> {
    const dashboardPath = outputPath || path.join(
      this.dashboardPath, 
      `unified-dashboard-${Date.now()}.html`
    );
    
    const htmlContent = this.createDashboardHTML(
      performanceReport, 
      screenshotResults, 
      ergonomicResults
    );
    
    await fs.writeFile(dashboardPath, htmlContent);
    return dashboardPath;
  }

  /**
   * Create HTML content for the unified dashboard
   * @param performanceReport Performance metrics report
   * @param screenshotResults Screenshot validation results
   * @param ergonomicResults Ergonomic compliance results
   */
  private createDashboardHTML(
    performanceReport: PerformanceReport | null,
    screenshotResults: ScreenshotValidationResult[] | null,
    ergonomicResults: any[] | null
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SpaceGraphJS Unified Test Dashboard</title>
    <style>
        :root {
            --primary: #333;
            --secondary: #f5f5f5;
            --success: #4CAF50;
            --warning: #FF9800;
            --danger: #f44336;
            --info: #2196F3;
        }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0;
            background-color: #fafafa;
            color: #333;
        }
        
        .header { 
            background: linear-gradient(135deg, var(--primary), #555);
            color: white; 
            padding: 20px; 
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
        }
        
        .tabs {
            display: flex;
            background-color: #eee;
            border-bottom: 1px solid #ddd;
        }
        
        .tab {
            padding: 15px 25px;
            cursor: pointer;
            background-color: #eee;
            border: none;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            background-color: white;
            border-bottom: 3px solid var(--info);
            margin-bottom: -1px;
        }
        
        .tab:hover:not(.active) {
            background-color: #ddd;
        }
        
        .content {
            padding: 20px;
            display: none;
        }
        
        .content.active {
            display: block;
        }
        
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            margin-top: 0;
            color: var(--primary);
        }
        
        .card .value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .card.performance .value { color: var(--info); }
        .card.screenshots .value { color: var(--success); }
        .card.ergonomics .value { color: var(--warning); }
        
        .section-title {
            color: var(--primary);
            border-bottom: 2px solid var(--info);
            padding-bottom: 10px;
            margin: 30px 0 20px;
        }
        
        .results-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .results-table th {
            background-color: var(--primary);
            color: white;
            text-align: left;
            padding: 15px;
            font-weight: 500;
        }
        
        .results-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .results-table tr:hover {
            background-color: #f9f9f9;
        }
        
        .status-badge {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
        }
        
        .status-passed { 
            background-color: rgba(76, 175, 80, 0.1);
            color: var(--success);
            border: 1px solid var(--success);
        }
        
        .status-failed { 
            background-color: rgba(244, 67, 54, 0.1);
            color: var(--danger);
            border: 1px solid var(--danger);
        }
        
        .status-warning { 
            background-color: rgba(255, 152, 0, 0.1);
            color: var(--warning);
            border: 1px solid var(--warning);
        }
        
        .status-regression { 
            background-color: rgba(244, 67, 54, 0.1);
            color: var(--danger);
            border: 1px solid var(--danger);
        }
        
        .status-improvement { 
            background-color: rgba(76, 175, 80, 0.1);
            color: var(--success);
            border: 1px solid var(--success);
        }
        
        .chart-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            margin: 20px 0;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #777;
            font-style: italic;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #777;
            border-top: 1px solid #eee;
            margin-top: 30px;
        }
        
        @media (max-width: 768px) {
            .summary-cards {
                grid-template-columns: 1fr;
            }
            
            .tabs {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SpaceGraphJS Unified Test Dashboard</h1>
        <p>Comprehensive UI/UX Testing Results</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="tabs">
        <button class="tab active" onclick="showTab('overview')">Overview</button>
        <button class="tab" onclick="showTab('performance')">Performance</button>
        <button class="tab" onclick="showTab('screenshots')">Screenshots</button>
        <button class="tab" onclick="showTab('ergonomics')">Ergonomics</button>
    </div>
    
    <div id="overview" class="content active">
        ${this.createOverviewContent(performanceReport, screenshotResults, ergonomicResults)}
    </div>
    
    <div id="performance" class="content">
        ${this.createPerformanceContent(performanceReport)}
    </div>
    
    <div id="screenshots" class="content">
        ${this.createScreenshotContent(screenshotResults)}
    </div>
    
    <div id="ergonomics" class="content">
        ${this.createErgonomicContent(ergonomicResults)}
    </div>
    
    <div class="footer">
        <p>SpaceGraphJS Visual Semantics Testing Framework</p>
    </div>
    
    <script>
        function showTab(tabName) {
            // Hide all content
            const contents = document.querySelectorAll('.content');
            contents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from tabs
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.currentTarget.classList.add('active');
        }
    </script>
</body>
</html>
    `.trim();
  }

  /**
   * Create overview content
   */
  private createOverviewContent(
    performanceReport: PerformanceReport | null,
    screenshotResults: ScreenshotValidationResult[] | null,
    ergonomicResults: any[] | null
  ): string {
    const totalTests = (screenshotResults?.length || 0) + (ergonomicResults?.length || 0);
    const passedTests = (screenshotResults?.filter(r => r.passed).length || 0) + 
                       (ergonomicResults?.filter(r => r.passed).length || 0);
    const avgPerformance = performanceReport?.summary.averageResponseTime || 0;
    
    return `
        <div class="summary-cards">
            <div class="card performance">
                <h3>Performance</h3>
                <div class="value">${avgPerformance.toFixed(0)}<span style="font-size: 0.5em;">ms</span></div>
                <p>Average Response Time</p>
            </div>
            
            <div class="card screenshots">
                <h3>Visual Tests</h3>
                <div class="value">${passedTests}<span style="font-size: 0.5em;">/${totalTests}</span></div>
                <p>Tests Passed</p>
            </div>
            
            <div class="card ergonomics">
                <h3>Components</h3>
                <div class="value">${performanceReport?.summary.totalComponents || 0}</div>
                <p>UI Components Tested</p>
            </div>
        </div>
        
        <h2 class="section-title">Recent Test Results</h2>
        
        <div class="chart-container">
            <h3>Test Status Distribution</h3>
            ${screenshotResults || ergonomicResults ? `
            <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
                <div style="width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(
                    ${passedTests > 0 ? `var(--success) 0 ${(passedTests/totalTests)*100}%` : ''},
                    ${totalTests > passedTests ? `var(--danger) ${(passedTests/totalTests)*100}% 100%` : ''}
                ); display: flex; justify-content: center; align-items: center;">
                    <div style="width: 150px; height: 150px; border-radius: 50%; background: white; display: flex; justify-content: center; align-items: center; font-weight: bold;">
                        ${totalTests > 0 ? Math.round((passedTests/totalTests)*100) : 0}%
                    </div>
                </div>
            </div>
            ` : '<div class="no-data">No test data available</div>'}
        </div>
    `;
  }

  /**
   * Create performance content
   */
  private createPerformanceContent(performanceReport: PerformanceReport | null): string {
    if (!performanceReport) {
      return '<div class="no-data">No performance data available</div>';
    }
    
    return `
        <div class="summary-cards">
            <div class="card">
                <h3>Total Metrics</h3>
                <div class="value">${performanceReport.totalMetrics}</div>
                <p>Measurements Collected</p>
            </div>
            
            <div class="card">
                <h3>Avg Response</h3>
                <div class="value">${performanceReport.summary.averageResponseTime.toFixed(0)}<span style="font-size: 0.5em;">ms</span></div>
                <p>Overall Average</p>
            </div>
            
            <div class="card">
                <h3>Components</h3>
                <div class="value">${performanceReport.summary.totalComponents}</div>
                <p>Tested Components</p>
            </div>
        </div>
        
        <h2 class="section-title">Performance Analysis</h2>
        
        <table class="results-table">
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
                ${performanceReport.analysis.map(item => {
                  const statusClass = item.comparison?.regression ? 'status-regression' : 
                                    item.comparison?.improvement ? 'status-improvement' : 'status-passed';
                  const statusText = item.comparison?.regression ? 'REGRESSION' : 
                                   item.comparison?.improvement ? 'IMPROVEMENT' : 'STABLE';
                  
                  return `
                <tr>
                    <td>${item.component}</td>
                    <td>${item.interactionType}</td>
                    <td>${item.sampleSize}</td>
                    <td>${item.statistics.average.toFixed(2)}</td>
                    <td>${item.statistics.min.toFixed(0)}/${item.statistics.max.toFixed(0)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
  }

  /**
   * Create screenshot content
   */
  private createScreenshotContent(screenshotResults: ScreenshotValidationResult[] | null): string {
    if (!screenshotResults || screenshotResults.length === 0) {
      return '<div class="no-data">No screenshot validation data available</div>';
    }
    
    const passedCount = screenshotResults.filter(r => r.passed).length;
    const failedCount = screenshotResults.filter(r => !r.passed && !r.isFirstRun).length;
    const firstRunCount = screenshotResults.filter(r => r.isFirstRun).length;
    
    return `
        <div class="summary-cards">
            <div class="card">
                <h3>Total Tests</h3>
                <div class="value">${screenshotResults.length}</div>
                <p>Screenshot Tests</p>
            </div>
            
            <div class="card">
                <h3>Passed</h3>
                <div class="value">${passedCount}</div>
                <p>Tests Passed</p>
            </div>
            
            <div class="card">
                <h3>Failed</h3>
                <div class="value">${failedCount}</div>
                <p>Tests Failed</p>
            </div>
        </div>
        
        <h2 class="section-title">Screenshot Validation Results</h2>
        
        <table class="results-table">
            <thead>
                <tr>
                    <th>Interaction</th>
                    <th>Status</th>
                    <th>Diff Pixels</th>
                    <th>Diff %</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                ${screenshotResults.map(result => {
                  const statusClass = result.isFirstRun ? 'status-warning' : 
                                    result.passed ? 'status-passed' : 'status-failed';
                  const statusText = result.isFirstRun ? 'FIRST RUN' : 
                                   result.passed ? 'PASSED' : 'FAILED';
                  
                  return `
                <tr>
                    <td>${result.interactionName}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${result.diffPixels !== undefined ? result.diffPixels : 'N/A'}</td>
                    <td>${result.diffPercentage !== undefined ? result.diffPercentage.toFixed(2) + '%' : 'N/A'}</td>
                    <td>${new Date(result.timestamp).toLocaleTimeString()}</td>
                </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
  }

  /**
   * Create ergonomic content
   */
  private createErgonomicContent(ergonomicResults: any[] | null): string {
    if (!ergonomicResults || ergonomicResults.length === 0) {
      return '<div class="no-data">No ergonomic compliance data available</div>';
    }
    
    const passedCount = ergonomicResults.filter(r => r.passed).length;
    const violationCount = ergonomicResults.reduce((sum, r) => sum + (r.violations?.length || 0), 0);
    
    return `
        <div class="summary-cards">
            <div class="card">
                <h3>Components</h3>
                <div class="value">${ergonomicResults.length}</div>
                <p>Tested Components</p>
            </div>
            
            <div class="card">
                <h3>Compliant</h3>
                <div class="value">${passedCount}</div>
                <p>Components Passed</p>
            </div>
            
            <div class="card">
                <h3>Violations</h3>
                <div class="value">${violationCount}</div>
                <p>Total Violations</p>
            </div>
        </div>
        
        <h2 class="section-title">Ergonomic Compliance Results</h2>
        
        <table class="results-table">
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Status</th>
                    <th>Violations</th>
                    <th>Metrics</th>
                </tr>
            </thead>
            <tbody>
                ${ergonomicResults.map(result => {
                  const statusClass = result.passed ? 'status-passed' : 'status-failed';
                  const statusText = result.passed ? 'COMPLIANT' : 'VIOLATIONS';
                  
                  return `
                <tr>
                    <td>${result.component}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${result.violations?.length || 0}</td>
                    <td>
                        ${result.metrics ? Object.entries(result.metrics).map(([key, value]) => 
                          `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`
                        ).join(', ') : 'N/A'}
                    </td>
                </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
  }
}

// Export singleton instance
export const unifiedDashboard = new UnifiedDashboard();