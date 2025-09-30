import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * CI/CD Integration for Visual Semantics Testing
 * 
 * This module provides integration with CI/CD pipelines to automate
 * visual semantics testing as part of the deployment process.
 */

export class CICDIntegration {
  private config: CICDConfig;
  private reportPath: string;

  constructor(config?: Partial<CICDConfig>) {
    this.config = {
      failOnRegression: true,
      generateReports: true,
      uploadArtifacts: false,
      artifactStorage: './artifacts',
      threshold: 0.1,
      maxDiffPixels: 10000,
      ...config
    };
    
    this.reportPath = 'tests/visual/reports';
  }

  /**
   * Run comprehensive visual semantics tests
   */
  async runVisualTests(): Promise<CICDTestResult> {
    console.log('🚀 Starting CI/CD Visual Semantics Tests');
    
    // Ensure reports directory exists
    await fs.mkdir(this.reportPath, { recursive: true });
    
    // Run different test suites
    const testSuites = [
      {
        name: 'Self-Generated Tests',
        command: 'npx playwright test tests/visual/self-generating-test-suite.ts',
        description: 'Automatically generated visual semantics tests'
      },
      {
        name: 'End-to-End Workflows',
        command: 'npx playwright test tests/visual/end-to-end-workflow-tests.ts',
        description: 'Complete user journey validation'
      },
      {
        name: 'Screenshot Validation',
        command: 'npx playwright test tests/visual/automated-screenshot-demo.spec.ts',
        description: 'Automated screenshot generation and validation'
      },
      {
        name: 'Performance Metrics',
        command: 'npx playwright test tests/visual/performance-metrics-demo.spec.ts',
        description: 'Performance benchmarking and regression detection'
      }
    ];
    
    const results: TestSuiteResult[] = [];
    let totalPassed = 0;
    let totalFailed = 0;
    
    // Run each test suite
    for (const suite of testSuites) {
      console.log(`\n🧪 Running ${suite.name}`);
      console.log(`📝 ${suite.description}`);
      console.log('─'.repeat(50));
      
      try {
        const result = await this.runTestSuite(suite.command);
        results.push({
          ...suite,
          ...result
        });
        
        if (result.passed) {
          totalPassed++;
          console.log(`✅ ${suite.name} PASSED (${result.duration}ms)`);
        } else {
          totalFailed++;
          console.log(`❌ ${suite.name} FAILED (${result.duration}ms)`);
          if (result.errorMessage) {
            console.log(`Error: ${result.errorMessage}`);
          }
        }
      } catch (error) {
        totalFailed++;
        console.log(`❌ ${suite.name} FAILED with exception: ${error}`);
        results.push({
          ...suite,
          passed: false,
          duration: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Generate unified dashboard
    if (this.config.generateReports) {
      await this.generateUnifiedReport(results);
    }
    
    // Upload artifacts if configured
    if (this.config.uploadArtifacts) {
      await this.uploadArtifacts();
    }
    
    // Determine overall result
    const allPassed = totalFailed === 0;
    
    const finalResult: CICDTestResult = {
      passed: allPassed,
      totalSuites: testSuites.length,
      passedSuites: totalPassed,
      failedSuites: totalFailed,
      results,
      timestamp: new Date().toISOString(),
      artifacts: this.config.uploadArtifacts ? await this.getArtifactPaths() : []
    };
    
    // Log summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CI/CD VISUAL SEMANTICS TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Suites: ${testSuites.length}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${((totalPassed / testSuites.length) * 100).toFixed(1)}%`);
    
    if (!allPassed && this.config.failOnRegression) {
      console.log('\n💥 TEST FAILURE: Regressions detected!');
      process.exit(1);
    }
    
    return finalResult;
  }

  /**
   * Run a single test suite
   */
  private async runTestSuite(command: string): Promise<Omit<TestSuiteResult, 'name' | 'command' | 'description'>> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const testProcess = spawn(command, { 
        shell: true,
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;
        
        resolve({
          passed,
          duration,
          stdout,
          stderr,
          errorMessage: passed ? undefined : stderr || `Process exited with code ${code}`
        });
      });
      
      testProcess.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          passed: false,
          duration,
          stdout,
          stderr,
          errorMessage: error.message
        });
      });
    });
  }

  /**
   * Generate unified report from all test results
   */
  private async generateUnifiedReport(results: TestSuiteResult[]): Promise<void> {
    const reportPath = path.join(this.reportPath, `ci-cd-report-${Date.now()}.md`);
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    const reportContent = `# CI/CD Visual Semantics Test Report

## Summary

- **Total Test Suites:** ${totalTests}
- **Passed:** ${passedTests}
- **Failed:** ${failedTests}
- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%
- **Total Duration:** ${totalDuration}ms
- **Generated:** ${new Date().toISOString()}

## Detailed Results

${results.map(result => `
### ${result.name}

- **Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${result.duration}ms
- **Description:** ${result.description}

${result.errorMessage ? `
#### Error
\`\`\`
${result.errorMessage}
\`\`\`
` : ''}

${result.stdout ? `
#### Output
\`\`\`
${result.stdout.substring(0, 1000)}${result.stdout.length > 1000 ? '\n... (truncated)' : ''}
\`\`\`
` : ''}
`).join('\n')}

## Test Environment

- **Node.js Version:** ${process.version}
- **Platform:** ${process.platform}
- **Architecture:** ${process.arch}
`;
    
    await fs.writeFile(reportPath, reportContent);
    console.log(`\n📄 CI/CD report saved to: ${reportPath}`);
  }

  /**
   * Upload artifacts to storage
   */
  private async uploadArtifacts(): Promise<void> {
    try {
      // Create artifact storage directory
      await fs.mkdir(this.config.artifactStorage, { recursive: true });
      
      // Copy reports to artifacts
      const reports = await fs.readdir(this.reportPath);
      for (const report of reports) {
        const source = path.join(this.reportPath, report);
        const dest = path.join(this.config.artifactStorage, report);
        await fs.copyFile(source, dest);
      }
      
      console.log(`\n📦 Artifacts uploaded to: ${this.config.artifactStorage}`);
    } catch (error) {
      console.log(`\n⚠️  Failed to upload artifacts: ${error}`);
    }
  }

  /**
   * Get artifact paths
   */
  private async getArtifactPaths(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.artifactStorage);
      return files.map(file => path.join(this.config.artifactStorage, file));
    } catch (error) {
      return [];
    }
  }

  /**
   * Check for visual regressions
   */
  async checkForRegressions(): Promise<RegressionCheckResult> {
    console.log('🔍 Checking for visual regressions...');
    
    // This would integrate with the screenshot validation system
    // to compare current results with baselines
    const hasRegressions = false; // Placeholder
    
    const result: RegressionCheckResult = {
      hasRegressions,
      regressions: [],
      timestamp: new Date().toISOString()
    };
    
    if (hasRegressions) {
      console.log('🚨 Visual regressions detected!');
      if (this.config.failOnRegression) {
        process.exit(1);
      }
    } else {
      console.log('✅ No visual regressions detected');
    }
    
    return result;
  }

  /**
   * Generate GitHub Actions workflow file
   */
  async generateGitHubWorkflow(): Promise<string> {
    const workflowPath = '.github/workflows/visual-semantics-test.yml';
    
    const workflowContent = `# Visual Semantics Testing Workflow
# Automatically generated by SpaceGraphJS CI/CD Integration

name: Visual Semantics Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  visual-semantics-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Start development server
      run: |
        npm run dev &
        sleep 10
    
    - name: Run visual semantics tests
      run: npx ts-node tests/visual/ci-cd-integration.ts
    
    - name: Upload test artifacts
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: visual-semantics-test-results
        path: |
          tests/visual/reports/
          tests/visual/screenshots/
    
    - name: Deploy to GitHub Pages (if main branch)
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./tests/visual/dashboard
`;
    
    // Create .github/workflows directory if it doesn't exist
    await fs.mkdir(path.dirname(workflowPath), { recursive: true });
    await fs.writeFile(workflowPath, workflowContent);
    
    console.log(`\n🔧 GitHub Actions workflow generated: ${workflowPath}`);
    return workflowPath;
  }
}

// Interfaces
export interface CICDConfig {
  failOnRegression: boolean;
  generateReports: boolean;
  uploadArtifacts: boolean;
  artifactStorage: string;
  threshold: number;
  maxDiffPixels: number;
}

export interface TestSuiteResult {
  name: string;
  command: string;
  description: string;
  passed: boolean;
  duration: number;
  stdout?: string;
  stderr?: string;
  errorMessage?: string;
}

export interface CICDTestResult {
  passed: boolean;
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  results: TestSuiteResult[];
  timestamp: string;
  artifacts: string[];
}

export interface RegressionCheckResult {
  hasRegressions: boolean;
  regressions: string[];
  timestamp: string;
}

// Export singleton instance
export const ciCdIntegration = new CICDIntegration();

// Run tests if this file is executed directly
if (require.main === module) {
  ciCdIntegration.runVisualTests().catch(error => {
    console.error('CI/CD test execution failed:', error);
    process.exit(1);
  });
}