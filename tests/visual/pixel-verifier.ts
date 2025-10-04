import { PNG } from 'pngjs';

export interface PixelVerificationResult {
  passed: boolean;
  actualValue: number;
  expectedValue: number;
  tolerance: number;
  pixelCount: number;
  region: { x: number; y: number; width: number; height: number };
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class PixelVerifier {
  /**
   * Verifies that a shape (detected by red pixels) matches expected dimensions
   */
  static verifyShapeDimensions(
    screenshot: Buffer,
    expectedBounds: Bounds
  ): PixelVerificationResult {
    const png = PNG.sync.read(screenshot);
    const { width, height, data } = png;

    // Find actual bounds of red shape
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let redPixelCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Check for red pixel (same logic as existing tests)
        if (a > 200 && r > 200 && g < 50 && b < 50) {
          redPixelCount++;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // Calculate actual dimensions
    const actualWidth = maxX - minX + 1;
    const actualHeight = maxY - minY + 1;

    // Expected dimensions
    const expectedWidth = expectedBounds.maxX - expectedBounds.minX + 1;
    const expectedHeight = expectedBounds.maxY - expectedBounds.minY + 1;

    // Use width as the primary metric, height as secondary
    const actualValue = actualWidth;
    const expectedValue = expectedWidth;
    const tolerance = 5; // Allow 5 pixel tolerance
    const passed = Math.abs(actualWidth - expectedWidth) <= tolerance &&
                   Math.abs(actualHeight - expectedHeight) <= tolerance;

    return {
      passed,
      actualValue,
      expectedValue,
      tolerance,
      pixelCount: redPixelCount,
      region: { x: minX, y: minY, width: actualWidth, height: actualHeight }
    };
  }

  /**
   * Verifies position shift between two screenshots
   */
  static verifyPositionShift(
    beforeScreenshot: Buffer,
    afterScreenshot: Buffer,
    expectedDelta: { x: number; y: number }
  ): PixelVerificationResult {
    const beforePng = PNG.sync.read(beforeScreenshot);
    const afterPng = PNG.sync.read(afterScreenshot);

    if (beforePng.width !== afterPng.width || beforePng.height !== afterPng.height) {
      throw new Error('Screenshots must have the same dimensions for position shift verification');
    }

    const { width, height } = beforePng;

    // Find center of red square in before screenshot
    let beforeCenterX = 0;
    let beforeCenterY = 0;
    let beforeRedCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = beforePng.data[idx];
        const g = beforePng.data[idx + 1];
        const b = beforePng.data[idx + 2];
        const a = beforePng.data[idx + 3];

        if (a > 200 && r > 200 && g < 50 && b < 50) {
          beforeCenterX += x;
          beforeCenterY += y;
          beforeRedCount++;
        }
      }
    }

    if (beforeRedCount === 0) {
      return {
        passed: false,
        actualValue: 0,
        expectedValue: expectedDelta.x,
        tolerance: 0,
        pixelCount: 0,
        region: { x: 0, y: 0, width: 0, height: 0 }
      };
    }

    beforeCenterX /= beforeRedCount;
    beforeCenterY /= beforeRedCount;

    // Find center of red square in after screenshot
    let afterCenterX = 0;
    let afterCenterY = 0;
    let afterRedCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = afterPng.data[idx];
        const g = afterPng.data[idx + 1];
        const b = afterPng.data[idx + 2];
        const a = afterPng.data[idx + 3];

        if (a > 200 && r > 200 && g < 50 && b < 50) {
          afterCenterX += x;
          afterCenterY += y;
          afterRedCount++;
        }
      }
    }

    if (afterRedCount === 0) {
      return {
        passed: false,
        actualValue: 0,
        expectedValue: expectedDelta.x,
        tolerance: 0,
        pixelCount: 0,
        region: { x: 0, y: 0, width: 0, height: 0 }
      };
    }

    afterCenterX /= afterRedCount;
    afterCenterY /= afterRedCount;

    // Calculate actual delta
    const actualDeltaX = afterCenterX - beforeCenterX;
    const actualDeltaY = afterCenterY - beforeCenterY;

    // Check if deltas match within tolerance
    const tolerance = 2; // 2 pixel tolerance
    const passed = Math.abs(actualDeltaX - expectedDelta.x) <= tolerance &&
                   Math.abs(actualDeltaY - expectedDelta.y) <= tolerance;

    return {
      passed,
      actualValue: actualDeltaX,
      expectedValue: expectedDelta.x,
      tolerance,
      pixelCount: Math.min(beforeRedCount, afterRedCount),
      region: { x: beforeCenterX, y: beforeCenterY, width: actualDeltaX, height: actualDeltaY }
    };
  }
}