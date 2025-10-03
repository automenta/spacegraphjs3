import { VisualSemanticsSpec } from '../visual-semantics-controller';

/**
 * Comprehensive Visual Semantics Specifications for SpaceGraphJS UI Components
 *
 * This file defines visual semantics specifications for all major UI components
 * in SpaceGraphJS, enabling comprehensive end-to-end UI/UX testing.
 */

// Camera Controls Specifications
export const CameraControlsSpec: VisualSemanticsSpec = {
  component: 'CameraControls',
  elementId: 'camera-controls',
  states: {
    base: {
      color: '#333333',
      opacity: 0.7,
    },
    active: {
      color: '#00ff00',
      opacity: 1.0,
      boxShadow: '0 0 15px #00ff00',
    },
    disabled: {
      color: '#666666',
      opacity: 0.3,
    },
  },
  interactions: [
    {
      name: 'Pan Interaction',
      steps: [{ type: 'drag', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Canvas should pan smoothly when dragging',
          screenshot: 'camera-pan-interaction.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 8000,
          },
        },
      ],
    },
    {
      name: 'Zoom Interaction',
      steps: [{ type: 'scroll', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Canvas should zoom in/out with scroll wheel',
          screenshot: 'camera-zoom-interaction.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 10000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 30,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 50,
  },
};

// Layout Engine Specifications
export const LayoutEngineSpec: VisualSemanticsSpec = {
  component: 'LayoutEngine',
  elementId: 'layout-engine',
  states: {
    base: {
      color: '#444444',
    },
    processing: {
      color: '#ffff00',
      opacity: 0.8,
    },
    completed: {
      color: '#00ff00',
      opacity: 1.0,
    },
  },
  interactions: [
    {
      name: 'Layout Execution',
      steps: [{ type: 'click', target: '#layout-button' }],
      expectedOutcomes: [
        {
          description: 'Nodes should rearrange according to layout algorithm',
          screenshot: 'layout-execution.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 500,
  },
};

// HUD/Overlay Specifications
export const HUDSpec: VisualSemanticsSpec = {
  component: 'HeadsUpDisplay',
  elementId: 'hud-overlay',
  states: {
    base: {
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      fontSize: 14,
    },
    visible: {
      opacity: 1.0,
    },
    hidden: {
      opacity: 0.0,
    },
  },
  interactions: [
    {
      name: 'HUD Toggle',
      steps: [{ type: 'keyboard', target: 'document', params: { keys: 'h' } }],
      expectedOutcomes: [
        {
          description: 'HUD should toggle visibility with H key',
          screenshot: 'hud-toggle-visibility.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 20,
    minContrastRatio: 7.0,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 30,
  },
};

// Selection Manager Specifications
export const SelectionManagerSpec: VisualSemanticsSpec = {
  component: 'SelectionManager',
  elementId: 'selection-manager',
  states: {
    base: {
      color: '#ffffff',
    },
    singleSelect: {
      color: '#ffff00',
      boxShadow: '0 0 10px #ffff00',
    },
    multiSelect: {
      color: '#ff00ff',
      boxShadow: '0 0 15px #ff00ff',
    },
    lassoSelect: {
      color: '#00ffff',
      boxShadow: '0 0 10px #00ffff',
    },
  },
  interactions: [
    {
      name: 'Single Selection',
      steps: [{ type: 'click', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Single element should be highlighted when clicked',
          screenshot: 'single-selection.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
          },
        },
      ],
    },
    {
      name: 'Multi Selection',
      steps: [
        { type: 'keyboard', target: 'document', params: { keys: 'Control' } },
        { type: 'click', target: 'canvas' },
      ],
      expectedOutcomes: [
        {
          description:
            'Multiple elements should be highlighted with Ctrl+Click',
          screenshot: 'multi-selection.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 8000,
          },
        },
      ],
    },
    {
      name: 'Lasso Selection',
      steps: [{ type: 'drag', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Elements within lasso area should be selected',
          screenshot: 'lasso-selection.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 12000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 25,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 100,
  },
};

// Context Menu Specifications
export const ContextMenuSpec: VisualSemanticsSpec = {
  component: 'ContextMenu',
  elementId: 'context-menu',
  states: {
    base: {
      backgroundColor: '#222222',
      color: '#ffffff',
      fontSize: 14,
    },
    open: {
      opacity: 1.0,
    },
    closed: {
      opacity: 0.0,
    },
  },
  interactions: [
    {
      name: 'Context Menu Open',
      steps: [{ type: 'click', target: 'canvas', params: { button: 'right' } }],
      expectedOutcomes: [
        {
          description: 'Context menu should appear on right-click',
          screenshot: 'context-menu-open.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 6000,
          },
        },
      ],
    },
    {
      name: 'Context Menu Item Select',
      steps: [
        { type: 'click', target: 'canvas', params: { button: 'right' } },
        { type: 'click', target: '.context-menu-item' },
      ],
      expectedOutcomes: [
        {
          description: 'Context menu item should trigger action when clicked',
          screenshot: 'context-menu-item-select.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 7000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 30,
    minContrastRatio: 7.0,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 150,
  },
};

// Search/Filter Specifications
export const SearchFilterSpec: VisualSemanticsSpec = {
  component: 'SearchFilter',
  elementId: 'search-filter',
  states: {
    base: {
      backgroundColor: '#ffffff',
      color: '#000000',
      fontSize: 16,
    },
    focused: {
      boxShadow: '0 0 5px #00ff00',
    },
    hasResults: {
      color: '#0000ff',
    },
  },
  interactions: [
    {
      name: 'Search Input',
      steps: [
        { type: 'click', target: '#search-input' },
        { type: 'keyboard', target: '#search-input', params: { keys: 'test' } },
      ],
      expectedOutcomes: [
        {
          description: 'Search results should appear as user types',
          screenshot: 'search-input-results.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 8000,
          },
        },
      ],
    },
    {
      name: 'Filter Application',
      steps: [
        { type: 'click', target: '#filter-dropdown' },
        { type: 'click', target: '.filter-option' },
      ],
      expectedOutcomes: [
        {
          description: 'Graph should update to show only filtered elements',
          screenshot: 'filter-application.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 200,
  },
};

// Performance Overlay Specifications
export const PerformanceOverlaySpec: VisualSemanticsSpec = {
  component: 'PerformanceOverlay',
  elementId: 'performance-overlay',
  states: {
    base: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#ffffff',
      fontSize: 12,
    },
    highPerformance: {
      color: '#00ff00',
    },
    mediumPerformance: {
      color: '#ffff00',
    },
    lowPerformance: {
      color: '#ff0000',
    },
  },
  interactions: [
    {
      name: 'Performance Display',
      steps: [{ type: 'keyboard', target: 'document', params: { keys: 'p' } }],
      expectedOutcomes: [
        {
          description:
            'Performance metrics should display when P key is pressed',
          screenshot: 'performance-display.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 4000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 20,
    minContrastRatio: 7.0,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 30,
  },
};

// Sphere Element Actor Specifications
export const SphereElementActorSpec: VisualSemanticsSpec = {
  component: 'SphereElementActor',
  elementId: 'sphere-element-actor',
  states: {
    base: {
      color: '#ff0000',
      size: { width: 20, height: 20 },
    },
    hover: {
      color: '#ffffff',
      boxShadow: '0 0 10px #ffffff',
    },
    selected: {
      color: '#ffff00',
      boxShadow: '0 0 15px #ffff00',
    },
    dragging: {
      color: '#00ffff',
      opacity: 0.8,
    },
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Sphere element actor should glow when hovered',
          screenshot: 'sphere-element-actor-hover.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
          },
        },
      ],
    },
    {
      name: 'Selection Interaction',
      steps: [{ type: 'click', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Sphere element actor should have selection highlight',
          screenshot: 'sphere-element-actor-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
          },
        },
      ],
    },
    {
      name: 'Drag Interaction',
      steps: [{ type: 'drag', target: 'canvas' }],
      expectedOutcomes: [
        {
          description:
            'Sphere element actor should become semi-transparent when dragged',
          screenshot: 'sphere-element-actor-dragging.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 6000,
          },
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

// Box Element Actor Specifications
export const BoxElementActorSpec: VisualSemanticsSpec = {
  component: 'BoxElementActor',
  elementId: 'box-element-actor',
  states: {
    base: {
      color: '#00ff00',
      size: { width: 25, height: 25 },
    },
    hover: {
      color: '#ffffff',
      boxShadow: '0 0 10px #ffffff',
    },
    selected: {
      color: '#ffff00',
      boxShadow: '0 0 15px #ffff00',
    },
    dragging: {
      color: '#00ffff',
      opacity: 0.8,
    },
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Box element actor should glow when hovered',
          screenshot: 'box-element-actor-hover.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
          },
        },
      ],
    },
    {
      name: 'Selection Interaction',
      steps: [{ type: 'click', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Box element actor should have selection highlight',
          screenshot: 'box-element-actor-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
          },
        },
      ],
    },
    {
      name: 'Drag Interaction',
      steps: [{ type: 'drag', target: 'canvas' }],
      expectedOutcomes: [
        {
          description:
            'Box element actor should become semi-transparent when dragged',
          screenshot: 'box-element-actor-dragging.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 6000,
          },
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

// Text Element Actor Specifications
export const TextElementActorSpec: VisualSemanticsSpec = {
  component: 'TextElementActor',
  elementId: 'text-element-actor',
  states: {
    base: {
      color: '#0000ff',
      fontSize: 14,
      textAlign: 'center',
    },
    hover: {
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    selected: {
      color: '#ffff00',
      backgroundColor: 'rgba(255, 255, 0, 0.2)',
    },
    editing: {
      color: '#00ff00',
      backgroundColor: 'rgba(0, 255, 0, 0.2)',
    },
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Text element actor should have background when hovered',
          screenshot: 'text-element-actor-hover.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 3000,
          },
        },
      ],
    },
    {
      name: 'Selection Interaction',
      steps: [{ type: 'click', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Text element actor should have selection background',
          screenshot: 'text-element-actor-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 3000,
          },
        },
      ],
    },
    {
      name: 'Edit Interaction',
      steps: [
        { type: 'click', target: 'canvas' },
        { type: 'click', target: 'canvas' },
      ],
      expectedOutcomes: [
        {
          description: 'Text element actor should show editing state',
          screenshot: 'text-element-actor-editing.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 4000,
          },
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

// HTML Node Element Actor Specifications
export const HtmlNodeElementActorSpec: VisualSemanticsSpec = {
  component: 'HtmlNodeElementActor',
  elementId: 'html-node-element-actor',
  states: {
    base: {
      backgroundColor: '#ffffff',
      color: '#000000',
      fontSize: 12,
      borderRadius: 4,
    },
    hover: {
      backgroundColor: '#f0f0f0',
      boxShadow: '0 0 5px #cccccc',
    },
    selected: {
      backgroundColor: '#e0e0ff',
      boxShadow: '0 0 10px #ccccff',
    },
    focused: {
      color: '#0000ff',
      boxShadow: '0 0 2px 2px #0000ff',
    },
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description:
            'HTML node element actor should have subtle hover effect',
          screenshot: 'html-node-element-actor-hover.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 4000,
          },
        },
      ],
    },
    {
      name: 'Selection Interaction',
      steps: [{ type: 'click', target: 'canvas' }],
      expectedOutcomes: [
        {
          description:
            'HTML node element actor should have selection highlight',
          screenshot: 'html-node-element-actor-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 4000,
          },
        },
      ],
    },
    {
      name: 'Focus Interaction',
      steps: [
        { type: 'keyboard', target: 'document', params: { keys: 'Tab' } },
      ],
      expectedOutcomes: [
        {
          description: 'HTML node element actor should show focus indicator',
          screenshot: 'html-node-element-actor-focus.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 3500,
          },
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

// Edge Renderer Specifications
export const EdgeRendererSpec: VisualSemanticsSpec = {
  component: 'EdgeRenderer',
  elementId: 'edge-renderer',
  states: {
    base: {
      color: '#ffffff',
      size: { width: 2, height: 0 }, // Height is not applicable for edges
    },
    hover: {
      color: '#ffff00',
      size: { width: 4, height: 0 },
    },
    selected: {
      color: '#ff0000',
      size: { width: 6, height: 0 },
    },
    directed: {
      color: '#00ff00',
    },
  },
  interactions: [
    {
      name: 'Edge Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Edge should thicken and change color when hovered',
          screenshot: 'edge-renderer-hover.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 4000,
          },
        },
      ],
    },
    {
      name: 'Edge Selection Interaction',
      steps: [{ type: 'click', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Edge should thicken and change color when selected',
          screenshot: 'edge-renderer-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 4000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 10, // Edges need to be clickable
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 100,
  },
};

// Edge Label Specifications
export const EdgeLabelSpec: VisualSemanticsSpec = {
  component: 'EdgeLabel',
  elementId: 'edge-label',
  states: {
    base: {
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      fontSize: 12,
    },
    hover: {
      color: '#ffff00',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    selected: {
      color: '#ff0000',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      fontWeight: 'bold',
    },
  },
  interactions: [
    {
      name: 'Label Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Edge label should become more prominent when hovered',
          screenshot: 'edge-label-hover.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 2000,
          },
        },
      ],
    },
    {
      name: 'Label Selection Interaction',
      steps: [{ type: 'click', target: 'canvas' }],
      expectedOutcomes: [
        {
          description:
            'Edge label should become bold and change color when selected',
          screenshot: 'edge-label-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 2000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 20,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 100,
  },
};

// Instanced Renderer Specifications
export const InstancedRendererSpec: VisualSemanticsSpec = {
  component: 'InstancedRenderer',
  elementId: 'instanced-renderer',
  states: {
    base: {
      color: '#888888',
      opacity: 1.0,
    },
    optimized: {
      color: '#00ff00',
      opacity: 0.9,
    },
    fallback: {
      color: '#ff0000',
      opacity: 1.0,
    },
  },
  interactions: [
    {
      name: 'Renderer Switch',
      steps: [{ type: 'click', target: '#renderer-toggle' }],
      expectedOutcomes: [
        {
          description:
            'Renderer should switch between instanced and standard modes',
          screenshot: 'instanced-renderer-switch.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 10000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 200,
  },
};

// Layout Engine Specifications (Individual Layouts)
export const D3ForceLayoutSpec: VisualSemanticsSpec = {
  component: 'D3ForceLayout',
  elementId: 'd3-force-layout',
  states: {
    base: {
      color: '#444444',
    },
    processing: {
      color: '#ffff00',
      opacity: 0.8,
    },
    completed: {
      color: '#00ff00',
      opacity: 1.0,
    },
  },
  interactions: [
    {
      name: 'Force Layout Execution',
      steps: [{ type: 'click', target: '#force-layout-button' }],
      expectedOutcomes: [
        {
          description: 'Nodes should arrange in force-directed layout',
          screenshot: 'd3-force-layout-execution.png',
          validation: {
            threshold: 0.25,
            maxDiffPixels: 20000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 1000,
  },
};

export const CircleLayoutSpec: VisualSemanticsSpec = {
  component: 'CircleLayout',
  elementId: 'circle-layout',
  states: {
    base: {
      color: '#444444',
    },
    processing: {
      color: '#ffff00',
      opacity: 0.8,
    },
    completed: {
      color: '#00ff00',
      opacity: 1.0,
    },
  },
  interactions: [
    {
      name: 'Circle Layout Execution',
      steps: [{ type: 'click', target: '#circle-layout-button' }],
      expectedOutcomes: [
        {
          description: 'Nodes should arrange in circular pattern',
          screenshot: 'circle-layout-execution.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 500,
  },
};

export const GridLayoutSpec: VisualSemanticsSpec = {
  component: 'GridLayout',
  elementId: 'grid-layout',
  states: {
    base: {
      color: '#444444',
    },
    processing: {
      color: '#ffff00',
      opacity: 0.8,
    },
    completed: {
      color: '#00ff00',
      opacity: 1.0,
    },
  },
  interactions: [
    {
      name: 'Grid Layout Execution',
      steps: [{ type: 'click', target: '#grid-layout-button' }],
      expectedOutcomes: [
        {
          description: 'Nodes should arrange in grid pattern',
          screenshot: 'grid-layout-execution.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000,
          },
        },
      ],
    },
  ],
  ergonomics: {
    minTouchTargetSize: 44,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 500,
  },
};

// Export all specs as a collection
export const ComprehensiveUISemanticsSpecs = {
  CameraControlsSpec,
  LayoutEngineSpec,
  HUDSpec,
  SelectionManagerSpec,
  ContextMenuSpec,
  SearchFilterSpec,
  PerformanceOverlaySpec,
  SphereElementActorSpec,
  BoxElementActorSpec,
  TextElementActorSpec,
  HtmlNodeElementActorSpec,
  EdgeRendererSpec,
  EdgeLabelSpec,
  InstancedRendererSpec,
  D3ForceLayoutSpec,
  CircleLayoutSpec,
  GridLayoutSpec,
};
