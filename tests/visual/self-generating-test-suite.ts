import { test, expect } from '@playwright/test';
import { VisualSemanticsController } from './visual-semantics-controller';
import { ComprehensiveUISemanticsSpecs } from './specs/comprehensive-ui.semantics';

/**
 * Self-Generating Test Suite for Visual Semantics
 *
 * This module automatically generates test cases based on visual semantics specifications,
 * reducing manual test creation effort and ensuring comprehensive coverage.
 */

interface TestSuiteConfig {
  baseUrl: string;
  defaultViewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  headless?: boolean;
}

class SelfGeneratingTestSuite {
  private config: TestSuiteConfig;
  private specs: Record<string, any>;

  constructor(config: TestSuiteConfig) {
    this.config = config;
    this.specs = ComprehensiveUISemanticsSpecs;
  }

  /**
   * Generate and register all tests based on specifications
   */
  generateTests(): void {
    // Group specs by category for better organization
    const categorizedSpecs = this.categorizeSpecs();

    // Generate tests for each category
    for (const [category, specs] of Object.entries(categorizedSpecs)) {
      test.describe(`${category} Visual Semantics`, () => {
        this.generateCategoryTests(specs);
      });
    }
  }

  /**
   * Categorize specifications by component type
   */
  private categorizeSpecs(): Record<string, any[]> {
    const categories: Record<string, any[]> = {
      'Element Actors': [],
      Renderers: [],
      'Layout Engines': [],
      'UI Components': [],
      'Interaction Managers': [],
      Overlays: [],
    };

    for (const [name, spec] of Object.entries(this.specs)) {
      if (name.includes('ElementActor')) {
        categories['Element Actors'].push([name, spec]);
      } else if (name.includes('Renderer') || name.includes('Edge')) {
        categories['Renderers'].push([name, spec]);
      } else if (name.includes('Layout')) {
        categories['Layout Engines'].push([name, spec]);
      } else if (
        name.includes('HUD') ||
        name.includes('Overlay') ||
        name.includes('Filter')
      ) {
        categories['Overlays'].push([name, spec]);
      } else if (name.includes('Manager') || name.includes('Menu')) {
        categories['Interaction Managers'].push([name, spec]);
      } else {
        categories['UI Components'].push([name, spec]);
      }
    }

    return categories;
  }

  /**
   * Generate tests for a specific category
   */
  private generateCategoryTests(specs: [string, any][]): void {
    for (const [name, spec] of specs) {
      test(`${this.formatTestName(name)} visual semantics`, async () => {
        let controller: VisualSemanticsController | null = null;

        try {
          // Initialize controller
          controller = await VisualSemanticsController.init({
            viewport: this.config.defaultViewport || {
              width: 1280,
              height: 720,
            },
            deviceScaleFactor: this.config.deviceScaleFactor || 1,
            isMobile: false,
            hasTouch: false,
          });

          // Determine appropriate demo page based on component type
          const demoPage = this.getDemoPageForComponent(spec.component);

          // Navigate to the appropriate demo page
          await controller.navigateTo(`${this.config.baseUrl}/${demoPage}`);

          // Test visual state
          await controller.assertVisualState(spec);

          // Test ergonomic compliance
          await controller.assertErgonomicCompliance(spec);
        } finally {
          // Cleanup
          if (controller) {
            await controller.cleanup();
          }
        }
      });
    }
  }

  /**
   * Get appropriate demo page for a component
   */
  private getDemoPageForComponent(component: string): string {
    // Map components to their appropriate demo pages
    const componentToPageMap: Record<string, string> = {
      SphereElementActor: 'element-actors-demo.html',
      BoxElementActor: 'element-actors-demo.html',
      TextElementActor: 'element-actors-demo.html',
      HtmlNodeElementActor: 'element-actors-demo.html',
      EdgeRenderer: 'edge-interaction.html',
      EdgeLabel: 'edge-interaction.html',
      D3ForceLayout: 'layout-engines-demo.html',
      CircleLayout: 'layout-engines-demo.html',
      GridLayout: 'layout-engines-demo.html',
      CameraControls: 'element-actors-demo.html',
      HUD: 'element-actors-demo.html',
      SelectionManager: 'instanced-interaction.html',
      ContextMenu: 'element-actors-demo.html',
      SearchFilter: 'element-actors-demo.html',
      PerformanceOverlay: 'element-actors-demo.html',
      InstancedRenderer: 'instanced-interaction.html',
    };

    return componentToPageMap[component] || 'element-actors-demo.html';
  }

  /**
   * Format test name for better readability
   */
  private formatTestName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}

// Export a function to easily generate tests
export function generateVisualSemanticsTests(config: TestSuiteConfig): void {
  const testSuite = new SelfGeneratingTestSuite(config);
  testSuite.generateTests();
}

// Export the class for advanced usage
export { SelfGeneratingTestSuite };

// Example usage:
// generateVisualSemanticsTests({
//   baseUrl: 'http://localhost:5174',
//   defaultViewport: { width: 1280, height: 720 },
//   deviceScaleFactor: 1,
// });
