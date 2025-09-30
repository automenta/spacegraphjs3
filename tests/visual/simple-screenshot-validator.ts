import { Page, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Simple Screenshot Validator
 * 
 * A lightweight screenshot validation system that works with Playwright's
 * built-in screenshot comparison capabilities.
 */

export class SimpleScreenshotValidator {
  private basePath: string;

  constructor(basePath: string = 'tests/visual') {
    this.basePath = basePath;
  }

  /**
   * Initialize the validator
   */
  async initialize(): Promise<void> {
    // Create base directory
    await fs.mkdir(this.basePath, { recursive: true });
  }

  /**
   * Capture and validate a screenshot
   * @param page Playwright page
   * @param name Screenshot name
   * @param options Validation options
   */
  async captureAndValidate(
    page: Page,
    name: string,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    // Use Playwright's built-in screenshot comparison
    try {
      await expect(page).toHaveScreenshot(`${name}.png`, {
        threshold: options.threshold || 0.2,
        maxDiffPixels: options.maxDiffPixels || 10000,
      });
      
      return {
        passed: true,
        message: 'Screenshot matches expected',
      };
    } catch (error) {
      // First run or mismatch
      return {
        passed: false,
        message: error instanceof Error ? error.message : 'Screenshot validation failed',
      };
    }
  }

  /**
   * Create a new expected screenshot (for first runs or updates)
   * @param page Playwright page
   * @param name Screenshot name
   */
  async createExpectedScreenshot(page: Page, name: string): Promise<void> {
    const screenshotsDir = path.join(process.cwd(), 'tests/visual/__snapshots__');
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    // Playwright will automatically create expected screenshots in __snapshots__ directory
    await page.screenshot({ 
      path: path.join(screenshotsDir, `${name}-expected.png`),
      fullPage: true,
    });
  }

  /**
   * Validate interaction sequence with multiple screenshots
   * @param page Playwright page
   * @param sequence Interaction sequence
   */
  async validateInteractionSequence(
    page: Page,
    sequence: InteractionSequence
  ): Promise<SequenceValidationResult> {
    const results: ValidationResult[] = [];
    
    for (const step of sequence.steps) {
      // Execute interaction
      switch (step.type) {
        case 'hover':
          await page.hover(step.selector, step.options);
          break;
        case 'click':
          await page.click(step.selector, step.options);
          break;
        case 'drag':
          if (step.targetSelector) {
            await page.dragAndDrop(step.selector, step.targetSelector, step.options);
          }
          break;
        case 'keyboard':
          if (step.keys) {
            await page.keyboard.press(step.keys, step.options);
          }
          break;
      }
      
      // Wait for interaction to complete
      await page.waitForTimeout(step.waitTime || 200);
      
      // Validate screenshot if specified
      if (step.screenshotName) {
        const result = await this.captureAndValidate(page, step.screenshotName, step.validation);
        results.push(result);
      }
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
    };
  }
}

// Interfaces
export interface ValidationOptions {
  threshold?: number;
  maxDiffPixels?: number;
  fullPage?: boolean;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
}

export interface SequenceValidationResult {
  passed: boolean;
  results: ValidationResult[];
}

export interface InteractionStep {
  type: 'hover' | 'click' | 'drag' | 'keyboard';
  selector: string;
  targetSelector?: string;
  keys?: string;
  options?: any;
  waitTime?: number;
  screenshotName?: string;
  validation?: ValidationOptions;
}

export interface InteractionSequence {
  name: string;
  steps: InteractionStep[];
}