#!/usr/bin/env node

/**
 * Visual Semantics Test Runner
 * 
 * A comprehensive test runner that executes all visual semantics tests
 * and generates detailed reports.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

interface TestSuite {
  name: string;
  path: string;
  description: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'Graph Elements Visual Tests',
    path: 'tests/visual/graph-elements.visual.spec.ts',
    description: 'Tests for visual semantics of graph elements (nodes, edges)'
  },
  {
    name: 'Comprehensive UI Visual Tests',
    path: 'tests/visual/comprehensive-ui.visual.spec.ts',
    description: 'Comprehensive tests for all UI components'
  },
  {
    name: 'Performance Metrics Tests',
    path: 'tests/visual/performance-metrics-demo.spec.ts',
    description: 'Performance benchmarking and monitoring tests'
  },
  {
    name: 'Unified Dashboard Tests',
    path: 'tests/visual/unified-dashboard-demo.spec.ts',
    description: 'Unified dashboard visualization tests'
  },
  {
    name: 'End-to-End Workflow Tests',
    path: 'tests/visual/end-to-end-workflow-tests.ts',
    description: 'Complete end-to-end visual semantics workflow tests'
  },
  {
    name: 'Interaction Semantics Tests',
    path: 'tests/interaction/interaction-semantics.spec.ts',
    description: 'Tests for interaction behavior and semantics'
  },
  {
    name: 'UI/UX Ergonomics Tests',
    path: 'tests/ergonomics/ui-ux-ergonomics.spec.ts',
    description: 'Tests for UI/UX ergonomics compliance'
  },
  {
    name: 'Practical Visual Tests',
    path: 'tests/visual/practical-visual-tests.spec.ts',
    description: 'Practical visual semantics tests with screenshot validation'
  }
];

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  console.log(`\n🧪 Running ${suite.name}`);
  console.log(`📝 ${suite.description}`);
  console.log('─'.repeat(50));
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Run the test suite using Playwright
    const testProcess = spawn('npx', ['playwright', 'test', suite.path], {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
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
      
      const result: TestResult = {
        suite: suite.name,
        passed: code === 0,
        duration,
        stdout,
        stderr,
        exitCode: code || 0
      };
      
      // Print summary
      if (result.passed) {
        console.log(`✅ ${suite.name} PASSED (${duration}ms)`);
      } else {
        console.log(`❌ ${suite.name} FAILED (${duration}ms)`);
        if (stderr) {
          console.log(`Error output:\n${stderr}`);
        }
      }
      
      resolve(result);
    });
  });
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Visual Semantics Test Suite');
  console.log('='.repeat(60));
  
  // Check if dev server is running
  const isDevServerRunning = await checkDevServer();
  if (!isDevServerRunning) {
    console.log('⚠️  Development server is not running. Please start it with "npm run dev"');
    console.log('💡 Tip: Run "npm run dev" in a separate terminal before running tests');
    process.exit(1);
  }
  
  // Run each test suite
  const results: TestResult[] = [];
  
  for (const suite of testSuites) {
    try {
      const result = await runTestSuite(suite);
      results.push(result);
    } catch (error) {
      console.error(`Error running ${suite.name}:`, error);
      results.push({
        suite: suite.name,
        passed: false,
        duration: 0,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1
      });
    }
  }
  
  // Generate summary report
  await generateSummaryReport(results);
  
  // Exit with appropriate code
  const failedTests = results.filter(r => !r.passed).length;
  process.exit(failedTests > 0 ? 1 : 0);
}

async function checkDevServer(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:5175');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function generateSummaryReport(results: TestResult[]): Promise<void> {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 VISUAL SEMANTICS TEST SUMMARY REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Suites: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  
  console.log(`\n📋 Detailed Results:`);
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${result.suite} (${result.duration}ms)`);
  }
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'tests/visual/test-report.md');
  await saveReportToFile(results, reportPath);
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

async function saveReportToFile(results: TestResult[], filePath: string): Promise<void> {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  const reportContent = `# Visual Semantics Test Report

## Summary

- **Total Test Suites:** ${totalTests}
- **Passed:** ${passedTests}
- **Failed:** ${failedTests}
- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%
- **Total Duration:** ${totalDuration}ms
- **Generated:** ${new Date().toISOString()}

## Detailed Results

${results.map(result => `
### ${result.suite}

- **Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${result.duration}ms
- **Exit Code:** ${result.exitCode}

${result.stderr ? `
#### Error Output
\`\`\`
${result.stderr}
\`\`\`
` : ''}

${result.stdout ? `
#### Standard Output
\`\`\`
${result.stdout}
\`\`\`
` : ''}
`).join('\n')}

## Test Suites Executed

${testSuites.map(suite => `- ${suite.name}: ${suite.description}`).join('\n')}
`;
  
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, reportContent);
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Error running visual semantics tests:', error);
    process.exit(1);
  });
}

export { runAllTests, runTestSuite };