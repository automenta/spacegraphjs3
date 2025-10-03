# Layout Engines - Consolidated Documentation

## Overview

SpaceGraphJS provides six different layout engines for arranging nodes in your graph visualization. Each layout engine
serves different purposes and offers unique advantages depending on your data and visualization needs.

## Implemented Layout Engines

### 1. Force-Directed Layout (D3ForceLayout)

A physics-based layout that simulates forces between nodes to create organic-looking graphs.

#### Features

- Uses D3's force-directed algorithm with 3D support
- Configurable charge, link distance, and link strength parameters
- Continuous simulation that stabilizes over time
- Supports node pinning to fix positions
- Optimized for performance with incremental updates

#### Configuration

```typescript
interface ForceDirectedLayoutSpec {
  type: 'force-directed';
  charge?: number;        // Repulsive force between nodes (default: -30)
  linkDistance?: number;  // Optimal distance between linked nodes (default: 30)
  linkStrength?: number;  // Strength of the link force (default: 1)
}
```

#### Performance Optimizations

- Incremental updates that only refresh when significant changes occur
- Efficient data structures for node/link lookups
- Batched state updates to reduce re-renders
- Object reuse to minimize garbage collection pressure
- Change detection with thresholds to avoid unnecessary updates

#### Usage Example

```javascript
const spec = {
  layout: {
    type: 'force-directed',
    charge: -50,
    linkDistance: 20,
    linkStrength: 0.5
  }
};
```

### 2. Grid Layout (GridLayout)

Arranges nodes in a 2D or 3D grid pattern for structured layouts.

#### Features

- Supports both 2D and 3D grid arrangements
- Configurable spacing between nodes
- Automatic calculation of rows/columns/depth or manual specification
- Origin positioning control
- Axis ordering configuration

#### Configuration

```typescript
interface GridLayoutSpec {
  type: 'grid';
  dimensions?: 2 | 3;                    // 2D or 3D grid (default: 2)
  spacing?: number;                      // Distance between nodes (default: 5)
  columns?: number;                      // Number of columns (auto-calculated if not specified)
  rows?: number;                         // Number of rows (auto-calculated if not specified)
  depth?: number;                        // Number of depth layers for 3D (auto-calculated if not specified)
  origin?: { x: number; y: number; z: number }; // Starting position (default: { x: 0, y: 0, z: 0 })
  axisOrder?: ['x' | 'y' | 'z', 'x' | 'y' | 'z', 'x' | 'y' | 'z']; // Traversal order (default: ['x', 'y', 'z'])
}
```

#### Usage Example

```javascript
const spec = {
  layout: {
    type: 'grid',
    dimensions: 2,
    spacing: 5,
    columns: 4,
    origin: { x: 0, y: 0, z: 0 }
  }
};
```

### 3. Circle Layout (CircleLayout)

Arranges nodes in a circular or spherical pattern.

#### Features

- Supports both 2D circles and 3D spheres
- Configurable radius and center position
- Direction control (clockwise/counterclockwise)
- Two distribution methods: equal spacing or random placement
- Works well for showing hierarchical or cyclic relationships

#### Configuration

```typescript
interface CircleLayoutSpec {
  type: 'circle';
  radius?: number;                       // Circle/sphere radius (default: 10)
  dimensions?: 2 | 3;                    // 2D circle or 3D sphere (default: 2)
  center?: { x: number; y: number; z: number }; // Center position (default: { x: 0, y: 0, z: 0 })
  startAngle?: number;                   // Starting angle in radians (default: 0)
  direction?: 'clockwise' | 'counterclockwise'; // Direction of node placement (default: 'clockwise')
  distribution?: 'equal' | 'random';     // How to distribute nodes (default: 'equal')
}
```

#### Usage Example

```javascript
const spec = {
  layout: {
    type: 'circle',
    radius: 15,
    dimensions: 3,
    center: { x: 0, y: 0, z: 0 },
    startAngle: Math.PI / 2
  }
};
```

### 4. Column Layout (ColumnLayout)

Arranges nodes in vertical columns for structured vertical organization.

#### Features

- Vertical arrangement in columns
- Configurable vertical spacing and column spacing
- Control over maximum nodes per column
- Origin positioning
- Automatically balances columns

#### Configuration

```typescript
interface ColumnLayoutSpec {
  type: 'column';
  spacing?: number;                      // Vertical spacing between nodes (default: 3)
  columns?: number;                      // Number of columns (auto-calculated if not specified)
  columnSpacing?: number;                // Horizontal spacing between columns (default: 8)
  origin?: { x: number; y: number; z: number }; // Starting position (default: { x: 0, y: 0, z: 0 })
  maxNodesPerColumn?: number;            // Maximum nodes per column (no limit if not specified)
}
```

#### Usage Example

```javascript
const spec = {
  layout: {
    type: 'column',
    spacing: 4,
    columns: 3,
    columnSpacing: 10,
    origin: { x: 0, y: 0, z: 0 }
  }
};
```

### 5. Row Layout (RowLayout)

Arranges nodes in horizontal rows for structured horizontal organization.

#### Features

- Horizontal arrangement in rows
- Configurable horizontal spacing and row spacing
- Control over maximum nodes per row
- Origin positioning
- Automatically balances rows

#### Configuration

```typescript
interface RowLayoutSpec {
  type: 'row';
  spacing?: number;                      // Horizontal spacing between nodes (default: 4)
  rows?: number;                         // Number of rows (auto-calculated if not specified)
  rowSpacing?: number;                   // Vertical spacing between rows (default: 6)
  origin?: { x: number; y: number; z: number }; // Starting position (default: { x: 0, y: 0, z: 0 })
  maxNodesPerRow?: number;               // Maximum nodes per row (no limit if not specified)
}
```

#### Usage Example

```javascript
const spec = {
  layout: {
    type: 'row',
    spacing: 5,
    rows: 2,
    rowSpacing: 8,
    origin: { x: 0, y: 0, z: 0 }
  }
};
```

### 6. Random Layout (RandomLayout)

Places nodes at random positions for initial layouts or special effects.

#### Features

- Simple random positioning
- No configuration options needed
- Good for initial layouts before applying other layouts
- Fast execution

#### Configuration

```typescript
interface RandomLayoutSpec {
  type: 'random';
  // Random layout doesn't have specific properties
}
```

#### Usage Example

```javascript
const spec = {
  layout: {
    type: 'random'
  }
};
```

## Layout Engine Architecture

### BaseLayoutEngine

All layout engines inherit from the `BaseLayoutEngine` abstract class, which provides common functionality:

- Initialization and disposal management
- Pause/resume functionality
- Reheat simulation capability
- Consistent interface for all layout engines

### Layout Registration

Layout engines are registered with the SpaceGraph class and can be easily extended:

```typescript
SpaceGraph.registerLayout('custom-layout', CustomLayoutEngine);
```

## Performance Considerations

### For Large Graphs

1. **Choose Appropriate Layouts**: Grid, circle, column, and row layouts are generally faster than force-directed
   layouts
2. **Use Pinning**: Pin nodes to reduce computation in force-directed layouts
3. **Pause When Idle**: Pause layouts when not actively needed
4. **Configure Parameters**: Tune layout parameters for optimal performance

### Optimization Techniques

1. **Incremental Updates**: Layouts only update when significant changes occur
2. **Object Reuse**: Existing objects are preserved when possible
3. **Batched Updates**: Related updates are grouped together
4. **Efficient Data Structures**: Maps and other efficient structures are used for lookups

## Best Practices

### For Layout Engine Developers

1. **Implement Change Detection**: Only update when necessary
2. **Reuse Objects**: Preserve existing objects when possible
3. **Batch Updates**: Group related updates together
4. **Profile Performance**: Regularly profile layout performance
5. **Consider Memory**: Minimize object creation and retention

### For Users

1. **Choose Appropriate Layouts**: Select layouts based on data characteristics
2. **Configure Parameters**: Tune layout parameters for optimal performance
3. **Monitor Performance**: Watch for performance issues with large datasets
4. **Use Pinning**: Pin nodes to reduce layout computation
5. **Pause When Idle**: Pause layouts when not actively needed

## Extending Layout Engines

Creating custom layout engines is straightforward:

1. Extend the `BaseLayoutEngine` class
2. Implement the required abstract methods
3. Register your layout with `SpaceGraph.registerLayout()`

Example custom layout:

```typescript
class CustomLayout extends BaseLayoutEngine {
  protected setupLayout(): void {
    // Setup your layout
  }
  
  public tick(iterations = 1): void {
    // Implement layout algorithm
  }
}

SpaceGraph.registerLayout('custom', CustomLayout);