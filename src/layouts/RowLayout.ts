import { createEffect } from 'solid-js';
import { produce } from 'solid-js/store';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine, NodeSpec, RowLayoutSpec } from '../types';

/**
 * RowLayout - Arranges nodes in horizontal rows
 */
export class RowLayout implements ILayoutEngine {
  private graph!: SpaceGraph;
  private config!: RowLayoutSpec;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    
    // Set default configuration with proper type checking
    const layoutConfig = this.graph.state.layout;
    if (layoutConfig.type === 'row') {
      this.config = {
        type: 'row',
        spacing: layoutConfig.spacing ?? 4,
        rows: layoutConfig.rows,
        rowSpacing: layoutConfig.rowSpacing ?? 6,
        origin: layoutConfig.origin ?? { x: 0, y: 0, z: 0 },
        maxNodesPerRow: layoutConfig.maxNodesPerRow
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
    const nodes = this.graph.state.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const positions = this.calculateRowPositions(nodes.length);
    
    // Update node positions using the reactive state update mechanism
    this.graph.updateStateWithProducer(
      produce((s) => {
        const updatedNodes = [...s.data.nodes];
        let positionIndex = 0; // Track position index for non-pinned nodes
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const nodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
          if (nodeIndex !== -1) {
            if (this.isPinned(node)) {
              // For pinned nodes, use the pinning position if available
              if (node.pinning && typeof node.pinning === 'object') {
                updatedNodes[nodeIndex] = {
                  ...updatedNodes[nodeIndex],
                  position: { ...node.pinning }
                };
              }
            } else {
              // For non-pinned nodes, use calculated positions
              updatedNodes[nodeIndex] = {
                ...updatedNodes[nodeIndex],
                position: positions[positionIndex]
              };
              positionIndex++; // Only increment for non-pinned nodes
            }
          }
        }
        s.data.nodes = updatedNodes;
      })
    );
  }

  private calculateRowPositions(count: number): Array<{x: number, y: number, z: number}> {
    const positions: Array<{x: number, y: number, z: number}> = [];
    const config = this.config;
    
    // Use non-null assertion since we know these have defaults from init()
    const spacing = config.spacing!;
    const rowSpacing = config.rowSpacing!;
    const origin = config.origin!;
    
    // Calculate number of rows and nodes per row
    const maxPerRow = config.maxNodesPerRow ?? count;
    const rows = config.rows ?? Math.ceil(count / maxPerRow);
    const nodesPerRow = Math.ceil(count / rows);
    
    // Calculate total width needed
    const totalWidth = (nodesPerRow - 1) * spacing;
    const totalHeight = (rows - 1) * rowSpacing;
    
    for (let i = 0; i < count; i++) {
      const rowIndex = Math.floor(i / nodesPerRow);
      const colIndex = i % nodesPerRow;
      
      // Calculate position with centering
      const x = origin.x + (colIndex - (nodesPerRow - 1) / 2) * spacing;
      const y = origin.y + (rowIndex - (rows - 1) / 2) * rowSpacing;
      const z = origin.z;
      
      positions.push({ x, y, z });
    }
    
    return positions;
  }

  private isPinned(node: NodeSpec): boolean {
    return node.pinning !== undefined;
  }

  public onTick(): void {
    // Row layout doesn't need continuous updates
  }

  public tick(iterations = 1): void {
    // Row layout doesn't need continuous updates
  }

  public resume(): void {
    // Row layout doesn't need to be resumed
  }

  public pause(): void {
    // Row layout doesn't need to be paused
  }

  public reheat(): void {
    // Row layout doesn't need reheating
  }

  public dispose(): void {
    // Nothing to dispose for row layout
  }
}