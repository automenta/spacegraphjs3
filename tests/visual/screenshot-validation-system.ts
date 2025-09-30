import { Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Screenshot Validation System
 * 
 * Advanced system for generating, comparing, and validating screenshots
 * with detailed reporting and diff visualization.
 */

export class ScreenshotValidationSystem {
  private basePath: string;
  private diffPath: string;
  private expectedPath: string;

  constructor(basePath: string = 'tests/visual') {
    this.basePath = basePath;
    this.diffPath = path.join(basePath, 'diffs');
    this.expectedPath = path.join(basePath, 'expected');
  }

  /**
   * Initialize the screenshot validation system
   */
  async initialize(): Promise<void> {
    // Create necessary directories
    await fs.mkdir(this.diffPath, { recursive: true });
    await fs.mkdir(this.expectedPath, { recursive: true });
  }

  /**
   * Capture a screenshot with metadata
   * @param page Playwright page instance
   * @param name Screenshot name
   * @param options Screenshot options
   * @returns Screenshot metadata
   */
  async captureScreenshot(
    page: Page,
    name: string,
    options: CaptureOptions = {}
  ): Promise<ScreenshotMetadata> {
    const timestamp = new Date().toISOString();
    const fileName = `${name}-${timestamp.replace(/[:.]/g, '-')}.png`;
    const filePath = path.join(this.basePath, fileName);
    
    // Capture screenshot
    await page.screenshot({
      path: filePath,
      fullPage: options.fullPage ?? true,
      clip: options.clip,
      omitBackground: options.omitBackground,
      quality: options.quality,
      type: options.type || 'png',
    });
    
    // Get image dimensions
    const dimensions = await this.getImageDimensions(filePath);
    
    const metadata: ScreenshotMetadata = {
      name,
      fileName,
      filePath,
      timestamp,
      width: dimensions.width,
      height: dimensions.height,
      viewport: page.viewportSize() || { width: 0, height: 0 },
    };
    
    return metadata;
  }

  /**
   * Compare two screenshots
   * @param actualPath Path to actual screenshot
   * @param expectedName Name of expected screenshot
   * @param options Comparison options
   * @returns Comparison result
   */
  async compareScreenshots(
    actualPath: string,
    expectedName: string,
    options: CompareOptions = {}
  ): Promise<ScreenshotComparisonResult> {
    const expectedPath = path.join(this.expectedPath, `${expectedName}.png`);
    const diffPath = path.join(this.diffPath, `${expectedName}-diff.png`);
    
    try {
      // Check if expected screenshot exists
      await fs.access(expectedPath);
      
      // Load images
      const img1 = PNG.sync.read(await fs.readFile(actualPath));
      const img2 = PNG.sync.read(await fs.readFile(expectedPath));
      
      // Create diff image
      const { width, height } = img1;
      const diff = new PNG({ width, height });
      
      // Compare images
      const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
        threshold: options.threshold || 0.1,
        includeAA: options.includeAA || false,
      });
      
      const totalPixels = width * height;
      const diffPercentage = (diffPixels / totalPixels) * 100;
      
      // Save diff image if there are differences
      if (diffPixels > 0) {
        await fs.writeFile(diffPath, PNG.sync.write(diff));
      }
      
      const result: ScreenshotComparisonResult = {
        passed: diffPixels <= (options.maxDiffPixels || 1000),
        diffPixels,
        diffPercentage,
        actualPath,
        expectedPath,
        diffPath: diffPixels > 0 ? diffPath : undefined,
      };
      
      return result;
    } catch (error) {
      // Expected screenshot doesn't exist - this might be the first run
      const result: ScreenshotComparisonResult = {
        passed: true, // First run passes by default
        diffPixels: 0,
        diffPercentage: 0,
        actualPath,
        expectedPath,
        isFirstRun: true,
      };
      
      return result;
    }
  }

  /**
   * Accept a screenshot as the new expected version
   * @param actualPath Path to actual screenshot
   * @param expectedName Name for expected screenshot
   */
  async acceptScreenshot(actualPath: string, expectedName: string): Promise<void> {
    const expectedPath = path.join(this.expectedPath, `${expectedName}.png`);
    await fs.copyFile(actualPath, expectedPath);
  }

  /**
   * Get image dimensions
   * @param imagePath Path to image file
   * @returns Image dimensions
   */
  private async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    try {
      const buffer = await fs.readFile(imagePath);
      const png = PNG.sync.read(buffer);
      return { width: png.width, height: png.height };
    } catch (error) {
      // If not a PNG, return default dimensions
      return { width: 0, height: 0 };
    }
  }

  /**
   * Generate a visual report of screenshot comparisons
   * @param results Comparison results
   * @param outputPath Path to save report
   */
  async generateReport(results: ScreenshotComparisonResult[], outputPath: string): Promise<void> {
    const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Screenshot Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .result { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .image-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .image-container img { max-width: 300px; border: 1px solid #ddd; }
        .stats { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Screenshot Validation Report</h1>
    <div class="stats">
        <p>Total Tests: ${results.length}</p>
        <p>Passed: ${results.filter(r => r.passed).length}</p>
        <p>Failed: ${results.filter(r => !r.passed).length}</p>
    </div>
    
    ${results.map(result => `
        <div class="result ${result.passed ? 'passed' : 'failed'}">
            <h2>${result.expectedPath.split('/').pop()}</h2>
            <p>Status: ${result.passed ? 'PASSED' : 'FAILED'}</p>
            <p>Diff Pixels: ${result.diffPixels}</p>
            <p>Diff Percentage: ${result.diffPercentage.toFixed(2)}%</p>
            
            <div class="image-container">
                <div>
                    <h3>Actual</h3>
                    <img src="${path.relative(path.dirname(outputPath), result.actualPath)}" alt="Actual">
                </div>
                
                <div>
                    <h3>Expected</h3>
                    <img src="${path.relative(path.dirname(outputPath), result.expectedPath)}" alt="Expected">
                </div>
                
                ${result.diffPath ? `
                <div>
                    <h3>Diff</h3>
                    <img src="${path.relative(path.dirname(outputPath), result.diffPath)}" alt="Diff">
                </div>
                ` : ''}
            </div>
        </div>
    `).join('')}
</body>
</html>
    `.trim();
    
    await fs.writeFile(outputPath, reportContent);
  }
}

// Interfaces
export interface CaptureOptions {
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
}

export interface ScreenshotMetadata {
  name: string;
  fileName: string;
  filePath: string;
  timestamp: string;
  width: number;
  height: number;
  viewport: { width: number; height: number };
}

export interface CompareOptions {
  threshold?: number;
  maxDiffPixels?: number;
  includeAA?: boolean;
}

export interface ScreenshotComparisonResult {
  passed: boolean;
  diffPixels: number;
  diffPercentage: number;
  actualPath: string;
  expectedPath: string;
  diffPath?: string;
  isFirstRun?: boolean;
}