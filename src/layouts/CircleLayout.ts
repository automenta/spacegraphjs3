import { createEffect } from 'solid-js';
import { CircleLayoutSpec } from '../types';
import { BaseLayoutEngine } from './BaseLayoutEngine';

/**
 * CircleLayout - Arranges nodes in a circular or spherical pattern
 */
export class CircleLayout extends BaseLayoutEngine {
  private config!: CircleLayoutSpec;

  protected setupLayout(): void {
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
        distribution: layoutConfig.distribution ?? 'equal',
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

    this.arrangeNodesWithPositions((count) => {
      return this.calculateCirclePositions(count);
    });
  }

  private calculateCirclePositions(
    count: number
  ): Array<{ x: number; y: number; z: number }> {
    const positions: Array<{ x: number; y: number; z: number }> = [];
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
        const angle =
          startAngle +
          (i / count) * 2 * Math.PI * (direction === 'clockwise' ? 1 : -1);

        positions.push({
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
          z: center.z,
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
            z: center.z + radius * Math.sin(theta) * radiusAtY,
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
            z: center.z + radius * Math.sin(phi) * Math.sin(theta),
          });
        }
      }
    }

    return positions;
  }

  public tick(_iterations = 1): void {
    // Circle layout doesn't need continuous updates
  }
}
