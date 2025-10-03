import { test } from '@playwright/test';
import { AutomatedScreenshotSystem } from './automated-screenshot-system';

/**
 * Demo test for the Automated Screenshot System
 *
 * This test demonstrates the automated screenshot generation and validation capabilities.
 */

test.describe('Automated Screenshot System Demo', () => {
  test('Generate and validate screenshots for key interactions', async () => {
    // Initialize the screenshot system
    const screenshotSystem = new AutomatedScreenshotSystem();
    await screenshotSystem.initialize();

    // Get common interactions
    const interactions = screenshotSystem.getCommonInteractions();

    // Generate screenshots for element actors demo
    console.log('Generating screenshots for element actors demo...');
    const generatedScreenshots =
      await screenshotSystem.generateInteractionScreenshots(
        interactions.slice(0, 5), // Limit to first 5 for demo
        'http://localhost:5175/element-actors-demo.html'
      );

    console.log(`Generated ${generatedScreenshots.length} screenshots`);

    // Validate screenshots
    console.log('Validating screenshots...');
    const validationResults =
      await screenshotSystem.validateScreenshots(generatedScreenshots);

    // Generate report
    const reportPath = await screenshotSystem.generateReport(validationResults);
    console.log(`Validation report generated: ${reportPath}`);

    // Accept screenshots on first run
    const firstRunResults = validationResults.filter((r) => r.isFirstRun);
    if (firstRunResults.length > 0) {
      console.log('Accepting first run screenshots as expected versions...');
      await screenshotSystem.acceptScreenshots(firstRunResults);
    }

    // Log summary
    const passedCount = validationResults.filter((r) => r.passed).length;
    const failedCount = validationResults.filter(
      (r) => !r.passed && !r.isFirstRun
    ).length;

    console.log(
      `Screenshot validation complete: ${passedCount} passed, ${failedCount} failed`
    );
  });

  test('Generate screenshots for performance demo', async () => {
    // Initialize the screenshot system
    const screenshotSystem = new AutomatedScreenshotSystem();
    await screenshotSystem.initialize();

    // Define specific interactions for performance demo
    const performanceInteractions: any = [
      {
        id: 'perf-initial',
        name: 'Performance Demo Initial State',
        type: 'hover',
        selector: 'canvas',
        position: { x: 640, y: 360 },
        waitTime: 500,
      },
      {
        id: 'perf-zoom',
        name: 'Performance Demo Zoom In',
        type: 'scroll',
        selector: 'canvas',
        deltaY: -150,
        waitTime: 500,
      },
    ];

    // Generate screenshots
    console.log('Generating screenshots for performance demo...');
    const generatedScreenshots =
      await screenshotSystem.generateInteractionScreenshots(
        performanceInteractions,
        'http://localhost:5175/performance-optimizations.html'
      );

    console.log(
      `Generated ${generatedScreenshots.length} performance screenshots`
    );

    // Validate screenshots
    console.log('Validating performance screenshots...');
    const validationResults =
      await screenshotSystem.validateScreenshots(generatedScreenshots);

    // Generate report
    const reportPath = await screenshotSystem.generateReport(validationResults);
    console.log(`Performance validation report generated: ${reportPath}`);
  });
});
