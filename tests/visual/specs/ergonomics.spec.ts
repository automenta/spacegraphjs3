import { VisualSemanticsSpec } from '../enhanced-visual-semantics-controller';

/**
 * Ergonomics Specifications for SpaceGraphJS
 *
 * Defines ergonomic requirements and visual expectations for various UI components
 * to ensure videogame-like responsiveness, accessibility, and user experience.
 */

export const CameraControlsSpec: VisualSemanticsSpec = {
  component: 'CameraControls',
  elementId: 'camera-controls',
  states: {
    base: {
      opacity: 0.8,
      fontSize: 14,
      contrastRatio: 4.5,
    },
    hover: {
      opacity: 1.0,
      boxShadow: '0 0 10px rgba(255,255,255,0.3)',
    },
    active: {
      opacity: 1.0,
      boxShadow: '0 0 20px rgba(0,255,255,0.5)',
    },
  },
  interactions: [
    {
      name: 'Camera Movement Responsiveness',
      steps: [
        { type: 'keyboard', target: 'canvas', params: { keys: 'w' } },
        { type: 'keyboard', target: 'canvas', params: { keys: 'a' } },
        { type: 'keyboard', target: 'canvas', params: { keys: 's' } },
        { type: 'keyboard', target: 'canvas', params: { keys: 'd' } },
      ],
      expectedOutcomes: [
        {
          description: 'Camera should move smoothly with WASD keys',
          screenshot: 'camera-wasd-movement.png',
          validation: { threshold: 0.1, maxDiffPixels: 10000 },
        },
      ],
    },
    {
      name: 'Camera FlyTo Animation',
      steps: [
        {
          type: 'click',
          target: 'canvas',
          params: { position: { x: 100, y: 100 } },
        },
      ],
      expectedOutcomes: [
        {
          description: 'Camera should smoothly animate to new position',
          screenshot: 'camera-flyto-animation.png',
          validation: { threshold: 0.1, maxDiffPixels: 15000 },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 50, // Videogame-like responsiveness
  },
};

export const NodeInteractionSpec: VisualSemanticsSpec = {
  component: 'NodeInteraction',
  elementId: 'node-interaction',
  states: {
    base: {
      size: { width: 20, height: 20 },
      opacity: 0.9,
      contrastRatio: 4.5,
    },
    hover: {
      size: { width: 25, height: 25 },
      opacity: 1.0,
      boxShadow: '0 0 15px rgba(255,255,255,0.5)',
    },
    selected: {
      size: { width: 30, height: 30 },
      opacity: 1.0,
      boxShadow: '0 0 25px rgba(0,255,255,0.8)',
      borderRadius: 5,
    },
  },
  interactions: [
    {
      name: 'Node Hover Feedback',
      steps: [
        {
          type: 'hover',
          target: 'canvas',
          params: { position: { x: 200, y: 200 } },
        },
      ],
      expectedOutcomes: [
        {
          description: 'Node should provide immediate visual feedback on hover',
          screenshot: 'node-hover-feedback.png',
          validation: { threshold: 0.05, maxDiffPixels: 5000 },
        },
      ],
    },
    {
      name: 'Node Selection',
      steps: [
        {
          type: 'click',
          target: 'canvas',
          params: { position: { x: 200, y: 200 } },
        },
      ],
      expectedOutcomes: [
        {
          description: 'Node should show clear selection state',
          screenshot: 'node-selection-state.png',
          validation: { threshold: 0.05, maxDiffPixels: 5000 },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 20, // More lenient for 3D elements
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 30, // Instant feedback for gaming feel
  },
};

export const TextElementSpec: VisualSemanticsSpec = {
  component: 'TextElement',
  elementId: 'text-element',
  states: {
    base: {
      fontSize: 14,
      color: '#ffffff',
      backgroundColor: '#000000',
      contrastRatio: 15.8, // White on black
      opacity: 1.0,
    },
    hover: {
      fontSize: 16,
      color: '#00ffff',
      boxShadow: '0 0 5px rgba(0,255,255,0.5)',
    },
  },
  interactions: [
    {
      name: 'Text Readability Check',
      steps: [
        {
          type: 'hover',
          target: 'canvas',
          params: { position: { x: 300, y: 300 } },
        },
      ],
      expectedOutcomes: [
        {
          description: 'Text should remain readable with good contrast',
          screenshot: 'text-readability-check.png',
          validation: { threshold: 0.02, maxDiffPixels: 1000 },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 30, // Text needs larger touch targets
    minContrastRatio: 4.5,
    keyboardNavigation: false, // Text is usually not interactive
    screenReaderSupport: true,
    maxResponseTime: 100,
  },
};

export const PerformanceUISpec: VisualSemanticsSpec = {
  component: 'PerformanceUI',
  elementId: 'performance-ui',
  states: {
    base: {
      fontSize: 12,
      color: '#00ff00',
      backgroundColor: 'rgba(0,0,0,0.8)',
      opacity: 0.9,
      contrastRatio: 5.2,
    },
    warning: {
      color: '#ffff00',
      backgroundColor: 'rgba(255,165,0,0.8)',
    },
    error: {
      color: '#ff0000',
      backgroundColor: 'rgba(255,0,0,0.8)',
    },
  },
  interactions: [
    {
      name: 'Performance Metrics Display',
      steps: [
        // Performance UI is usually passive, but we can test visibility
        { type: 'keyboard', target: 'canvas', params: { keys: 'F3' } }, // Common performance key
      ],
      expectedOutcomes: [
        {
          description: 'Performance metrics should be clearly visible',
          screenshot: 'performance-metrics-display.png',
          validation: { threshold: 0.1, maxDiffPixels: 2000 },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 24,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 50,
  },
};

export const AccessibilitySpec: VisualSemanticsSpec = {
  component: 'Accessibility',
  elementId: 'accessibility-features',
  states: {
    base: {
      focusIndicator: true,
      color: '#ffffff',
      backgroundColor: '#0066cc',
      contrastRatio: 7.2,
    },
    focus: {
      boxShadow: '0 0 0 3px rgba(0,102,204,0.8)',
      borderRadius: 2,
    },
  },
  interactions: [
    {
      name: 'Keyboard Navigation',
      steps: [
        { type: 'keyboard', target: 'canvas', params: { keys: 'Tab' } },
        { type: 'keyboard', target: 'canvas', params: { keys: 'ArrowRight' } },
        { type: 'keyboard', target: 'canvas', params: { keys: 'Enter' } },
      ],
      expectedOutcomes: [
        {
          description: 'Keyboard navigation should work smoothly',
          screenshot: 'keyboard-navigation-flow.png',
          validation: { threshold: 0.1, maxDiffPixels: 8000 },
        },
      ],
    },
    {
      name: 'Screen Reader Support',
      steps: [
        // Screen reader support is tested via attributes, not interactions
        {
          type: 'hover',
          target: 'canvas',
          params: { position: { x: 50, y: 50 } },
        },
      ],
      expectedOutcomes: [
        {
          description: 'Elements should have proper accessibility attributes',
          screenshot: 'accessibility-attributes.png',
          validation: { threshold: 0.05, maxDiffPixels: 1000 },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 100,
  },
};

// Collection of all ergonomics specifications
export const ErgonomicsSpecs = {
  CameraControlsSpec,
  NodeInteractionSpec,
  TextElementSpec,
  PerformanceUISpec,
  AccessibilitySpec,
};

// Helper function to get all ergonomics specs
export function getAllErgonomicsSpecs(): VisualSemanticsSpec[] {
  return Object.values(ErgonomicsSpecs);
}

// Helper function to get ergonomics spec by component name
export function getErgonomicsSpec(
  componentName: string
): VisualSemanticsSpec | undefined {
  return getAllErgonomicsSpecs().find(
    (spec) => spec.component === componentName
  );
}
