# Additional Layout Engines Specification

## Overview

This specification details the implementation of four additional layout engines mentioned in the README but not yet implemented: GridLayout, CircleLayout, ColumnLayout, and RowLayout.

## Current State

Currently implemented:
- **D3ForceLayout**: Force-directed layout using d3-force-3d
- **RandomLayout**: Random positioning layout

## Target Layout Engines

### 1. GridLayout

Arranges nodes in a 2D or 3D grid pattern.

#### Configuration
```typescript
interface GridLayoutSpec {
  type: 'grid';
  dimensions: 2 | 3; // 2D or 3D grid
  spacing: number; // Distance between nodes
  columns?: number; // Number of columns (auto-calculated if not specified)
  rows?: number; // Number of rows (auto-calculated if not specified)
  depth?: number; // Number of depth layers for 3D (auto-calculated if not specified)
  origin: { x: number; y: number; z: number }; // Starting position
  axisOrder: ['x' | 'y' | 'z', 'x' | 'y' | 'z', 'x' | 'y' | 'z']; // Traversal order
}
```

#### Implementation
```typescript
export class GridLayout implements ILayoutEngine {
  private graph!: SpaceGraph;
  private config!: GridLayoutSpec;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    
    createEffect(() => {
      this.arrangeNodes();
    });
  }

  private arrangeNodes(): void {
    const nodes = this.graph.state.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const config = this.getEffectiveConfig();
    const positions = this.calculateGridPositions(nodes.length, config);
    
    this.graph.setState(
      produce((s) => {
        for (let i = 0; i < nodes.length; i++) {
          const nodeIndex = s.data.nodes.findIndex(n => n.id === nodes[i].id);
          if (nodeIndex !== -1 && !this.isPinned(s.data.nodes[nodeIndex])) {
            s.data.nodes[nodeIndex] = {
              ...s.data.nodes[nodeIndex],
              position: positions[i]
            };
          }
        }
      })
    );
  }

  private calculateGridPositions(count: number, config: GridLayoutSpec): Array<{x: number, y: number, z: number}> {
    const positions: Array<{x: number, y: number, z: number}> = [];
    
    if (config.dimensions === 2) {
      const cols = config.columns ?? Math.ceil(Math.sqrt(count));
      const rows = config.rows ?? Math.ceil(count / cols);
      
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        positions.push({
          x: config.origin.x + (col - (cols - 1) / 2) * config.spacing,
          y: config.origin.y + (row - (rows - 1) / 2) * config.spacing,
          z: config.origin.z
        });
      }
    } else {
      // 3D grid
      const cols = config.columns ?? Math.cbrt(count);
      const rows = config.rows ?? Math.cbrt(count);
      const depth = config.depth ?? Math.ceil(count / (cols * rows));
      
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols) % rows;
        const dep = Math.floor(i / (cols * rows));
        
        positions.push({
          x: config.origin.x + (col - (cols - 1) / 2) * config.spacing,
          y: config.origin.y + (row - (rows - 1) / 2) * config.spacing,
          z: config.origin.z + (dep - (depth - 1) / 2) * config.spacing
        });
      }
    }
    
    return positions;
  }

  private isPinned(node: NodeSpec): boolean {
    return node.pinning !== undefined;
  }

  // ... other ILayoutEngine methods
}
```

### 2. CircleLayout

Arranges nodes in a circular or spherical pattern.

#### Configuration
```typescript
interface CircleLayoutSpec {
  type: 'circle';
  radius: number; // Circle/sphere radius
  dimensions: 2 | 3; // 2D circle or 3D sphere
  center: { x: number; y: number; z: number }; // Center position
  startAngle: number; // Starting angle in radians
  direction: 'clockwise' | 'counterclockwise';
  distribution: 'equal' | 'random'; // How to distribute nodes
}
```

#### Implementation
```typescript
export class CircleLayout implements ILayoutEngine {
  private graph!: SpaceGraph;
  private config!: CircleLayoutSpec;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    
    createEffect(() => {
      this.arrangeNodes();
    });
  }

  private arrangeNodes(): void {
    const nodes = this.graph.state.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const positions = this.calculateCirclePositions(nodes.length);
    
    this.graph.setState(
      produce((s) => {
        for (let i = 0; i < nodes.length; i++) {
          const nodeIndex = s.data.nodes.findIndex(n => n.id === nodes[i].id);
          if (nodeIndex !== -1 && !this.isPinned(s.data.nodes[nodeIndex])) {
            s.data.nodes[nodeIndex] = {
              ...s.data.nodes[nodeIndex],
              position: positions[i]
            };
          }
        }
      })
    );
  }

  private calculateCirclePositions(count: number): Array<{x: number, y: number, z: number}> {
    const positions: Array<{x: number, y: number, z: number}> = [];
    const config = this.getEffectiveConfig();
    
    if (config.dimensions === 2) {
      // 2D circle
      for (let i = 0; i < count; i++) {
        const angle = config.startAngle + (i / count) * 2 * Math.PI * 
                     (config.direction === 'clockwise' ? 1 : -1);
        
        positions.push({
          x: config.center.x + config.radius * Math.cos(angle),
          y: config.center.y + config.radius * Math.sin(angle),
          z: config.center.z
        });
      }
    } else {
      // 3D sphere - Fibonacci spiral distribution
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
      
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        
        positions.push({
          x: config.center.x + config.radius * Math.cos(theta) * radius,
          y: config.center.y + config.radius * y,
          z: config.center.z + config.radius * Math.sin(theta) * radius
        });
      }
    }
    
    return positions;
  }

  // ... other ILayoutEngine methods
}
```

### 3. ColumnLayout

Arranges nodes in vertical columns.

#### Configuration
```typescript
interface ColumnLayoutSpec {
  type: 'column';
  spacing: number; // Vertical spacing between nodes
  columns?: number; // Number of columns (auto-calculated if not specified)
  columnSpacing: number; // Horizontal spacing between columns
  origin: { x: number; y: number; z: number };
  maxNodesPerColumn?: number; // Maximum nodes per column
}
```

### 4. RowLayout

Arranges nodes in horizontal rows.

#### Configuration
```typescript
interface RowLayoutSpec {
  type: 'row';
  spacing: number; // Horizontal spacing between nodes
  rows?: number; // Number of rows (auto-calculated if not specified)
  rowSpacing: number; // Vertical spacing between rows
  origin: { x: number; y: number; z: number };
  maxNodesPerRow?: number; // Maximum nodes per row
}
```

## Implementation Strategy

### 1. Base Layout Class

Create a base class for all deterministic layouts:

```typescript
abstract class BaseDeterministicLayout implements ILayoutEngine {
  protected graph!: SpaceGraph;
  protected config!: any;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    
    createEffect(() => {
      this.arrangeNodes();
    });
  }

  protected abstract calculatePositions(nodes: NodeSpec[]): Array<{x: number, y: number, z: number}>;

  protected arrangeNodes(): void {
    const nodes = this.graph.state.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const positions = this.calculatePositions(nodes);
    
    this.graph.setState(
      produce((s) => {
        for (let i = 0; i < nodes.length; i++) {
          const nodeIndex = s.data.nodes.findIndex(n => n.id === nodes[i].id);
          if (nodeIndex !== -1 && !this.isPinned(s.data.nodes[nodeIndex])) {
            s.data.nodes[nodeIndex] = {
              ...s.data.nodes[nodeIndex],
              position: positions[i]
            };
          }
        }
      })
    );
  }

  protected isPinned(node: NodeSpec): boolean {
    return node.pinning !== undefined;
  }

  // Default implementations for other ILayoutEngine methods
  public onTick(): void { /* No continuous updates needed */ }
  public tick(iterations = 1): void { /* No simulation needed */ }
  public resume(): void { /* Nothing to resume */ }
  public pause(): void { /* Nothing to pause */ }
  public reheat(): void { /* Nothing to reheat */ }
  public dispose(): void { /* Nothing to dispose */ }
}
```

### 2. Registration

Update the layout registration in `SpaceGraph.ts`:

```typescript
// In SpaceGraph constructor or static initialization
SpaceGraph.registerLayout('grid', GridLayout);
SpaceGraph.registerLayout('circle', CircleLayout);
SpaceGraph.registerLayout('column', ColumnLayout);
SpaceGraph.registerLayout('row', RowLayout);
```

### 3. Type Updates

Update the TypeScript types in `src/types.ts`:

```typescript
export type LayoutSpec = 
  | ForceDirectedLayoutSpec 
  | RandomLayoutSpec
  | GridLayoutSpec
  | CircleLayoutSpec
  | ColumnLayoutSpec
  | RowLayoutSpec;
```

## Usage Examples

```javascript
// Grid layout
const spec = {
  layout: {
    type: 'grid',
    dimensions: 2,
    spacing: 5,
    columns: 4,
    origin: { x: 0, y: 0, z: 0 }
  }
};

// Circle layout
const spec = {
  layout: {
    type: 'circle',
    radius: 10,
    dimensions: 3,
    center: { x: 0, y: 0, z: 0 },
    startAngle: 0
  }
};

// Column layout
const spec = {
  layout: {
    type: 'column',
    spacing: 3,
    columns: 2,
    columnSpacing: 8,
    origin: { x: 0, y: 0, z: 0 },
    maxNodesPerColumn: 5
  }
};

// Row layout
const spec = {
  layout: {
    type: 'row',
    spacing: 4,
    rows: 3,
    rowSpacing: 6,
    origin: { x: 0, y: 0, z: 0 },
    maxNodesPerRow: 6
  }
};
```

## Testing Strategy

### Unit Tests
- Test position calculations for each layout type
- Verify pinning behavior (pinned nodes should not move)
- Test edge cases (empty graphs, single node, many nodes)
- Verify configuration validation

### Integration Tests
- Test layout switching between different types
- Verify interaction with other systems (rendering, interaction)
- Test performance with large numbers of nodes

### Visual Tests
- Create reference images for each layout type
- Test visual consistency across different node counts
- Verify 2D vs 3D positioning accuracy

## Performance Considerations

- All layouts should be O(n) complexity for n nodes
- Position calculations should be done in batches for large graphs
- Consider throttling updates for very large graphs (>1000 nodes)
- Cache calculations when possible (e.g., grid dimensions)

## Future Enhancements

1. **Hierarchical Layouts**: Tree and organizational chart layouts
2. **Force-Based Variants**: Different force models (attractive, repulsive)
3. **Custom Layouts**: User-defined layout algorithms
4. **Layout Animation**: Smooth transitions between different layouts
5. **Layout Constraints**: Minimum distances, alignment rules
6. **Dynamic Layouts**: Layouts that adapt to data changes over time