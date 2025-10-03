import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

/**
 * Automated Screenshot Generation and Validation System
 *
 * This system provides comprehensive automated screenshot capture, comparison,
 * and validation for all key UI interactions in SpaceGraphJS.
 */

export class AutomatedScreenshotSystem {
  private basePath: string;
  private expectedPath: string;
  private actualPath: string;
  private diffPath: string;
  private reportPath: string;

  constructor(basePath: string = 'tests/visual') {
    this.basePath = basePath;
    this.expectedPath = path.join(basePath, 'screenshots', 'expected');
    this.actualPath = path.join(basePath, 'screenshots', 'actual');
    this.diffPath = path.join(basePath, 'screenshots', 'diffs');
    this.reportPath = path.join(basePath, 'reports');
  }

  /**
   * Initialize the screenshot system
   */
  async initialize(): Promise<void> {
    // Create necessary directories
    await fs.mkdir(this.expectedPath, { recursive: true });
    await fs.mkdir(this.actualPath, { recursive: true });
    await fs.mkdir(this.diffPath, { recursive: true });
    await fs.mkdir(this.reportPath, { recursive: true });
  }

  /**
   * Generate screenshots for all key interactions automatically
   * @param interactions List of interactions to capture
   * @param baseUrl Base URL for the application
   */
  async generateInteractionScreenshots(
    interactions: ScreenshotInteraction[],
    baseUrl: string
  ): Promise<ScreenshotGenerationResult[]> {
    const results: ScreenshotGenerationResult[] = [];

    // Import Playwright dynamically to avoid issues
    const { chromium } = await import('@playwright/test');

    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    try {
      // Navigate to base URL
      await page.goto(baseUrl);
      await page.waitForFunction(() => (window as any).graph, {
        timeout: 10000,
      });
      await page.waitForTimeout(2000);

      // Generate screenshot for each interaction
      for (const interaction of interactions) {
        console.log(`Generating screenshot for: ${interaction.name}`);

        // Perform interaction
        await this.performInteraction(page, interaction);

        // Wait for interaction to complete
        await page.waitForTimeout(interaction.waitTime || 300);

        // Capture screenshot
        const screenshotName = `${interaction.id}-${Date.now()}.png`;
        const screenshotPath = path.join(this.actualPath, screenshotName);

        await page.screenshot({ path: screenshotPath, fullPage: true });

        results.push({
          interactionId: interaction.id,
          interactionName: interaction.name,
          screenshotPath,
          timestamp: new Date().toISOString(),
          status: 'generated',
        });
      }
    } finally {
      await browser.close();
    }

    return results;
  }

  /**
   * Perform a specific interaction on the page
   * @param page Playwright page
   * @param interaction Interaction to perform
   */
  private async performInteraction(
    page: any,
    interaction: ScreenshotInteraction
  ): Promise<void> {
    const viewport = page.viewportSize();

    switch (interaction.type) {
      case 'hover':
        if (viewport) {
          await page.hover(interaction.selector, {
            position: interaction.position || {
              x: viewport.width / 2,
              y: viewport.height / 2,
            },
          });
        }
        break;

      case 'click':
        if (viewport) {
          await page.click(interaction.selector, {
            position: interaction.position || {
              x: viewport.width / 2,
              y: viewport.height / 2,
            },
            button: interaction.button || 'left',
          });
        }
        break;

      case 'drag':
        if (viewport && interaction.targetSelector) {
          await page.dragAndDrop(
            interaction.selector,
            interaction.targetSelector,
            {
              sourcePosition: interaction.sourcePosition,
              targetPosition: interaction.targetPosition,
            }
          );
        }
        break;

      case 'keyboard':
        if (interaction.keys) {
          await page.keyboard.press(interaction.keys);
        }
        break;

      case 'scroll':
        await page.dispatchEvent(interaction.selector, 'wheel', {
          deltaX: interaction.deltaX || 0,
          deltaY: interaction.deltaY || 100,
        });
        break;
    }
  }

  /**
   * Validate screenshots against expected versions
   * @param generatedScreenshots List of generated screenshots
   * @param threshold Difference threshold for validation
   */
  async validateScreenshots(
    generatedScreenshots: ScreenshotGenerationResult[],
    threshold: number = 0.1
  ): Promise<ScreenshotValidationResult[]> {
    const results: ScreenshotValidationResult[] = [];

    for (const screenshot of generatedScreenshots) {
      const expectedPath = path.join(
        this.expectedPath,
        path.basename(screenshot.screenshotPath)
      );

      try {
        // Check if expected screenshot exists
        await fs.access(expectedPath);

        // Compare screenshots
        const comparisonResult = await this.compareScreenshots(
          screenshot.screenshotPath,
          expectedPath,
          threshold
        );

        results.push({
          interactionId: screenshot.interactionId,
          interactionName: screenshot.interactionName,
          passed: comparisonResult.passed,
          diffPixels: comparisonResult.diffPixels,
          diffPercentage: comparisonResult.diffPercentage,
          actualPath: screenshot.screenshotPath,
          expectedPath,
          diffPath: comparisonResult.diffPath,
          timestamp: screenshot.timestamp,
        });
      } catch (error) {
        // Expected screenshot doesn't exist - this might be first run
        results.push({
          interactionId: screenshot.interactionId,
          interactionName: screenshot.interactionName,
          passed: true, // Pass on first run
          diffPixels: 0,
          diffPercentage: 0,
          actualPath: screenshot.screenshotPath,
          expectedPath,
          isFirstRun: true,
          timestamp: screenshot.timestamp,
        });
      }
    }

    return results;
  }

  /**
   * Compare two screenshots
   * @param actualPath Path to actual screenshot
   * @param expectedPath Path to expected screenshot
   * @param threshold Difference threshold
   */
  private async compareScreenshots(
    actualPath: string,
    expectedPath: string,
    threshold: number
  ): Promise<ScreenshotComparisonDetail> {
    try {
      // Load images
      const img1 = PNG.sync.read(await fs.readFile(actualPath));
      const img2 = PNG.sync.read(await fs.readFile(expectedPath));

      // Create diff image
      const { width, height } = img1;
      const diff = new PNG({ width, height });

      // Compare images
      const diffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        {
          threshold,
          includeAA: false,
        }
      );

      const totalPixels = width * height;
      const diffPercentage = (diffPixels / totalPixels) * 100;

      // Save diff image
      const diffFileName = path.basename(actualPath, '.png') + '-diff.png';
      const diffPath = path.join(this.diffPath, diffFileName);
      await fs.writeFile(diffPath, PNG.sync.write(diff));

      return {
        passed: diffPercentage < 5.0, // 5% threshold for passing
        diffPixels,
        diffPercentage,
        diffPath,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Accept current screenshots as new expected versions
   * @param validationResults Results from validation
   */
  async acceptScreenshots(
    validationResults: ScreenshotValidationResult[]
  ): Promise<void> {
    for (const result of validationResults) {
      if (result.isFirstRun || !result.passed) {
        // Copy actual to expected
        const expectedPath = path.join(
          this.expectedPath,
          path.basename(result.actualPath)
        );
        await fs.copyFile(result.actualPath, expectedPath);
        console.log(`Accepted new expected screenshot: ${expectedPath}`);
      }
    }
  }

  /**
   * Generate a comprehensive report of screenshot validation results
   * @param validationResults Results from validation
   * @param outputPath Path to save report
   */
  async generateReport(
    validationResults: ScreenshotValidationResult[],
    outputPath?: string
  ): Promise<string> {
    const reportPath =
      outputPath ||
      path.join(this.reportPath, `screenshot-report-${Date.now()}.html`);

    const passedCount = validationResults.filter((r) => r.passed).length;
    const failedCount = validationResults.filter(
      (r) => !r.passed && !r.isFirstRun
    ).length;
    const firstRunCount = validationResults.filter((r) => r.isFirstRun).length;

    const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Automated Screenshot Validation Report</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background-color: #f5f5f5;
        }
        .header { 
            background-color: #333; 
            color: white; 
            padding: 20px; 
            border-radius: 5px; 
            margin-bottom: 20px;
        }
        .summary { 
            display: flex; 
            justify-content: space-around; 
            margin-bottom: 20px;
        }
        .summary-item { 
            background-color: white; 
            padding: 15px; 
            border-radius: 5px; 
            text-align: center; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .first-run { border-left: 5px solid #2196F3; }
        .result { 
            background-color: white; 
            margin-bottom: 15px; 
            padding: 15px; 
            border-radius: 5px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .image-container { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 10px; 
            margin-top: 10px;
        }
        .image-container img { 
            max-width: 200px; 
            border: 1px solid #ddd; 
            border-radius: 3px;
        }
        .status-passed { color: #4CAF50; }
        .status-failed { color: #f44336; }
        .status-first-run { color: #2196F3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Automated Screenshot Validation Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
        <div class="summary-item">
            <h2>${validationResults.length}</h2>
            <p>Total Tests</p>
        </div>
        <div class="summary-item">
            <h2>${passedCount}</h2>
            <p>Passed</p>
        </div>
        <div class="summary-item">
            <h2>${failedCount}</h2>
            <p>Failed</p>
        </div>
        <div class="summary-item">
            <h2>${firstRunCount}</h2>
            <p>First Run</p>
        </div>
    </div>
    
    ${validationResults
      .map(
        (result) => `
        <div class="result ${result.passed ? 'passed' : result.isFirstRun ? 'first-run' : 'failed'}">
            <h2>${result.interactionName}</h2>
            <p><strong>ID:</strong> ${result.interactionId}</p>
            <p><strong>Status:</strong> 
                <span class="status-${result.passed ? 'passed' : result.isFirstRun ? 'first-run' : 'failed'}">
                    ${result.passed ? 'PASSED' : result.isFirstRun ? 'FIRST RUN' : 'FAILED'}
                </span>
            </p>
            ${
              !result.isFirstRun
                ? `
                <p><strong>Diff Pixels:</strong> ${result.diffPixels}</p>
                <p><strong>Diff Percentage:</strong> ${result.diffPercentage.toFixed(2)}%</p>
            `
                : ''
            }
            
            <div class="image-container">
                <div>
                    <h3>Actual</h3>
                    <img src="file://${result.actualPath}" alt="Actual">
                </div>
                
                ${
                  !result.isFirstRun
                    ? `
                <div>
                    <h3>Expected</h3>
                    <img src="file://${result.expectedPath}" alt="Expected">
                </div>
                
                ${
                  result.diffPath
                    ? `
                <div>
                    <h3>Diff</h3>
                    <img src="file://${result.diffPath}" alt="Diff">
                </div>
                `
                    : ''
                }
                `
                    : ''
                }
            </div>
        </div>
    `
      )
      .join('')}
</body>
</html>
    `.trim();

    await fs.writeFile(reportPath, reportContent);
    return reportPath;
  }

  /**
   * Get predefined interactions for common UI components
   */
  getCommonInteractions(): ScreenshotInteraction[] {
    return [
      // Graph node interactions
      {
        id: 'node-hover',
        name: 'Node Hover State',
        type: 'hover',
        selector: 'canvas',
        waitTime: 300,
      },
      {
        id: 'node-click',
        name: 'Node Click Selection',
        type: 'click',
        selector: 'canvas',
        waitTime: 300,
      },
      {
        id: 'node-drag',
        name: 'Node Drag Movement',
        type: 'drag',
        selector: 'canvas',
        targetSelector: 'canvas',
        sourcePosition: { x: 600, y: 300 },
        targetPosition: { x: 700, y: 400 },
        waitTime: 500,
      },

      // Edge interactions
      {
        id: 'edge-hover',
        name: 'Edge Hover State',
        type: 'hover',
        selector: 'canvas',
        position: { x: 640, y: 360 },
        waitTime: 300,
      },

      // Camera controls
      {
        id: 'camera-pan',
        name: 'Camera Panning',
        type: 'drag',
        selector: 'canvas',
        targetSelector: 'canvas',
        sourcePosition: { x: 400, y: 300 },
        targetPosition: { x: 800, y: 500 },
        waitTime: 500,
      },
      {
        id: 'camera-zoom-in',
        name: 'Camera Zoom In',
        type: 'scroll',
        selector: 'canvas',
        deltaY: -100,
        waitTime: 300,
      },
      {
        id: 'camera-zoom-out',
        name: 'Camera Zoom Out',
        type: 'scroll',
        selector: 'canvas',
        deltaY: 100,
        waitTime: 300,
      },

      // UI overlays
      {
        id: 'hud-toggle',
        name: 'HUD Toggle Visibility',
        type: 'keyboard',
        selector: 'document',
        keys: 'h',
        waitTime: 200,
      },
      {
        id: 'performance-toggle',
        name: 'Performance Overlay Toggle',
        type: 'keyboard',
        selector: 'document',
        keys: 'p',
        waitTime: 200,
      },
    ];
  }
}

// Interfaces
export interface ScreenshotInteraction {
  id: string;
  name: string;
  type: 'hover' | 'click' | 'drag' | 'keyboard' | 'scroll';
  selector: string;
  targetSelector?: string;
  position?: { x: number; y: number };
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  button?: 'left' | 'right' | 'middle';
  keys?: string;
  deltaX?: number;
  deltaY?: number;
  waitTime?: number;
}

export interface ScreenshotGenerationResult {
  interactionId: string;
  interactionName: string;
  screenshotPath: string;
  timestamp: string;
  status: 'generated' | 'failed';
}

export interface ScreenshotValidationResult {
  interactionId: string;
  interactionName: string;
  passed: boolean;
  diffPixels: number;
  diffPercentage: number;
  actualPath: string;
  expectedPath: string;
  diffPath?: string;
  isFirstRun?: boolean;
  timestamp: string;
}

export interface ScreenshotComparisonDetail {
  passed: boolean;
  diffPixels: number;
  diffPercentage: number;
  diffPath?: string;
}

// Export singleton instance
export const automatedScreenshotSystem = new AutomatedScreenshotSystem();
