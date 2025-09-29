import { createEffect } from 'solid-js';
import { produce } from 'solid-js/store';
import { SpaceGraph } from '../core/SpaceGraph';
import { ILayoutEngine, NodeSpec, CircleLayoutSpec } from '../types';

/**
 * CircleLayout - Arranges nodes in a circular or spherical pattern
 */
export class CircleLayout implements ILayoutEngine {
  private graph!: SpaceGraph;
  private config!: CircleLayoutSpec;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    
    // Set default configuration with proper type checking
    const layoutConfig = this.graph.state.layout;
    if (layoutConfig.type === 'circle') {
      this.config = {
        type: 'circle',
        radius: layoutConfig.radius ?? 10,
        dimensions: layoutConfig.dimensions ?? 2,
        center: layoutConfig.center ?? { x: 0, y: 0, z: 0 },
        startAngle: layoutConfig.startAngle ?? 0,
        direction: layoutConfig.direction ?? 'clockwise',
        distribution: layoutConfig.distribution ?? 'equal'
      };

      console.log('CircleLayout: Initializing with config:', this.config);

      // Run arrangement immediately when initialized
      this.arrangeNodes();
      
      // Also set up effect for reactive updates
      createEffect(() => {
        console.log('CircleLayout: arrangeNodes effect triggered');
        this.arrangeNodes();
      });
    }
  }

  private arrangeNodes(): void {
    const nodes = this.graph.state.data?.nodes ?? [];
    console.log('CircleLayout: arrangeNodes called with', nodes.length, 'nodes');
    if (nodes.length === 0) return;

    const positions = this.calculateCirclePositions(nodes.length);
    console.log('CircleLayout: calculated positions:', positions);
    
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

  private calculateCirclePositions(count: number): Array<{x: number, y: number, z: number}> {
    const positions: Array<{x: number, y: number, z: number}> = [];
    const config = this.config;
    
    // Use non-null assertion since we know these have defaults from init()
    const radius = config.radius!;
    const center = config.center!;
    const startAngle = config.startAngle!;
    const direction = config.direction!;
    const distribution = config.distribution!;
    
    if (config.dimensions === 2) {
      // 2D circle - equal distribution
      for (let i = 0; i < count; i++) {
        const angle = startAngle + (i / count) * 2 * Math.PI *
                     (direction === 'clockwise' ? 1 : -1);
        
        positions.push({
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
          z: center.z
        });
      }
    } else {
      // 3D sphere - Fibonacci spiral distribution for equal spacing
      if (distribution === 'equal') {
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
        
        for (let i = 0; i < count; i++) {
          const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
          const radiusAtY = Math.sqrt(1 - y * y);
          const theta = phi * i;
          
          positions.push({
            x: center.x + radius * Math.cos(theta) * radiusAtY,
            y: center.y + radius * y,
            z: center.z + radius * Math.sin(theta) * radiusAtY
          });
        }
      } else {
        // Random distribution on sphere surface
        for (let i = 0; i < count; i++) {
          // Random spherical coordinates
          const theta = Math.random() * 2 * Math.PI; // azimuthal angle
          const phi = Math.acos(2 * Math.random() - 1); // polar angle
          
          positions.push({
            x: center.x + radius * Math.sin(phi) * Math.cos(theta),
            y: center.y + radius * Math.cos(phi),
            z: center.z + radius * Math.sin(phi) * Math.sin(theta)
          });
        }
      }
    }
    
    return positions;
  }

  private isPinned(node: NodeSpec): boolean {
    return node.pinning !== undefined;
  }

  public onTick(): void {
    // Circle layout doesn't need continuous updates
  }

  public tick(iterations = 1): void {
    // Circle layout doesn't need continuous updates
  }

  public resume(): void {
    // Circle layout doesn't need to be resumed
  }

  public pause(): void {
    // Circle layout doesn't need to be paused
  }

  public reheat(): void {
    // Circle layout doesn't need reheating
  }

  public dispose(): void {
    // Nothing to dispose for circle layout
  }
}