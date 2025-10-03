# Edge Interaction - Consolidated Documentation

## Overview

The edge interaction system in SpaceGraphJS enables users to interact with edges in the graph visualization through
hover, click, and selection operations. This system provides a comprehensive set of features for creating rich,
interactive graph experiences.

## Features

### 1. Edge Hover Interaction

Users can hover over edges to visually highlight them and trigger hover events.

#### Visual Feedback

- Edges change appearance when hovered over
- Configurable styling through the `edge:hover` style specification
- Default hover effect increases edge width and opacity

#### Events

- `edge:hover:enter` - Fired when mouse enters an edge
- `edge:hover:leave` - Fired when mouse leaves an edge

### 2. Edge Selection

Users can select edges through clicking, with support for multi-selection using modifier keys.

#### Single Selection

- Clicking an edge selects it exclusively
- Previously selected edges are deselected
- Visual feedback through the `edge:selected` style

#### Multi-Selection

- Ctrl+Click (Windows/Linux) or Cmd+Click (Mac) toggles edge selection
- Allows selecting multiple edges simultaneously
- Visual feedback for all selected edges

#### Events

- `edge:click` - Fired when an edge is clicked
- `edge:select` - Fired when an edge is selected
- `edge:multi-select` - Fired when multiple edges are selected

### 3. Edge Styling

Edges support customizable styling for different interaction states.

#### Style Properties

```typescript
interface EdgeStyle {
  color?: string; // Edge color
  width?: number; // Edge width
  opacity?: number; // Edge opacity
  glow?: {
    // Glow effect
    color: string;
    strength: number;
  };
  label?: {
    // Label styling
    color: string;
    fontSize: number;
    fontFamily: string;
    backgroundColor?: string;
    padding?: number;
  };
}
```

#### Style States

- `edge:hover` - Applied when edge is hovered
- `edge:selected` - Applied when edge is selected
- `edge:source-selected` - Applied when source node is selected
- `edge:target-selected` - Applied when target node is selected
- `edge:both-selected` - Applied when both nodes are selected

### 4. Edge Types

Support for different edge visualization types with interaction support.

#### Straight Edges

- Direct connection between nodes
- Basic hover and selection support

#### Curved Edges

- Quadratic bezier curves for visual distinction
- Configurable curvature parameter
- Full interaction support

#### Dashed Edges

- Dashed line pattern
- Configurable dash and gap sizes
- Full interaction support

## Implementation Details

### EdgeRenderer

The `EdgeRenderer` class handles the visual representation and interaction state of edges.

#### Key Methods

- `setEdgeHover(edgeId: string, hovered: boolean)` - Sets hover state
- `setEdgeSelected(edgeId: string, selected: boolean)` - Sets selection state
- `getRaycastableObjects(): THREE.Object3D[]` - Returns objects for raycasting
- `updateEdges()` - Updates all edges based on current state

#### Hit Detection

- Each edge has an invisible "hit area" for easier interaction
- Hit areas are thicker than visual representations
- Raycasting prioritizes edges over nodes

### InteractionPlugin

The `InteractionPlugin` handles user input and translates it to edge interactions.

#### Key Methods

- `getIntersectedElement(event: MouseEvent)` - Determines what was clicked
- `handleEdgeClick()` - Processes edge click events
- `onHover()` - Handles hover state changes
- `selectEdge()` / `deselectEdge()` - Manages edge selection

## API Usage

### Event Listeners

```javascript
// Listen for edge click events
graph.on('edge:click', ({ target, event, sourceNode, targetNode }) => {
  console.log('Edge clicked:', target.id);
});

// Listen for edge hover events
graph.on('edge:hover:enter', ({ target, sourceNode, targetNode }) => {
  console.log('Edge hover enter:', target.id);
});

// Listen for edge selection events
graph.on('edge:select', ({ target, sourceNode, targetNode }) => {
  console.log('Edge selected:', target.id);
});
```

### Styling Configuration

```javascript
const spec = {
  style: {
    'edge:hover': {
      color: '#ffffff',
      width: 5,
      opacity: 1.0,
    },
    'edge:selected': {
      color: '#ffffff',
      width: 6,
      opacity: 1.0,
      glow: {
        color: '#ffffff',
        strength: 0.5,
      },
    },
    'edge:source-selected': {
      color: '#ffaa00',
      width: 4,
      opacity: 0.9,
    },
    'edge:target-selected': {
      color: '#00aaff',
      width: 4,
      opacity: 0.9,
    },
    'edge:both-selected': {
      color: '#ff00ff',
      width: 5,
      opacity: 1.0,
    },
  },
};
```

## Edge Editing

The system supports interactive editing of curved edges:

### Curved Edge Editing

- Right-click on a curved edge to enter edit mode
- Drag the yellow handle to adjust the curve
- Right-click again to exit edit mode

### API for Edge Editing

```javascript
// Programmatically edit an edge path
graph.update({
  data: {
    edges: {
      update: [
        {
          id: 'edge-1',
          curvature: 0.8, // Adjust curvature
        },
      ],
    },
  },
});
```

## Performance Considerations

### Raycasting Optimization

- Edge hit areas are only created when needed
- Efficient spatial partitioning for large graphs
- Throttled hover detection to prevent performance issues

### Memory Management

- Proper disposal of edge geometries and materials
- Reuse of materials where possible
- Cleanup of event listeners on destruction

### Rendering Optimization

- Geometry caching to avoid recreation on every update
- Efficient hit area handling
- Batched updates for multiple edge changes

## Testing

### Unit Tests

- Edge hover state management
- Edge selection functionality
- Multi-selection behavior
- Event emission
- Style application

### Integration Tests

- Edge interaction with node interaction
- Complex graph scenarios
- Performance with large numbers of edges

## Future Enhancements

### Edge Context Menu

- Right-click context menu for edges
- Customizable menu options
- Plugin support for additional actions

### Edge Labels

- Interactive edge labels
- Editable labels
- Rich text support

### Edge Annotations

- Custom annotations along edges
- Tooltips and popups
- Rich media integration

## Best Practices

### For Developers

1. **Consistent Event Naming**: Follow the established naming conventions
2. **Proper Disposal**: Always clean up resources and event listeners
3. **Performance Monitoring**: Profile edge interaction performance regularly
4. **Accessibility**: Ensure keyboard navigation and screen reader support

### For Users

1. **Appropriate Styling**: Use clear visual distinctions for different states
2. **Responsive Feedback**: Provide immediate feedback for user actions
3. **Contextual Help**: Offer guidance for complex interactions
4. **Progressive Enhancement**: Start with basic interactions and add complexity

## Example Implementation

```javascript
import {
  CameraPlugin,
  HUDPlugin,
  InteractionPlugin,
  LayoutPlugin,
  SpaceGraph,
  Spec,
  NodeSpec,
  EdgeSpec,
} from 'spacegraphjs';

// Create nodes
const nodes: NodeSpec[] = [
  {
    id: 'node-1',
    type: 'sphere',
    position: { x: -10, y: 0, z: 0 },
    color: '#ff0000',
    label: 'Node 1'
  },
  {
    id: 'node-2',
    type: 'box',
    position: { x: 10, y: 0, z: 0 },
    color: '#00ff00',
    label: 'Node 2'
  }
];

// Create edges with different types
const edges: EdgeSpec[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    color: '#ff0000',
    width: 3,
    type: 'straight',
    label: 'Straight Edge'
  },
  {
    id: 'edge-2',
    source: 'node-1',
    target: 'node-2',
    color: '#00ff00',
    width: 2,
    type: 'curved',
    curvature: 0.5,
    label: 'Curved Edge'
  },
  {
    id: 'edge-3',
    source: 'node-1',
    target: 'node-2',
    color: '#0000ff',
    width: 4,
    type: 'dashed',
    dashSize: 0.5,
    gapSize: 0.3,
    label: 'Dashed Edge'
  }
];

const spec: Spec = {
  data: {
    nodes,
    edges,
  },
  style: {
    'node:hover': {
      color: '#ffffff',
      glow: {
        color: '#ffffff',
        strength: 0.8
      }
    },
    'node:selected': {
      color: '#ffffff',
      glow: {
        color: '#ffffff',
        strength: 1.0
      }
    },
    'edge:hover': {
      color: '#ffffff',
      width: 5,
      opacity: 1.0
    },
    'edge:selected': {
      color: '#ffffff',
      width: 6,
      opacity: 1.0,
      glow: {
        color: '#ffffff',
        strength: 0.5
      }
    }
  },
  layout: {
    type: 'force-directed',
    charge: -30,
    linkDistance: 20,
  },
  camera: {
    target: { x: 0, y: 0, z: 0 },
    phi: Math.PI / 4,
    theta: Math.PI / 4,
    distance: 50,
  },
  controls: {
    keyboard: {
      enabled: true,
      panSpeed: 0.1,
      zoomSpeed: 0.1,
      orbitSpeed: 0.1,
    },
  },
  performance: {
    instancingThreshold: 100,
  },
  interaction: {
    hoveredElementId: null,
    selectedElementIds: [],
  },
};

const plugins = [
  new LayoutPlugin(),
  new CameraPlugin(),
  new InteractionPlugin(),
  new HUDPlugin(),
];

const graph = new SpaceGraph('#container', spec, plugins);

// Add event listeners to demonstrate edge interaction
graph.on('edge:click', ({ target, event, sourceNode, targetNode }) => {
  console.log('Edge clicked:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
  console.log('Event:', event);
});

graph.on('edge:hover:enter', ({ target, sourceNode, targetNode }) => {
  console.log('Edge hover enter:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
});

graph.on('edge:hover:leave', ({ target, sourceNode, targetNode }) => {
  console.log('Edge hover leave:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
});

graph.on('edge:select', ({ target, sourceNode, targetNode }) => {
  console.log('Edge selected:', target.id);
  console.log('Source node:', sourceNode.id);
  console.log('Target node:', targetNode.id);
});

// Expose graph to window for easy debugging and testing
(window as any).graph = graph;
```
