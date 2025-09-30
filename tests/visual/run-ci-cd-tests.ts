#!/usr/bin/env ts-node

/**
 * CLI Script for Running CI/CD Visual Semantics Tests
 * 
 * This script provides a command-line interface for running
 * comprehensive visual semantics tests as part of CI/CD.
 */

import { ciCdIntegration } from './ci-cd-integration';

async function main() {
  console.log('🚀 SpaceGraphJS Visual Semantics CI/CD Testing');
  console.log('==============================================\n');
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    
    // Run tests
    const result = await ciCdIntegration.runVisualTests();
    
    // Check for regressions
    await ciCdIntegration.checkForRegressions();
    
    // Generate GitHub workflow if requested
    if (options.generateWorkflow) {
      await ciCdIntegration.generateGitHubWorkflow();
    }
    
    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error running CI/CD tests:', error);
    process.exit(1);
  }
}

function parseArguments(args: string[]): any {
  const options: any = {
    failOnRegression: true,
    generateReports: true,
    uploadArtifacts: false,
    artifactStorage: './artifacts',
    threshold: 0.1,
    maxDiffPixels: 10000,
    generateWorkflow: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--no-fail-on-regression':
        options.failOnRegression = false;
        break;
      case '--no-reports':
        options.generateReports = false;
        break;
      case '--upload-artifacts':
        options.uploadArtifacts = true;
        break;
      case '--artifact-storage':
        options.artifactStorage = args[++i];
        break;
      case '--threshold':
        options.threshold = parseFloat(args[++i]);
        break;
      case '--max-diff-pixels':
        options.maxDiffPixels = parseInt(args[++i]);
        break;
      case '--generate-workflow':
        options.generateWorkflow = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function printHelp() {
  console.log(`
SpaceGraphJS Visual Semantics CI/CD Testing

Usage: npm run test:visual-ci [options]

Options:
  --no-fail-on-regression    Continue even if regressions are detected
  --no-reports              Skip report generation
  --upload-artifacts        Upload test artifacts
  --artifact-storage <path>  Set artifact storage path (default: ./artifacts)
  --threshold <number>      Set comparison threshold (default: 0.1)
  --max-diff-pixels <num>   Set maximum diff pixels (default: 10000)
  --generate-workflow       Generate GitHub Actions workflow file
  --help                   Show this help message

Examples:
  npm run test:visual-ci
  npm run test:visual-ci -- --no-fail-on-regression
  npm run test:visual-ci -- --upload-artifacts --artifact-storage ./test-artifacts
  npm run test:visual-ci -- --generate-workflow
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main };