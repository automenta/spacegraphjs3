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
      opacity: 0.7
    },
    active: {
      color: '#00ff00',
      opacity: 1.0,
      boxShadow: '0 0 15px #00ff00'
    },
    disabled: {
      color: '#666666',
      opacity: 0.3
    }
  },
  interactions: [
    {
      name: 'Pan Interaction',
      steps: [
        { type: 'drag', target: 'canvas' }
      ],
      expectedOutcomes: [
        {
          description: 'Canvas should pan smoothly when dragging',
          screenshot: 'camera-pan-interaction.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 8000
          }
        }
      ]
    },
    {
      name: 'Zoom Interaction',
      steps: [
        { type: 'scroll', target: 'canvas' }
      ],
      expectedOutcomes: [
        {
          description: 'Canvas should zoom in/out with scroll wheel',
          screenshot: 'camera-zoom-interaction.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 10000
          }
        }
      ]
    }
  ],
  ergonomics: {
    minTouchTargetSize: 30,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 50
  }
};

// Layout Engine Specifications
export const LayoutEngineSpec: VisualSemanticsSpec = {
  component: 'LayoutEngine',
  elementId: 'layout-engine',
  states: {
    base: {
      color: '#444444'
    },
    processing: {
      color: '#ffff00',
      opacity: 0.8
    },
    completed: {
      color: '#00ff00',
      opacity: 1.0
    }
  },
  interactions: [
    {
      name: 'Layout Execution',
      steps: [
        { type: 'click', target: '#layout-button' }
      ],
      expectedOutcomes: [
        {
          description: 'Nodes should rearrange according to layout algorithm',
          screenshot: 'layout-execution.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000
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
    maxResponseTime: 500
  }
};

// HUD/Overlay Specifications
export const HUDSpec: VisualSemanticsSpec = {
  component: 'HeadsUpDisplay',
  elementId: 'hud-overlay',
  states: {
    base: {
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      fontSize: 14
    },
    visible: {
      opacity: 1.0
    },
    hidden: {
      opacity: 0.0
    }
  },
  interactions: [
    {
      name: 'HUD Toggle',
      steps: [
        { type: 'keyboard', target: 'document', params: { keys: 'h' } }
      ],
      expectedOutcomes: [
        {
          description: 'HUD should toggle visibility with H key',
          screenshot: 'hud-toggle-visibility.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000
          }
        }
      ]
    }
  ],
  ergonomics: {
    minTouchTargetSize: 20,
    minContrastRatio: 7.0,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 30
  }
};

// Selection Manager Specifications
export const SelectionManagerSpec: VisualSemanticsSpec = {
  component: 'SelectionManager',
  elementId: 'selection-manager',
  states: {
    base: {
      color: '#ffffff'
    },
    singleSelect: {
      color: '#ffff00',
      boxShadow: '0 0 10px #ffff00'
    },
    multiSelect: {
      color: '#ff00ff',
      boxShadow: '0 0 15px #ff00ff'
    },
    lassoSelect: {
      color: '#00ffff',
      boxShadow: '0 0 10px #00ffff'
    }
  },
  interactions: [
    {
      name: 'Single Selection',
      steps: [
        { type: 'click', target: 'canvas' }
      ],
      expectedOutcomes: [
        {
          description: 'Single element should be highlighted when clicked',
          screenshot: 'single-selection.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000
          }
        }
      ]
    },
    {
      name: 'Multi Selection',
      steps: [
        { type: 'keyboard', target: 'document', params: { keys: 'Control' } },
        { type: 'click', target: 'canvas' }
      ],
      expectedOutcomes: [
        {
          description: 'Multiple elements should be highlighted with Ctrl+Click',
          screenshot: 'multi-selection.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 8000
          }
        }
      ]
    },
    {
      name: 'Lasso Selection',
      steps: [
        { type: 'drag', target: 'canvas' }
      ],
      expectedOutcomes: [
        {
          description: 'Elements within lasso area should be selected',
          screenshot: 'lasso-selection.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 12000
          }
        }
      ]
    }
  ],
  ergonomics: {
    minTouchTargetSize: 25,
    minContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 100
  }
};

// Context Menu Specifications
export const ContextMenuSpec: VisualSemanticsSpec = {
  component: 'ContextMenu',
  elementId: 'context-menu',
  states: {
    base: {
      backgroundColor: '#222222',
      color: '#ffffff',
      fontSize: 14
    },
    open: {
      opacity: 1.0
    },
    closed: {
      opacity: 0.0
    }
  },
  interactions: [
    {
      name: 'Context Menu Open',
      steps: [
        { type: 'click', target: 'canvas', params: { button: 'right' } }
      ],
      expectedOutcomes: [
        {
          description: 'Context menu should appear on right-click',
          screenshot: 'context-menu-open.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 6000
          }
        }
      ]
    },
    {
      name: 'Context Menu Item Select',
      steps: [
        { type: 'click', target: 'canvas', params: { button: 'right' } },
        { type: 'click', target: '.context-menu-item' }
      ],
      expectedOutcomes: [
        {
          description: 'Context menu item should trigger action when clicked',
          screenshot: 'context-menu-item-select.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 7000
          }
        }
      ]
    }
  ],
  ergonomics: {
    minTouchTargetSize: 30,
    minContrastRatio: 7.0,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 150
  }
};

// Search/Filter Specifications
export const SearchFilterSpec: VisualSemanticsSpec = {
  component: 'SearchFilter',
  elementId: 'search-filter',
  states: {
    base: {
      backgroundColor: '#ffffff',
      color: '#000000',
      fontSize: 16
    },
    focused: {
      boxShadow: '0 0 5px #00ff00'
    },
    hasResults: {
      color: '#0000ff'
    }
  },
  interactions: [
    {
      name: 'Search Input',
      steps: [
        { type: 'click', target: '#search-input' },
        { type: 'keyboard', target: '#search-input', params: { keys: 'test' } }
      ],
      expectedOutcomes: [
        {
          description: 'Search results should appear as user types',
          screenshot: 'search-input-results.png',
          validation: {
            threshold: 0.15,
            maxDiffPixels: 8000
          }
        }
      ]
    },
    {
      name: 'Filter Application',
      steps: [
        { type: 'click', target: '#filter-dropdown' },
        { type: 'click', target: '.filter-option' }
      ],
      expectedOutcomes: [
        {
          description: 'Graph should update to show only filtered elements',
          screenshot: 'filter-application.png',
          validation: {
            threshold: 0.2,
            maxDiffPixels: 15000
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
    maxResponseTime: 200
  }
};

// Performance Overlay Specifications
export const PerformanceOverlaySpec: VisualSemanticsSpec = {
  component: 'PerformanceOverlay',
  elementId: 'performance-overlay',
  states: {
    base: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#ffffff',
      fontSize: 12
    },
    highPerformance: {
      color: '#00ff00'
    },
    mediumPerformance: {
      color: '#ffff00'
    },
    lowPerformance: {
      color: '#ff0000'
    }
  },
  interactions: [
    {
      name: 'Performance Display',
      steps: [
        { type: 'keyboard', target: 'document', params: { keys: 'p' } }
      ],
      expectedOutcomes: [
        {
          description: 'Performance metrics should display when P key is pressed',
          screenshot: 'performance-display.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 4000
          }
        }
      ]
    }
  ],
  ergonomics: {
    minTouchTargetSize: 20,
    minContrastRatio: 7.0,
    keyboardNavigation: true,
    screenReaderSupport: true,
    maxResponseTime: 30
  }
};

// Export all specs as a collection
export const ComprehensiveUISemanticsSpecs = {
  CameraControlsSpec,
  LayoutEngineSpec,
  HUDSpec,
  SelectionManagerSpec,
  ContextMenuSpec,
  SearchFilterSpec,
  PerformanceOverlaySpec
};