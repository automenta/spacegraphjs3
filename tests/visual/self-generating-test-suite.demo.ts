import { generateVisualSemanticsTests } from './self-generating-test-suite';

/**
 * Demo: Self-Generating Test Suite Usage
 *
 * This file demonstrates how to use the self-generating test suite
 * to automatically create visual semantics tests based on specifications.
 */

// Generate all visual semantics tests
generateVisualSemanticsTests({
  baseUrl: 'http://localhost:5174',
  defaultViewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
