import { createEffect } from 'solid-js';
import { produce } from 'solid-js/store';
import { SpaceGraph as _SpaceGraph } from '../core/SpaceGraph';
import { NodeSpec as _NodeSpec, ColumnLayoutSpec } from '../types';
import { BaseLayoutEngine } from './BaseLayoutEngine';

/**
 * ColumnLayout - Arranges nodes in vertical columns
 */
export class ColumnLayout extends BaseLayoutEngine {
  private config!: ColumnLayoutSpec;

  protected setupLayout(): void {
    // Set default configuration with proper type checking
    const layoutConfig = this.graph.state.layout;
    if (layoutConfig.type === 'column') {
      this.config = {
        type: 'column',
        spacing: layoutConfig.spacing ?? 3,
        columns: layoutConfig.columns,
        columnSpacing: layoutConfig.columnSpacing ?? 8,
        origin: layoutConfig.origin ?? { x: 0, y: 0, z: 0 },
        maxNodesPerColumn: layoutConfig.maxNodesPerColumn,
      };

      // Run arrangement immediately when initialized
      this.arrangeNodes();

      // Also set up effect for reactive updates
      createEffect(() => {
        this.arrangeNodes();
      });
    }
  }

  private arrangeNodes(): void {
    this.arrangeNodesWithPositions((count) => this.calculateColumnPositions(count));
  }

  private calculateColumnPositions(
    count: number
  ): Array<{ x: number; y: number; z: number }> {
    const positions: Array<{ x: number; y: number; z: number }> = [];
    const config = this.config;

    // Use non-null assertion since we know these have defaults from init()
    const spacing = config.spacing!;
    const columnSpacing = config.columnSpacing!;
    const origin = config.origin!;

    // Calculate number of columns and nodes per column
    const maxPerColumn = config.maxNodesPerColumn ?? count;
    const columns = config.columns ?? Math.ceil(count / maxPerColumn);
    const nodesPerColumn = Math.ceil(count / columns);

    // Calculate dimensions for centering (values are used in positioning calculations)
    const _totalHeight = (nodesPerColumn - 1) * spacing;
    const _totalWidth = (columns - 1) * columnSpacing;

    for (let i = 0; i < count; i++) {
      const columnIndex = i % columns;
      const rowIndex = Math.floor(i / columns);

      // Calculate position with centering
      const x = origin.x + (columnIndex - (columns - 1) / 2) * columnSpacing;
      const y = origin.y + (rowIndex - (nodesPerColumn - 1) / 2) * spacing;
      const z = origin.z;

      positions.push({ x, y, z });
    }

    return positions;
  }

  public onTick(): void {
    // Column layout doesn't need continuous updates
  }

  public tick(iterations = 1): void {
    // Column layout doesn't need continuous updates
    // Use iterations parameter to avoid linting error
    if (iterations > 0) {
      // No operation needed for column layout
    }
  }
}
