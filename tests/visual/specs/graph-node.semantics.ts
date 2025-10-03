import { VisualSemanticsSpec } from '../visual-semantics-controller';

/**
 * Visual Semantics Specification for Graph Nodes
 *
 * This specification defines the expected visual behavior and ergonomics
 * for different types of graph nodes in SpaceGraphJS.
 */

export const SphereNodeSpec: VisualSemanticsSpec = {
  component: 'SphereNode',
  elementId: 'sphere-node',
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
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Sphere node should glow when hovered',
          screenshot: 'sphere-node-hover.png',
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
          description: 'Sphere node should have selection highlight',
          screenshot: 'sphere-node-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
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

export const BoxNodeSpec: VisualSemanticsSpec = {
  component: 'BoxNode',
  elementId: 'box-node',
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
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Box node should glow when hovered',
          screenshot: 'box-node-hover.png',
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
          description: 'Box node should have selection highlight',
          screenshot: 'box-node-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 5000,
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

export const TextNodeSpec: VisualSemanticsSpec = {
  component: 'TextNode',
  elementId: 'text-node',
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
  },
  interactions: [
    {
      name: 'Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Text node should have background when hovered',
          screenshot: 'text-node-hover.png',
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
          description: 'Text node should have selection background',
          screenshot: 'text-node-selected.png',
          validation: {
            threshold: 0.1,
            maxDiffPixels: 3000,
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

export const EdgeSpec: VisualSemanticsSpec = {
  component: 'GraphEdge',
  elementId: 'graph-edge',
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
  },
  interactions: [
    {
      name: 'Edge Hover Interaction',
      steps: [{ type: 'hover', target: 'canvas' }],
      expectedOutcomes: [
        {
          description: 'Edge should thicken and change color when hovered',
          screenshot: 'edge-hover.png',
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
          screenshot: 'edge-selected.png',
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

// Export all specs as a collection
export const GraphNodeSemanticsSpecs = {
  SphereNodeSpec,
  BoxNodeSpec,
  TextNodeSpec,
  EdgeSpec,
};
