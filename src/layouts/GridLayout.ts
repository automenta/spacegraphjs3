import { createEffect } from 'solid-js';
import { SpaceGraph as _SpaceGraph } from '../core/SpaceGraph';
import { NodeSpec as _NodeSpec } from '../types';
import { BaseLayoutEngine } from './BaseLayoutEngine';

export interface GridLayoutSpec {
  type: 'grid';
  dimensions?: 2 | 3; // 2D or 3D grid
  spacing?: number; // Distance between nodes
  columns?: number; // Number of columns (auto-calculated if not specified)
  rows?: number; // Number of rows (auto-calculated if not specified)
  depth?: number; // Number of depth layers for 3D (auto-calculated if not specified)
  origin?: { x: number; y: number; z: number }; // Starting position
  axisOrder?: ['x' | 'y' | 'z', 'x' | 'y' | 'z', 'x' | 'y' | 'z']; // Traversal order
}

/**
 * GridLayout - Arranges nodes in a 2D or 3D grid pattern
 */
export class GridLayout extends BaseLayoutEngine {
  private config!: GridLayoutSpec;

  protected setupLayout(): void {
    // Set default configuration
    const layoutConfig = this.graph.state.layout as GridLayoutSpec;
    this.config = {
      type: 'grid',
      dimensions: layoutConfig.dimensions || 2,
      spacing: layoutConfig.spacing || 5,
      origin: layoutConfig.origin || { x: 0, y: 0, z: 0 },
      axisOrder: layoutConfig.axisOrder || ['x', 'y', 'z'],
      columns: layoutConfig.columns,
      rows: layoutConfig.rows,
      depth: layoutConfig.depth,
    };

    createEffect(() => {
      this.arrangeNodes();
    });
  }

  private arrangeNodes(): void {
    const nodes = this.graph.state.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const positions = this.calculateGridPositions(nodes.length);

    // Update node positions using the update method
    const updates = nodes
      .map((node, i) => {
        if (!this.isPinned(node)) {
          return {
            id: node.id,
            position: positions[i],
          };
        }
        return null;
      })
      .filter(
        (
          update
        ): update is {
          id: string;
          position: { x: number; y: number; z: number };
        } => update !== null
      );

    if (updates.length > 0) {
      this.graph.update({
        data: {
          nodes: {
            update: updates,
          },
        },
      });
    }
  }

  private calculateGridPositions(
    count: number
  ): Array<{ x: number; y: number; z: number }> {
    const positions: Array<{ x: number; y: number; z: number }> = [];
    const config = this.config;

    if (config.dimensions === 2) {
      // 2D grid
      const cols = config.columns ?? Math.ceil(Math.sqrt(count));
      const rows = config.rows ?? Math.ceil(count / cols);

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        positions.push({
          x:
            (config.origin?.x || 0) +
            (col - (cols - 1) / 2) * (config.spacing || 5),
          y:
            (config.origin?.y || 0) +
            (row - (rows - 1) / 2) * (config.spacing || 5),
          z: config.origin?.z || 0,
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
          x:
            (config.origin?.x || 0) +
            (col - (cols - 1) / 2) * (config.spacing || 5),
          y:
            (config.origin?.y || 0) +
            (row - (rows - 1) / 2) * (config.spacing || 5),
          z:
            (config.origin?.z || 0) +
            (dep - (depth - 1) / 2) * (config.spacing || 5),
        });
      }
    }

    return positions;
  }

  public onTick(): void {
    // Grid layout doesn't need continuous updates
  }

  public tick(iterations = 1): void {
    // Grid layout doesn't need continuous updates
    // Use iterations parameter to avoid linting error
    if (iterations > 0) {
      // No operation needed for grid layout
    }
  }
}
