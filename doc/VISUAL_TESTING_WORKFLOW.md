# Visual Testing Workflow Documentation

## Overview

This document describes the complete visual testing workflow for SpaceGraphJS, including automated test generation,
visual regression detection, performance benchmarking, and unified reporting.

## Workflow Components

### 1. Visual Semantics Specifications

Visual semantics specifications define the expected behavior of UI components:

```typescript
// Example specification
const SphereElementActorSpec: VisualSemanticsSpec = {
  component: 'SphereElementActor',
  elementId: 'sphere-element-actor',
  states: {
    base: {
      color: '#ff0000',
      size: { width: 20, height: 20 }
    },
    hover: {
      color: '#ffffff',
      boxShadow: '0 0 10px #ffffff'
    }
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [
        { type: 'hover', target: 'canvas' }
      ],
      expectedOutcomes: [
        {
          description: 'Sphere element actor should glow when hovered',
          screenshot: 'sphere-element-actor-hover.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000
          }
        }
      ]
    }
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 100
  }
};
```

### 2. Automated Test Generation

The self-generating test suite automatically creates test cases based on specifications:

```typescript
// Generate all visual semantics tests
generateVisualSemanticsTests({
  baseUrl: 'http://localhost:5175',
  defaultViewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
```

### 3. Visual Regression Detection

The visual regression reporter detects and reports visual changes:

```typescript
const reporter = new VisualRegressionReporter();
await reporter.reportRegression({
  componentName: 'SphereElementActor',
  testName: 'Hover Interaction',
  failureType: 'visual',
  description: 'Unexpected color change detected',
  screenshotPath: 'tests/visual/screenshots/sphere-hover-actual.png',
  diffPath: 'tests/visual/screenshots/sphere-hover-diff.png'
});
```

### 4. Performance Benchmarking

The performance metrics collector measures and tracks performance:

```typescript
const collector = new PerformanceMetricsCollector();

const metrics = await collector.collectMetrics(
  'SphereElementActor',
  'Hover Interaction',
  async () => {
    await controller.hover('canvas');
  }
);

// Compare with baseline
const benchmark = collector.compareWithBaseline('SphereElementActor-Hover', metrics);
```

### 5. Unified Dashboard

The unified dashboard displays all test results in a single interface:

```typescript
const dashboard = new UnifiedDashboard();

// Add test results
dashboard.addVisualTestResults([{
  componentName: 'SphereElementActor',
  testName: 'Visual Semantics',
  status: 'pass'
}]);

// Generate HTML dashboard
await dashboard.generateHtmlDashboard();
```

## Running Tests

### Local Development

Run all visual tests:

```bash
npm run test:visual
```

Run specific test suites:

```bash
# Run comprehensive UI tests
npx playwright test tests/visual/comprehensive-ui.visual.spec.ts

# Run performance metrics tests
npx playwright test tests/visual/performance-metrics-demo.spec.ts

# Run unified dashboard demo
npx playwright test tests/visual/unified-dashboard-demo.spec.ts
```

### CI/CD Integration

Run tests in CI/CD environment:

```bash
npm run test:ci
```

Or directly:

```bash
npx ts-node tests/visual/run-ci-cd-tests.ts
```

## Test Reports

### Report Locations

- **JUnit XML Reports**: `tests/visual/reports/junit-report.xml`
- **JSON Reports**: `tests/visual/reports/test-results.json`
- **Visual Diffs**: `tests/visual/screenshots/`
- **HTML Dashboard**: `tests/visual/dashboard/index.html`

### Report Format

JUnit XML report example:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="10" failures="0" errors="0" skipped="0" time="15.2">
  <testsuite name="VisualSemanticsTests" tests="10" failures="0" errors="0" skipped="0" time="15.2" timestamp="2023-01-01T00:00:00Z">
    <testcase name="Sphere Element Actor Visual Semantics" classname="VisualSemanticsTests" time="1.2"/>
    <!-- More test cases -->
  </testsuite>
</testsuites>
```

## Configuration

### Environment Variables

- `VISUAL_TEST_BASE_URL`: Base URL for tests (default: `http://localhost:5175`)
- `VISUAL_TEST_VIEWPORT_WIDTH`: Viewport width (default: `1280`)
- `VISUAL_TEST_VIEWPORT_HEIGHT`: Viewport height (default: `720`)
- `VISUAL_TEST_HEADLESS`: Run in headless mode (default: `true`)

### Configuration Files

Create a `visual-test.config.ts` file in the project root:

```typescript
import { CiCdConfig } from './tests/visual/ci-cd-integration';

const config: CiCdConfig = {
  testPatterns: [
    'tests/visual/**/*.spec.ts'
  ],
  reportDir: 'tests/visual/reports',
  failOnRegression: true,
  githubToken: process.env.GITHUB_TOKEN,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
};

export default config;
```

## Best Practices

### 1. Writing Specifications

- Define clear, measurable visual states
- Include all relevant interaction sequences
- Specify ergonomic requirements
- Use descriptive names for test cases

### 2. Test Stability

- Use consistent viewport sizes
- Account for animation timing
- Handle dynamic content appropriately
- Minimize environmental dependencies

### 3. Performance Monitoring

- Set realistic performance baselines
- Monitor trends over time
- Alert on significant regressions
- Optimize test execution time

### 4. Reporting

- Generate reports after each test run
- Integrate with CI/CD notifications
- Archive historical reports
- Make reports easily accessible

## Troubleshooting

### Common Issues

1. **Flaky Visual Tests**
    - Solution: Increase thresholds for dynamic content
    - Solution: Wait for animations to complete

2. **Environment Differences**
    - Solution: Use consistent test environments
    - Solution: Normalize rendering settings

3. **False Positives**
    - Solution: Fine-tune comparison thresholds
    - Solution: Exclude non-essential UI elements

### Debugging Tips

1. Review diff images to understand visual changes
2. Check console output for detailed error information
3. Use Playwright's debug mode for step-by-step execution
4. Validate test environment matches production closely

## Extending the Framework

### Adding New Components

1. Create a visual semantics specification
2. Add the specification to `ComprehensiveUISemanticsSpecs`
3. The self-generating test suite will automatically include it

### Custom Validators

Extend the `VisualSemanticsController` to add custom validation logic:

```typescript
class CustomVisualSemanticsController extends VisualSemanticsController {
  async assertCustomProperty(spec: VisualSemanticsSpec): Promise<void> {
    // Custom validation logic
  }
}
```

### Custom Reporters

Create custom reporters by extending the `VisualRegressionReporter`:

```typescript
class CustomRegressionReporter extends VisualRegressionReporter {
  async generateCustomReport(report: RegressionReport): Promise<void> {
    // Custom reporting logic
  }
}
```

## Future Enhancements

### AI-Powered Visual Analysis

- Computer vision for advanced visual validation
- Pattern recognition for UI consistency
- Automated anomaly detection

### Cross-Browser Testing

- Validation across different browsers and platforms
- Device-specific rendering verification
- Responsive design testing

### Design System Integration

- Validation against design tokens
- Component library compliance checking
- Brand consistency enforcement