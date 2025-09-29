# Edge Interaction Specification

## Overview

This document specifies the edge interaction functionality for SpaceGraphJS, enabling users to interact with edges in the graph visualization through hover, click, and selection operations.

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
  color?: string;           // Edge color
  width?: number;           // Edge width
  opacity?: number;         // Edge opacity
  glow?: {                  // Glow effect
    color: string;
    strength: number;
  };
  label?: {                 // Label styling
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
  }
};
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

## Conclusion

The edge interaction system provides a comprehensive set of features for interacting with edges in SpaceGraphJS visualizations. With support for hover, selection, and customizable styling, users can create rich, interactive graph experiences.