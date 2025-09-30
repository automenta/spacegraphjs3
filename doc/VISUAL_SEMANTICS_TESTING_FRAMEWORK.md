# Visual Semantics Testing Framework

## Overview

This document describes the Visual Semantics Testing Framework for SpaceGraphJS, which combines generated-screenshot testing with validation and a control interface to definitively specify UI/UX ergonomics expectations.

## Framework Components

1. **Visual Semantics Specification** - Defines expected visual states and interactions
2. **Control Interface** - Programmatic interface for triggering interactions
3. **Screenshot Generation & Validation** - Automated capture and comparison of visual states
4. **Ergonomics Validation** - Ensures UI/UX meets ergonomic standards

## Visual Semantics Specification Format

```typescript
interface VisualSemanticsSpec {
  // Component identification
  component: string;
  elementId?: string;
  
  // Visual state expectations
  states: {
    // Base state
    base: VisualStateExpectation;
    
    // Interaction states
    hover?: VisualStateExpectation;
    focus?: VisualStateExpectation;
    active?: VisualStateExpectation;
    disabled?: VisualStateExpectation;
    
    // Custom states
    [key: string]: VisualStateExpectation;
  };
  
  // Interaction sequences
  interactions: InteractionSequence[];
  
  // Ergonomic requirements
  ergonomics: ErgonomicRequirements;
}

interface VisualStateExpectation {
  // Color expectations
  color?: string | string[];
  backgroundColor?: string | string[];
  
  // Size and positioning
  size?: { width: number; height: number };
  position?: { x: number; y: number };
  
  // Visual effects
  boxShadow?: string;
  borderRadius?: number;
  opacity?: number;
  
  // Text properties
  fontSize?: number;
  fontWeight?: string | number;
  textAlign?: string;
  
  // Accessibility
  contrastRatio?: number;
  focusIndicator?: boolean;
}

interface InteractionSequence {
  // Sequence name
  name: string;
  
  // Steps in the sequence
  steps: InteractionStep[];
  
  // Expected visual outcomes
  expectedOutcomes: VisualOutcome[];
}

interface InteractionStep {
  // Interaction type
  type: 'hover' | 'click' | 'drag' | 'keyboard' | 'scroll';
  
  // Target element
  target: string;
  
  // Additional parameters
  params?: any;
}

interface VisualOutcome {
  // Outcome description
  description: string;
  
  // Screenshot name
  screenshot: string;
  
  // Validation criteria
  validation: ValidationCriteria;
}

interface ValidationCriteria {
  // Pixel difference threshold (0-1)
  threshold?: number;
  
  // Maximum different pixels
  maxDiffPixels?: number;
  
  // Specific regions to ignore
  ignoreRegions?: Region[];
  
  // Custom validation function
  customValidator?: (screenshot: Buffer) => boolean;
}

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ErgonomicRequirements {
  // Minimum touch target size (pixels)
  minTouchTargetSize?: number;
  
  // Minimum contrast ratio
  minContrastRatio?: number;
  
  // Keyboard navigation support
  keyboardNavigation?: boolean;
  
  // Screen reader compatibility
  screenReaderSupport?: boolean;
  
  // Response time requirements (ms)
  maxResponseTime?: number;
}
```

## Control Interface API

```typescript
class VisualSemanticsController {
  // Initialize testing environment
  static async init(options?: InitOptions): Promise<VisualSemanticsController>;
  
  // Navigate to a specific page/route
  async navigateTo(url: string): Promise<void>;
  
  // Trigger interactions
  async hover(selector: string, options?: HoverOptions): Promise<void>;
  async click(selector: string, options?: ClickOptions): Promise<void>;
  async drag(source: string, target: string, options?: DragOptions): Promise<void>;
  async keyboard(keys: string, options?: KeyboardOptions): Promise<void>;
  
  // State assertions
  async assertVisualState(spec: VisualSemanticsSpec): Promise<void>;
  async assertErgonomicCompliance(spec: VisualSemanticsSpec): Promise<void>;
  
  // Screenshot operations
  async captureScreenshot(name: string, options?: ScreenshotOptions): Promise<string>;
  async compareScreenshots(actual: string, expected: string, options?: CompareOptions): Promise<ComparisonResult>;
  
  // Cleanup
  async cleanup(): Promise<void>;
}

interface InitOptions {
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

interface HoverOptions {
  position?: { x: number; y: number };
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
}

interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  position?: { x: number; y: number };
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
}

interface DragOptions {
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
}

interface KeyboardOptions {
  delay?: number;
}

interface ScreenshotOptions {
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
}

interface CompareOptions {
  threshold?: number;
  maxDiffPixels?: number;
  ignoreRegions?: Region[];
}

interface ComparisonResult {
  passed: boolean;
  diffPixels: number;
  diffPercentage: number;
  diffImage?: string;
}
```

## Usage Examples

### Basic Visual Semantics Test

```typescript
import { VisualSemanticsController } from './visual-semantics-controller';

test('Node hover interaction visual semantics', async () => {
  const controller = await VisualSemanticsController.init();
  
  // Navigate to test page
  await controller.navigateTo('/element-actors-demo.html');
  
  // Define visual semantics specification
  const nodeSpec: VisualSemanticsSpec = {
    component: 'GraphNode',
    elementId: 'node-1',
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
          { type: 'hover', target: '#node-1' }
        ],
        expectedOutcomes: [
          {
            description: 'Node should glow on hover',
            screenshot: 'node-hover-state.png',
            validation: {
              threshold: 0.1,
              maxDiffPixels: 1000
            }
          }
        ]
      }
    ],
    ergonomics: {
      minTouchTargetSize: 44,
      minContrastRatio: 4.5,
      maxResponseTime: 100
    }
  };
  
  // Assert visual state
  await controller.assertVisualState(nodeSpec);
  
  // Assert ergonomic compliance
  await controller.assertErgonomicCompliance(nodeSpec);
  
  await controller.cleanup();
});
```

## Integration with Existing Testing Infrastructure

The Visual Semantics Testing Framework integrates with:

1. **Playwright** - For browser automation and screenshot capture
2. **Vitest** - For test execution and reporting
3. **Existing E2E tests** - Can be extended with visual semantics validation
4. **Screenshot utilities** - Reuses existing capture infrastructure

## Benefits

1. **Definitive Specifications** - Clear, testable definitions of UI/UX expectations
2. **Regression Prevention** - Automatic detection of visual regressions
3. **Ergonomic Compliance** - Ensures accessibility and usability standards
4. **Developer Experience** - Simple API for creating visual tests
5. **Performance** - Efficient screenshot comparison with smart diffing

## Future Enhancements

1. **AI-Powered Visual Analysis** - Use computer vision for advanced visual validation
2. **Cross-Browser Testing** - Validate visual consistency across browsers
3. **Accessibility Auditing** - Automated WCAG compliance checking
4. **Performance Metrics** - Integration with performance monitoring
5. **Design System Compliance** - Validation against design tokens and guidelines