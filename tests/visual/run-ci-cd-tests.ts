#!/usr/bin/env node

/**
 * Run CI/CD Tests Script
 * 
 * This script runs all visual semantics tests in CI/CD environment
 * and generates appropriate reports.
 */

import { runCiCdIntegration } from './ci-cd-integration';

async function main() {
  console.log('🚀 Starting Visual Semantics CI/CD Tests');
  console.log('========================================');
  
  try {
    await runCiCdIntegration();
  } catch (error) {
    console.error('❌ CI/CD tests failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}