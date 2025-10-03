# Visual Semantics Testing Framework

## Overview

This directory contains the complete visual semantics testing framework for SpaceGraphJS, providing automated testing of
UI/UX behaviors, visual regressions, performance metrics, and ergonomic compliance.

## Directory Structure

```
tests/visual/
├── specs/                          # Visual semantics specifications
│   ├── comprehensive-ui.semantics.ts # Complete UI component specifications
│   └── graph-node.semantics.ts       # Graph node specifications
├── visual-semantics-controller.ts    # Core testing controller
├── simple-screenshot-validator.ts    # Basic screenshot validation
├── screenshot-validation-system.ts   # Advanced screenshot validation
├── automated-screenshot-system.ts    # Automated screenshot capture
├── performance-metrics-collector.ts  # Performance metrics collection
├── visual-regression-reporter.ts     # Visual regression reporting
├── unified-dashboard.ts              # Unified test results dashboard
├── self-generating-test-suite.ts     # Automated test generation
├── ci-cd-integration.ts              # CI/CD pipeline integration
├── run-visual-tests.ts              # Test runner script
├── run-ci-cd-tests.ts               # CI/CD test runner
├── end-to-end-workflow-tests.ts     # Complete workflow tests
├── comprehensive-ui.visual.spec.ts  # Comprehensive UI tests
├── performance-metrics-demo.spec.ts # Performance metrics tests
├── unified-dashboard-demo.spec.ts   # Dashboard demo tests
├── practical-visual-tests.spec.ts   # Practical visual tests
└── screenshots/                     # Screenshot storage
    └── __snapshots__/              # Expected screenshots
```

## Key Components

### 1. Visual Semantics Specifications

Define expected visual behaviors and interactions for UI components:

```typescript
const SphereElementActorSpec: VisualSemanticsSpec = {
  component: 'SphereElementActor',
  states: {
    base: { color: '#ff0000', size: { width: 20, height: 20 } },
    hover: { color: '#ffffff', boxShadow: '0 0 10px #ffffff' }
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [{
        description: 'Sphere should glow when hovered',
        screenshot: 'sphere-hover.png',
        validation: { threshold: 0.1, maxDiffPixels: 5000 }
      }]
    }
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    maxResponseTime: 100
  }
};
```

### 2. Visual Semantics Controller

Programmatic interface for controlling tests:

```typescript
const controller = await VisualSemanticsController.init();
await controller.navigateTo('/element-actors-demo.html');
await controller.assertVisualState(SphereElementActorSpec);
await controller.assertErgonomicCompliance(SphereElementActorSpec);
```

### 3. Automated Test Generation

Automatically generate test cases from specifications:

```typescript
generateVisualSemanticsTests({
  baseUrl: 'http://localhost:5175',
  defaultViewport: { width: 1280, height: 720 }
});
```

### 4. Performance Metrics Collection

Measure and track performance metrics:

```typescript
const collector = new PerformanceMetricsCollector();
const metrics = await collector.collectMetrics(
  'SphereElementActor',
  'Hover Interaction',
  async () => { await controller.hover('canvas'); }
);
```

### 5. Visual Regression Reporting

Detect and report visual changes:

```typescript
const reporter = new VisualRegressionReporter();
await reporter.reportRegression({
  componentName: 'SphereElementActor',
  failureType: 'visual',
  description: 'Unexpected color change'
});
```

### 6. Unified Dashboard

Display all test results in a single interface:

```typescript
const dashboard = new UnifiedDashboard();
dashboard.addVisualTestResults([{ componentName: 'SphereElementActor', status: 'pass' }]);
await dashboard.generateHtmlDashboard();
```

## Running Tests

### All Visual Tests

```bash
npm run test:visual
```

### Specific Test Suites

```bash
# Comprehensive UI tests
npm run test:visual-full

# Performance metrics tests
npm run test:visual-perf

# Dashboard tests
npm run test:visual-dashboard
```

### Individual Test Files

```bash
# Run with Playwright
npx playwright test tests/visual/comprehensive-ui.visual.spec.ts
npx playwright test tests/visual/performance-metrics-demo.spec.ts
npx playwright test tests/visual/unified-dashboard-demo.spec.ts
```

## CI/CD Integration

Run tests in CI/CD environment:

```bash
npm run test:visual-ci
```

## Test Reports

### Generated Reports

- **JUnit XML**: `tests/visual/reports/junit-report.xml`
- **JSON Results**: `tests/visual/reports/test-results.json`
- **HTML Dashboard**: `tests/visual/dashboard/index.html`
- **Screenshots**: `tests/visual/screenshots/`

## Best Practices

### Writing Specifications

1. Define clear visual states for each component
2. Include all relevant interaction sequences
3. Specify ergonomic requirements
4. Use descriptive test case names

### Test Stability

1. Use consistent viewport sizes
2. Account for animation timing
3. Handle dynamic content appropriately
4. Minimize environmental dependencies

### Performance Monitoring

1. Set realistic performance baselines
2. Monitor trends over time
3. Alert on significant regressions
4. Optimize test execution time

## Extending the Framework

### Adding New Components

1. Create a visual semantics specification in `specs/`
2. Add the specification to `ComprehensiveUISemanticsSpecs`
3. The self-generating test suite will automatically include it

### Custom Validators

Extend the `VisualSemanticsController` for custom validation:

```typescript
class CustomController extends VisualSemanticsController {
  async assertCustomProperty(spec: VisualSemanticsSpec) {
    // Custom validation logic
  }
}
```

## Troubleshooting

### Common Issues

1. **Flaky Tests**: Increase thresholds for dynamic content
2. **Environment Differences**: Use consistent test environments
3. **False Positives**: Fine-tune comparison thresholds

### Debugging Tips

1. Review diff images for visual changes
2. Check console output for detailed errors
3. Use Playwright's debug mode for step-by-step execution