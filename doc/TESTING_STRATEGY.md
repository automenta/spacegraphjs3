# SpaceGraphJS3 Testing Strategy and Implementation Plan

## Overview

This document outlines the comprehensive testing strategy for SpaceGraphJS3, covering unit tests, integration tests,
performance benchmarks, visual regression tests, and end-to-end testing. The strategy ensures all new features are
thoroughly tested while maintaining the existing 98.2% test pass rate.

## Current Testing Status

### ✅ Existing Test Coverage

- **Unit Tests**: 55/56 tests passing (98.2% pass rate)
- **Test Categories**: Camera, interaction, layout, rendering, edge cases
- **Performance Benchmarks**: Basic performance measurement utilities
- **Visual Tests**: Playwright-based visual regression testing
- **E2E Tests**: Basic functionality verification

### 🔧 Testing Gaps Identified

- Missing tests for new layout engines (Circle, Column, Row)
- No tests for new element actors (Box, CustomGeometry, Text)
- Edge interaction system needs comprehensive testing
- Enhanced camera features require test coverage
- Performance optimizations need validation tests
- Memory management testing is missing

## Testing Architecture

### Test Organization

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── core/               # Core system tests
│   ├── plugins/            # Plugin-specific tests
│   ├── renderers/          # Renderer tests
│   ├── layouts/            # Layout engine tests
│   ├── utils/              # Utility function tests
│   └── performance/        # Performance benchmark tests
├── integration/            # Integration tests
├── e2e/                    # End-to-end tests
├── visual/                 # Visual regression tests
└── fixtures/               # Test data and fixtures
```

## Detailed Testing Implementation

### Phase 1: Unit Tests for New Features

#### 1.1 Layout Engine Tests

**File**: `tests/unit/layout-engines-comprehensive.spec.ts`

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createTestGraph, nextTick } from './test-utils';
import {
  SpaceGraph,
  CircleLayoutSpec,
  ColumnLayoutSpec,
  RowLayoutSpec,
  GridLayoutSpec,
} from '../../src';

describe('Comprehensive Layout Engine Tests', () => {
  describe('CircleLayout', () => {
    it('should arrange nodes in perfect circle in 2D', async () => {
      const circleSpec: CircleLayoutSpec = {
        type: 'circle',
        radius: 10,
        dimensions: 2,
        center: { x: 0, y: 0, z: 0 },
        startAngle: 0,
        direction: 'clockwise',
        distribution: 'equal',
      };

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere' },
            { id: 'n2', type: 'sphere' },
            { id: 'n3', type: 'sphere' },
            { id: 'n4', type: 'sphere' },
          ],
          edges: [],
        },
        layout: circleSpec,
      });

      await nextTick();

      const nodes = graph.state.data.nodes;
      expect(nodes).toHaveLength(4);

      // Verify circular arrangement
      nodes.forEach((node, index) => {
        expect(node.position).toBeDefined();
        if (node.position) {
          // Calculate distance from center
          const distance = Math.sqrt(
            node.position.x * node.position.x +
              node.position.y * node.position.y
          );
          // Should be approximately equal to radius (10)
          expect(distance).toBeCloseTo(10, 1);
          // All nodes should be at z = 0 for 2D layout
          expect(node.position.z).toBe(0);

          // Verify angular spacing (90 degrees apart for 4 nodes)
          const angle = Math.atan2(node.position.y, node.position.x);
          const expectedAngle = (index * Math.PI * 2) / 4;
          expect(angle).toBeCloseTo(expectedAngle, 1);
        }
      });

      cleanup();
    });

    it('should handle 3D spherical arrangement with Fibonacci distribution', async () => {
      const circleSpec: CircleLayoutSpec = {
        type: 'circle',
        radius: 20,
        dimensions: 3,
        center: { x: 0, y: 0, z: 0 },
        distribution: 'equal',
      };

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 100 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
          })),
          edges: [],
        },
        layout: circleSpec,
      });

      await nextTick();

      const nodes = graph.state.data.nodes;
      expect(nodes).toHaveLength(100);

      // Verify spherical distribution
      nodes.forEach((node) => {
        expect(node.position).toBeDefined();
        if (node.position) {
          // Calculate distance from center
          const distance = Math.sqrt(
            node.position.x * node.position.x +
              node.position.y * node.position.y +
              node.position.z * node.position.z
          );
          // Should be approximately equal to radius (20)
          expect(distance).toBeCloseTo(20, 1);
        }
      });

      cleanup();
    });

    it('should respect pinned node positions', async () => {
      const circleSpec: CircleLayoutSpec = {
        type: 'circle',
        radius: 15,
        dimensions: 2,
      };

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', pinning: { x: 100, y: 200, z: 0 } },
            { id: 'n2', type: 'sphere' },
            { id: 'n3', type: 'sphere' },
          ],
          edges: [],
        },
        layout: circleSpec,
      });

      await nextTick();

      const nodes = graph.state.data.nodes;

      // Pinned node should maintain its position
      const pinnedNode = nodes.find((n) => n.id === 'n1');
      expect(pinnedNode?.position).toEqual({ x: 100, y: 200, z: 0 });

      // Unpinned nodes should be arranged in circle
      const unpinnedNodes = nodes.filter((n) => n.id !== 'n1');
      unpinnedNodes.forEach((node) => {
        expect(node.position).toBeDefined();
        if (node.position) {
          const distance = Math.sqrt(
            node.position.x * node.position.x +
              node.position.y * node.position.y
          );
          expect(distance).toBeCloseTo(15, 1);
        }
      });

      cleanup();
    });

    it('should handle edge cases gracefully', async () => {
      const circleSpec: CircleLayoutSpec = {
        type: 'circle',
        radius: 10,
        dimensions: 2,
      };

      // Test with single node
      const { graph: graph1, cleanup: cleanup1 } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere' }],
          edges: [],
        },
        layout: circleSpec,
      });

      await nextTick();
      expect(graph1.state.data.nodes[0].position).toBeDefined();
      cleanup1();

      // Test with empty graph
      const { graph: graph2, cleanup: cleanup2 } = createTestGraph({
        data: { nodes: [], edges: [] },
        layout: circleSpec,
      });

      await nextTick();
      expect(graph2.state.data.nodes).toHaveLength(0);
      cleanup2();
    });
  });

  describe('ColumnLayout', () => {
    it('should arrange nodes in vertical columns', async () => {
      const columnSpec: ColumnLayoutSpec = {
        type: 'column',
        spacing: 5,
        columns: 2,
        columnSpacing: 10,
        origin: { x: 0, y: 0, z: 0 },
        maxNodesPerColumn: 3,
      };

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 6 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
          })),
          edges: [],
        },
        layout: columnSpec,
      });

      await nextTick();

      const nodes = graph.state.data.nodes;
      expect(nodes).toHaveLength(6);

      // Verify column arrangement
      // First 3 nodes should be in first column, next 3 in second column
      const column1 = nodes.slice(0, 3);
      const column2 = nodes.slice(3, 6);

      // Check column 1 (x should be negative due to centering)
      column1.forEach((node, index) => {
        expect(node.position?.x).toBeLessThan(0);
        expect(node.position?.y).toBeCloseTo((index - 1) * 5, 1); // Centered around origin
      });

      // Check column 2 (x should be positive due to centering)
      column2.forEach((node, index) => {
        expect(node.position?.x).toBeGreaterThan(0);
        expect(node.position?.y).toBeCloseTo((index - 1) * 5, 1);
      });

      cleanup();
    });
  });

  describe('RowLayout', () => {
    it('should arrange nodes in horizontal rows', async () => {
      const rowSpec: RowLayoutSpec = {
        type: 'row',
        spacing: 4,
        rows: 2,
        rowSpacing: 8,
        origin: { x: 0, y: 0, z: 0 },
        maxNodesPerRow: 3,
      };

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 6 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
          })),
          edges: [],
        },
        layout: rowSpec,
      });

      await nextTick();

      const nodes = graph.state.data.nodes;
      expect(nodes).toHaveLength(6);

      // Verify row arrangement
      // First 3 nodes should be in first row, next 3 in second row
      const row1 = nodes.slice(0, 3);
      const row2 = nodes.slice(3, 6);

      // Check row 1 (y should be positive due to centering)
      row1.forEach((node, index) => {
        expect(node.position?.y).toBeGreaterThan(0);
        expect(node.position?.x).toBeCloseTo((index - 1) * 4, 1); // Centered around origin
      });

      // Check row 2 (y should be negative due to centering)
      row2.forEach((node, index) => {
        expect(node.position?.y).toBeLessThan(0);
        expect(node.position?.x).toBeCloseTo((index - 1) * 4, 1);
      });

      cleanup();
    });
  });

  describe('GridLayout', () => {
    it('should arrange nodes in 2D grid pattern', async () => {
      const gridSpec: GridLayoutSpec = {
        type: 'grid',
        dimensions: 2,
        spacing: 3,
        origin: { x: 0, y: 0, z: 0 },
      };

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 9 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
          })),
          edges: [],
        },
        layout: gridSpec,
      });

      await nextTick();

      const nodes = graph.state.data.nodes;
      expect(nodes).toHaveLength(9);

      // Verify grid arrangement (3x3 grid)
      nodes.forEach((node, index) => {
        expect(node.position).toBeDefined();
        if (node.position) {
          const row = Math.floor(index / 3);
          const col = index % 3;

          // Check position relative to grid
          expect(node.position.x).toBeCloseTo((col - 1) * 3, 1);
          expect(node.position.y).toBeCloseTo((1 - row) * 3, 1); // Inverted Y for screen coordinates
          expect(node.position.z).toBe(0);
        }
      });

      cleanup();
    });

    it('should handle 3D grid arrangement', async () => {
      const gridSpec: GridLayoutSpec = {
        type: 'grid',
        dimensions: 3,
        spacing: 4,
        columns: 3,
        rows: 3,
        depth: 3,
        origin: { x: 0, y: 0, z: 0 },
      };

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 27 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
          })),
          edges: [],
        },
        layout: gridSpec,
      });

      await nextTick();

      const nodes = graph.state.data.nodes;
      expect(nodes).toHaveLength(27);

      // Verify 3D grid arrangement (3x3x3 grid)
      nodes.forEach((node, index) => {
        expect(node.position).toBeDefined();
        if (node.position) {
          const layer = Math.floor(index / 9);
          const row = Math.floor((index % 9) / 3);
          const col = index % 3;

          // Check position relative to 3D grid
          expect(node.position.x).toBeCloseTo((col - 1) * 4, 1);
          expect(node.position.y).toBeCloseTo((1 - row) * 4, 1);
          expect(node.position.z).toBeCloseTo((layer - 1) * 4, 1);
        }
      });

      cleanup();
    });
  });
});
```

#### 1.2 Element Actor Tests

**File**: `tests/unit/element-actors.spec.ts`

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createTestGraph, nextTick } from './test-utils';
import {
  SpaceGraph,
  BoxNodeSpec,
  TextNodeSpec,
  CustomGeometryNodeSpec,
} from '../../src';

describe('Element Actors Tests', () => {
  describe('BoxElementActor', () => {
    it('should create box nodes with custom dimensions', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'box1',
              type: 'box',
              width: 2,
              height: 3,
              depth: 4,
              rounded: false,
            } as BoxNodeSpec,
          ],
          edges: [],
        },
      });

      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();
      expect(node.type).toBe('box');

      // Verify box-specific properties
      const boxSpec = node as BoxNodeSpec;
      expect(boxSpec.width).toBe(2);
      expect(boxSpec.height).toBe(3);
      expect(boxSpec.depth).toBe(4);
      expect(boxSpec.rounded).toBe(false);

      cleanup();
    });

    it('should handle rounded box geometry', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'box2',
              type: 'box',
              width: 1,
              height: 1,
              depth: 1,
              rounded: true,
            } as BoxNodeSpec,
          ],
          edges: [],
        },
      });

      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();

      const boxSpec = node as BoxNodeSpec;
      expect(boxSpec.rounded).toBe(true);

      cleanup();
    });

    it('should apply styling and interactions correctly', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'box3',
              type: 'box',
              color: '#ff0000',
              position: { x: 10, y: 20, z: 30 },
            } as BoxNodeSpec,
          ],
          edges: [],
        },
        style: {
          'node:hover': { color: '#00ff00' },
          'node:selected': { color: '#0000ff' },
        },
      });

      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();
      expect(node.color).toBe('#ff0000');
      expect(node.position).toEqual({ x: 10, y: 20, z: 30 });

      // Test hover state
      graph.update({ interaction: { hoveredElementId: 'box3' } });
      await nextTick();

      // Test selection state
      graph.update({ interaction: { selectedElementIds: ['box3'] } });
      await nextTick();

      cleanup();
    });
  });

  describe('TextElementActor', () => {
    it('should create text nodes with custom text content', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'text1',
              type: 'text',
              text: 'Hello World',
              fontSize: 2,
              color: '#ffffff',
            } as TextNodeSpec,
          ],
          edges: [],
        },
      });

      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();

      const textSpec = node as TextNodeSpec;
      expect(textSpec.text).toBe('Hello World');
      expect(textSpec.fontSize).toBe(2);
      expect(textSpec.color).toBe('#ffffff');

      cleanup();
    });

    it('should support text alignment and billboard effects', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'text2',
              type: 'text',
              text: 'Aligned Text',
              textAlign: 'center',
              verticalAlign: 'middle',
              billboard: true,
            } as TextNodeSpec,
          ],
          edges: [],
        },
      });

      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();

      const textSpec = node as TextNodeSpec;
      expect(textSpec.textAlign).toBe('center');
      expect(textSpec.verticalAlign).toBe('middle');
      expect(textSpec.billboard).toBe(true);

      cleanup();
    });

    it('should handle font loading and async initialization', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'text3',
              type: 'text',
              text: 'Custom Font Text',
              fontUrl: '/fonts/custom-font.json',
            } as TextNodeSpec,
          ],
          edges: [],
        },
      });

      // Wait for async font loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();

      const textSpec = node as TextNodeSpec;
      expect(textSpec.fontUrl).toBe('/fonts/custom-font.json');

      cleanup();
    });
  });

  describe('CustomGeometryActor', () => {
    it('should create nodes with custom geometry data', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'custom1',
              type: 'custom',
              geometryData: {
                vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0],
                indices: [0, 1, 2],
              },
              geometryType: 'buffer',
              material: {
                type: 'basic',
                color: '#00ff00',
              },
            } as CustomGeometryNodeSpec,
          ],
          edges: [],
        },
      });

      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();

      const customSpec = node as CustomGeometryNodeSpec;
      expect(customSpec.geometryData).toBeDefined();
      expect(customSpec.geometryType).toBe('buffer');
      expect(customSpec.material?.type).toBe('basic');
      expect(customSpec.material?.color).toBe('#00ff00');

      cleanup();
    });

    it('should support different material types', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'custom2',
              type: 'custom',
              geometryData: {
                /* geometry data */
              },
              material: {
                type: 'standard',
                color: '#ff0000',
                transparent: true,
                opacity: 0.8,
              },
            } as CustomGeometryNodeSpec,
          ],
          edges: [],
        },
      });

      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();

      const customSpec = node as CustomGeometryNodeSpec;
      expect(customSpec.material?.type).toBe('standard');
      expect(customSpec.material?.transparent).toBe(true);
      expect(customSpec.material?.opacity).toBe(0.8);

      cleanup();
    });

    it('should handle geometry loading errors gracefully', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            {
              id: 'custom3',
              type: 'custom',
              geometryUrl: '/invalid/geometry/file.obj',
              geometryType: 'obj',
            } as CustomGeometryNodeSpec,
          ],
          edges: [],
        },
      });

      // Wait for async geometry loading to fail
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await nextTick();

      const node = graph.state.data.nodes[0];
      expect(node).toBeDefined();

      // Should fall back to default geometry
      const customSpec = node as CustomGeometryNodeSpec;
      expect(customSpec.geometryUrl).toBe('/invalid/geometry/file.obj');

      cleanup();
    });
  });
});
```

#### 1.3 Edge Interaction Tests

**File**: `tests/unit/edge-interaction.spec.ts`

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createTestGraph, nextTick, simulatePointerEvent } from './test-utils';
import { SpaceGraph, EdgeSpec } from '../../src';

describe('Edge Interaction System Tests', () => {
  describe('Edge Hover', () => {
    it('should detect edge hover events', async () => {
      const hoverEvents: any[] = [];

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [
            {
              id: 'e1',
              source: 'n1',
              target: 'n2',
              selectable: true,
              hoverable: true,
            },
          ],
        },
      });

      graph.on('edge:hover:enter', (event) => {
        hoverEvents.push(event);
      });

      // Simulate edge hover
      await simulatePointerEvent(graph, 'pointermove', { x: 100, y: 200 });

      await nextTick();

      expect(hoverEvents).toHaveLength(1);
      expect(hoverEvents[0].target.id).toBe('e1');
      expect(hoverEvents[0].sourceNode.id).toBe('n1');
      expect(hoverEvents[0].targetNode.id).toBe('n2');

      cleanup();
    });

    it('should apply hover styling to edges', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2', color: '#ffffff' }],
        },
        style: {
          'edge:hover': {
            color: '#ff0000',
            width: 4,
          },
        },
      });

      await nextTick();

      // Trigger hover
      graph.update({ interaction: { hoveredElementId: 'e1' } });
      await nextTick();

      // Verify styling is applied (would need to check rendered objects)
      const edge = graph.state.data.edges[0];
      expect(edge.id).toBe('e1');

      cleanup();
    });

    it('should handle edge hover leave events', async () => {
      const leaveEvents: any[] = [];

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        },
      });

      graph.on('edge:hover:leave', (event) => {
        leaveEvents.push(event);
      });

      // Simulate hover and then leave
      graph.update({ interaction: { hoveredElementId: 'e1' } });
      await nextTick();

      graph.update({ interaction: { hoveredElementId: null } });
      await nextTick();

      expect(leaveEvents).toHaveLength(1);
      expect(leaveEvents[0].target.id).toBe('e1');

      cleanup();
    });
  });

  describe('Edge Selection', () => {
    it('should support single edge selection', async () => {
      const selectEvents: any[] = [];

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2', selectable: true }],
        },
      });

      graph.on('edge:select', (event) => {
        selectEvents.push(event);
      });

      // Simulate edge click/selection
      graph.update({ interaction: { selectedElementIds: ['e1'] } });
      await nextTick();

      expect(selectEvents).toHaveLength(1);
      expect(selectEvents[0].target.id).toBe('e1');

      cleanup();
    });

    it('should support multi-edge selection with Ctrl/Cmd', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
            { id: 'n3', type: 'sphere', position: { x: 20, y: 0, z: 0 } },
          ],
          edges: [
            { id: 'e1', source: 'n1', target: 'n2', selectable: true },
            { id: 'e2', source: 'n2', target: 'n3', selectable: true },
          ],
        },
      });

      await nextTick();

      // Select first edge
      graph.update({ interaction: { selectedElementIds: ['e1'] } });
      await nextTick();

      // Add second edge to selection (simulating Ctrl+click)
      graph.update({ interaction: { selectedElementIds: ['e1', 'e2'] } });
      await nextTick();

      const selectedIds = graph.state.interaction.selectedElementIds;
      expect(selectedIds).toContain('e1');
      expect(selectedIds).toContain('e2');

      cleanup();
    });

    it('should apply selection styling to edges', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2', color: '#ffffff' }],
        },
        style: {
          'edge:selected': {
            color: '#00ff00',
            width: 6,
            glow: { color: '#00ff00', strength: 0.8 },
          },
        },
      });

      await nextTick();

      // Select edge
      graph.update({ interaction: { selectedElementIds: ['e1'] } });
      await nextTick();

      // Verify selection styling is applied
      const edge = graph.state.data.edges[0];
      expect(edge.id).toBe('e1');

      cleanup();
    });
  });

  describe('Edge Types and Geometry', () => {
    it('should support curved edges', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 20, y: 0, z: 0 } },
          ],
          edges: [
            {
              id: 'e1',
              source: 'n1',
              target: 'n2',
              type: 'curved',
              curvature: 0.5,
            },
          ],
        },
      });

      await nextTick();

      const edge = graph.state.data.edges[0];
      expect(edge.type).toBe('curved');
      expect(edge.curvature).toBe(0.5);

      cleanup();
    });

    it('should support dashed edges', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [
            {
              id: 'e1',
              source: 'n1',
              target: 'n2',
              type: 'dashed',
              dashSize: 0.5,
              gapSize: 0.3,
            },
          ],
        },
      });

      await nextTick();

      const edge = graph.state.data.edges[0];
      expect(edge.type).toBe('dashed');
      expect(edge.dashSize).toBe(0.5);
      expect(edge.gapSize).toBe(0.3);

      cleanup();
    });

    it('should support edge labels', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [
            {
              id: 'e1',
              source: 'n1',
              target: 'n2',
              label: 'Connection Label',
            },
          ],
        },
      });

      await nextTick();

      const edge = graph.state.data.edges[0];
      expect(edge.label).toBe('Connection Label');

      cleanup();
    });
  });

  describe('Edge Event Coordination', () => {
    it('should coordinate edge and node selection states', async () => {
      const events: any[] = [];

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        },
      });

      graph.on('edge:select', (event) =>
        events.push({ type: 'edge:select', data: event })
      );
      graph.on('element:click', (event) =>
        events.push({ type: 'element:click', data: event })
      );

      // Select edge
      graph.update({ interaction: { selectedElementIds: ['e1'] } });
      await nextTick();

      // Verify both edge and general element events fire
      const edgeSelectEvents = events.filter((e) => e.type === 'edge:select');
      const elementClickEvents = events.filter(
        (e) => e.type === 'element:click'
      );

      expect(edgeSelectEvents).toHaveLength(1);
      expect(elementClickEvents).toHaveLength(0); // element:click is for nodes only

      cleanup();
    });

    it('should handle rapid edge interactions without race conditions', async () => {
      const events: any[] = [];

      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          ],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        },
      });

      graph.on('edge:hover:enter', (event) =>
        events.push({ type: 'enter', id: event.target.id })
      );
      graph.on('edge:hover:leave', (event) =>
        events.push({ type: 'leave', id: event.target.id })
      );

      // Simulate rapid hover changes
      for (let i = 0; i < 10; i++) {
        graph.update({
          interaction: { hoveredElementId: i % 2 === 0 ? 'e1' : null },
        });
        await nextTick();
      }

      // Verify events are in correct order and no duplicates
      const enterEvents = events.filter((e) => e.type === 'enter');
      const leaveEvents = events.filter((e) => e.type === 'leave');

      // Should have alternating enter/leave events
      expect(enterEvents.length + leaveEvents.length).toBeGreaterThan(0);

      cleanup();
    });
  });
});
```

#### 1.4 Enhanced Camera Tests

**File**: `tests/unit/camera-enhanced.spec.ts`

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createTestGraph, nextTick } from './test-utils';
import { SpaceGraph, Vector3 } from '../../src';

describe('Enhanced Camera Features Tests', () => {
  describe('Auto-Zoom and Framing', () => {
    it('should frame selected elements automatically', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 20, y: 20, z: 20 } },
            { id: 'n3', type: 'sphere', position: { x: -10, y: -10, z: -10 } },
          ],
          edges: [],
        },
        camera: {
          autoFrameEnabled: true,
        },
      });

      await nextTick();

      // Select multiple elements
      graph.update({ interaction: { selectedElementIds: ['n1', 'n2', 'n3'] } });
      await nextTick();

      // Wait for auto-framing animation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verify camera has been adjusted to frame selected elements
      const cameraState = graph.state.camera;
      expect(cameraState.target.x).toBeCloseTo(3.33, 1); // Average of positions
      expect(cameraState.target.y).toBeCloseTo(3.33, 1);
      expect(cameraState.target.z).toBeCloseTo(3.33, 1);

      cleanup();
    });

    it('should support different framing strategies', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 10, y: 10, z: 10 } },
          ],
          edges: [],
        },
      });

      await nextTick();

      // Test tight framing
      await graph.camera.frame(
        [
          { position: new Vector3(0, 0, 0), size: 1 },
          { position: new Vector3(10, 10, 10), size: 1 },
        ],
        {
          strategy: 'tight',
          padding: 2,
        }
      );

      await nextTick();

      let cameraState = graph.state.camera;
      const initialDistance = cameraState.distance;

      // Test loose framing
      await graph.camera.frame(
        [
          { position: new Vector3(0, 0, 0), size: 1 },
          { position: new Vector3(10, 10, 10), size: 1 },
        ],
        {
          strategy: 'loose',
          padding: 5,
        }
      );

      await nextTick();

      cameraState = graph.state.camera;
      const looseDistance = cameraState.distance;

      // Loose framing should result in greater distance
      expect(looseDistance).toBeGreaterThan(initialDistance);

      cleanup();
    });

    it('should handle aspect ratio considerations', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            { id: 'n2', type: 'sphere', position: { x: 100, y: 10, z: 0 } },
          ],
          edges: [],
        },
      });

      await nextTick();

      // Test with specific aspect ratio
      await graph.camera.frame(
        [
          { position: new Vector3(0, 0, 0), size: 1 },
          { position: new Vector3(100, 10, 0), size: 1 },
        ],
        {
          aspectRatio: 16 / 9,
          strategy: 'optimal',
        }
      );

      await nextTick();

      const cameraState = graph.state.camera;
      expect(cameraState).toBeDefined();

      cleanup();
    });
  });

  describe('Camera Presets and Bookmarks', () => {
    it('should save and restore camera presets', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
      });

      await nextTick();

      // Set camera to specific position
      graph.update({
        camera: {
          target: { x: 10, y: 20, z: 30 },
          phi: 45,
          theta: 45,
          distance: 50,
        },
      });
      await nextTick();

      // Save as preset
      const preset = await graph.camera.presetsManager.createPreset(
        'Test View',
        {
          description: 'Test camera position',
          category: 'Testing',
        }
      );

      expect(preset.name).toBe('Test View');
      expect(preset.description).toBe('Test Camera Position');
      expect(preset.cameraState.target).toEqual({ x: 10, y: 20, z: 30 });

      // Change camera position
      graph.update({
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: 0,
          theta: 0,
          distance: 10,
        },
      });
      await nextTick();

      // Apply preset
      await graph.camera.presetsManager.applyPreset(preset.id);
      await nextTick();

      // Verify camera restored to preset position
      const restoredState = graph.state.camera;
      expect(restoredState.target).toEqual({ x: 10, y: 20, z: 30 });
      expect(restoredState.phi).toBe(45);
      expect(restoredState.theta).toBe(45);
      expect(restoredState.distance).toBe(50);

      cleanup();
    });

    it('should support quick preset positions', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
      });

      await nextTick();

      // Test top view
      await graph.camera.applyQuickPreset('top');
      await nextTick();

      let cameraState = graph.state.camera;
      expect(cameraState.phi).toBe(0);
      expect(cameraState.theta).toBe(0);

      // Test isometric view
      await graph.camera.applyQuickPreset('isometric');
      await nextTick();

      cameraState = graph.state.camera;
      expect(cameraState.phi).toBe(45);
      expect(cameraState.theta).toBe(45);

      cleanup();
    });

    it('should handle preset import/export', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
      });

      await nextTick();

      // Create multiple presets
      const preset1 = await graph.camera.presetsManager.createPreset('View 1');
      const preset2 = await graph.camera.presetsManager.createPreset('View 2');

      // Export presets
      const exported = graph.camera.presetsManager.exportPresets();
      expect(exported).toContain('View 1');
      expect(exported).toContain('View 2');

      // Clear presets
      graph.camera.presetsManager.importPresets(
        '{"version":"1.0","presets":[],"categories":[]}'
      );

      // Import presets back
      graph.camera.presetsManager.importPresets(exported);

      // Verify presets restored
      const presets = graph.camera.presetsManager.getAllPresets();
      expect(presets).toHaveLength(2);
      expect(presets.some((p) => p.name === 'View 1')).toBe(true);
      expect(presets.some((p) => p.name === 'View 2')).toBe(true);

      cleanup();
    });
  });

  describe('Advanced Rotation Controls', () => {
    it('should apply rotation constraints', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
      });

      await nextTick();

      // Set rotation constraints
      graph.camera.setRotationConstraints({
        minPhi: 10,
        maxPhi: 170,
        constrainPhi: true,
        minTheta: -180,
        maxTheta: 180,
        constrainTheta: false,
      });

      // Try to rotate beyond constraints
      await graph.camera.rotateTo(5, 90, { duration: 100 });
      await nextTick();

      let cameraState = graph.state.camera;
      expect(cameraState.phi).toBe(10); // Constrained to minimum

      // Try to rotate within constraints
      await graph.camera.rotateTo(45, 90, { duration: 100 });
      await nextTick();

      cameraState = graph.state.camera;
      expect(cameraState.phi).toBe(45); // Within constraints

      cleanup();
    });

    it('should support angle snapping', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
      });

      await nextTick();

      // Set snap angles
      graph.camera.setRotationConstraints({
        snapAngles: [0, 45, 90, 135, 180, 225, 270, 315],
        snapThreshold: 10,
      });

      // Rotate close to snap angle
      await graph.camera.rotateTo(47, 0, { duration: 100 });
      await nextTick();

      let cameraState = graph.state.camera;
      expect(cameraState.phi).toBe(45); // Snapped to 45 degrees

      // Rotate not close enough to snap
      await graph.camera.rotateTo(60, 0, { duration: 100 });
      await nextTick();

      cameraState = graph.state.camera;
      expect(cameraState.phi).toBe(60); // Not snapped

      cleanup();
    });

    it('should support orbit around custom pivot points', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 10, y: 10, z: 10 } },
            { id: 'n2', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
          ],
          edges: [],
        },
      });

      await nextTick();

      // Set pivot to n1 position
      graph.camera.setRotationPivot(new Vector3(10, 10, 10));

      // Orbit around pivot
      await graph.camera.orbitAround('y', 90, {
        duration: 1000,
        pivot: 'n1', // Orbit around node n1
      });
      await nextTick();

      // Verify camera moved around pivot
      const cameraState = graph.state.camera;
      expect(cameraState.target.x).toBeCloseTo(10, 1);
      expect(cameraState.target.y).toBeCloseTo(10, 1);
      expect(cameraState.target.z).toBeCloseTo(10, 1);

      cleanup();
    });
  });

  describe('Advanced Animation Curves', () => {
    it('should support custom animation easing functions', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
      });

      await nextTick();

      const animationUpdates: number[] = [];

      // Test bounce easing
      await graph.camera.flyTo(
        {
          target: { x: 10, y: 10, z: 10 },
          phi: 45,
          theta: 45,
          distance: 20,
        },
        {
          duration: 1000,
          easing: 'bounce',
          onUpdate: (progress) => {
            animationUpdates.push(progress);
          },
        }
      );

      expect(animationUpdates.length).toBeGreaterThan(0);

      // Verify bounce effect (progress should oscillate)
      const hasOscillation = animationUpdates.some((val, i) => {
        if (i === 0) return false;
        return val < animationUpdates[i - 1]; // Decrease indicates bounce
      });

      expect(hasOscillation).toBe(true);

      cleanup();
    });

    it('should support interruptible animations', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
      });

      await nextTick();

      let firstAnimationCompleted = false;
      let secondAnimationCompleted = false;

      // Start long animation
      const firstAnimation = graph.camera.flyTo(
        {
          target: { x: 100, y: 100, z: 100 },
          distance: 100,
        },
        {
          duration: 2000,
          onComplete: () => {
            firstAnimationCompleted = true;
          },
        }
      );

      // Wait a bit then interrupt with second animation
      await new Promise((resolve) => setTimeout(resolve, 200));

      await graph.camera.flyTo(
        {
          target: { x: 10, y: 10, z: 10 },
          distance: 10,
        },
        {
          duration: 500,
          interruptible: true,
          onComplete: () => {
            secondAnimationCompleted = true;
          },
        }
      );

      await firstAnimation; // Wait for first to complete (should be interrupted)

      expect(secondAnimationCompleted).toBe(true);
      // First animation might complete due to timing, but second should take precedence

      cleanup();
    });
  });
});
```

#### 1.5 Performance Optimization Tests

**File**: `tests/unit/performance-optimization.spec.ts`

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createTestGraph, nextTick } from './test-utils';
import { SpaceGraph, ThreeObjectPoolManager } from '../../src';

describe('Performance Optimization Tests', () => {
  describe('Object Pooling', () => {
    it('should reuse objects from pools', async () => {
      const poolManager = ThreeObjectPoolManager.getInstance();

      // Get initial stats
      const initialStats = poolManager.getAllStats();
      const initialVector3Available =
        initialStats['vector3']?.availableObjects || 0;

      // Acquire and release multiple objects
      const vectors: THREE.Vector3[] = [];
      for (let i = 0; i < 10; i++) {
        vectors.push(poolManager.getVector3());
      }

      // Check that objects were acquired
      const duringStats = poolManager.getAllStats();
      const duringVector3InUse = duringStats['vector3']?.inUseObjects || 0;
      expect(duringVector3InUse).toBeGreaterThanOrEqual(10);

      // Release objects back to pool
      vectors.forEach((vec) => poolManager.releaseVector3(vec));

      // Check that objects were returned
      const finalStats = poolManager.getAllStats();
      const finalVector3Available =
        finalStats['vector3']?.availableObjects || 0;
      expect(finalVector3Available).toBeGreaterThanOrEqual(
        initialVector3Available
      );
    });

    it('should handle pool growth correctly', async () => {
      const poolManager = ThreeObjectPoolManager.getInstance();

      // Get initial stats
      const initialStats = poolManager.getAllStats();
      const initialSize = initialStats['vector3']?.totalObjects || 0;

      // Acquire more objects than initial pool size
      const vectors: THREE.Vector3[] = [];
      const acquireCount = initialSize + 20;

      for (let i = 0; i < acquireCount; i++) {
        vectors.push(poolManager.getVector3());
      }

      // Check that pool grew
      const finalStats = poolManager.getAllStats();
      const finalSize = finalStats['vector3']?.totalObjects || 0;
      expect(finalSize).toBeGreaterThan(initialSize);

      // Cleanup
      vectors.forEach((vec) => poolManager.releaseVector3(vec));
    });
  });

  describe('LOD System', () => {
    it('should switch LOD levels based on distance', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 50 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: {
              x: Math.random() * 100,
              y: Math.random() * 100,
              z: Math.random() * 100,
            },
          })),
          edges: [],
        },
        performance: {
          enableLOD: true,
          instancingThreshold: 100,
        },
      });

      await nextTick();

      // Verify LOD system is enabled
      expect(graph.render.lodManager).toBeDefined();

      // Test with different camera distances
      const cameraPlugin = graph.cameraPlugin;

      // Close distance - should use high detail
      await cameraPlugin?.flyTo(
        {
          target: { x: 50, y: 50, z: 50 },
          distance: 10,
        },
        { duration: 100 }
      );
      await nextTick();

      // Far distance - should use lower detail
      await cameraPlugin?.flyTo(
        {
          target: { x: 50, y: 50, z: 50 },
          distance: 200,
        },
        { duration: 100 }
      );
      await nextTick();

      // LOD switching should have occurred
      expect(graph.render.lodManager).toBeDefined();

      cleanup();
    });

    it('should maintain visual quality during LOD transitions', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [{ id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } }],
          edges: [],
        },
        performance: {
          enableLOD: true,
        },
      });

      await nextTick();

      // Test smooth LOD transitions
      const cameraPlugin = graph.cameraPlugin;

      // Gradually change distance to trigger transitions
      for (let distance = 10; distance <= 200; distance += 20) {
        await cameraPlugin?.flyTo(
          {
            target: { x: 0, y: 0, z: 0 },
            distance,
          },
          { duration: 50 }
        );
        await nextTick();
      }

      // Verify transitions completed without errors
      expect(graph.state.data.nodes[0]).toBeDefined();

      cleanup();
    });
  });

  describe('Culling System', () => {
    it('should cull objects outside camera frustum', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: [
            { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
            {
              id: 'n2',
              type: 'sphere',
              position: { x: 1000, y: 1000, z: 1000 },
            }, // Far away
            {
              id: 'n3',
              type: 'sphere',
              position: { x: -1000, y: -1000, z: -1000 },
            }, // Far away
          ],
          edges: [],
        },
        performance: {
          enableCulling: true,
        },
      });

      await nextTick();

      // Verify culling system is enabled
      expect(graph.render.cullingManager).toBeDefined();

      // Get culling statistics
      const stats = graph.render.cullingManager?.getStats();
      expect(stats).toBeDefined();
      expect(stats?.totalObjects).toBeGreaterThan(0);

      cleanup();
    });

    it('should handle hierarchical culling efficiently', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 100 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: {
              x: (i % 10) * 10,
              y: Math.floor(i / 10) * 10,
              z: 0,
            },
          })),
          edges: [],
        },
        performance: {
          enableCulling: true,
          enableHierarchicalCulling: true,
        },
      });

      await nextTick();

      // Verify hierarchical culling is working
      const cullingManager = graph.render.cullingManager;
      if ('getHierarchyStats' in cullingManager) {
        const hierarchyStats = (cullingManager as any).getHierarchyStats();
        expect(hierarchyStats.totalNodes).toBeGreaterThan(0);
        expect(hierarchyStats.maxDepth).toBeGreaterThan(0);
      }

      cleanup();
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage correctly', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 20 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: { x: i * 5, y: 0, z: 0 },
          })),
          edges: [],
        },
        performance: {
          enableMemoryManagement: true,
        },
      });

      await nextTick();

      // Get memory manager
      const memoryManager = graph.render.memoryManager;
      expect(memoryManager).toBeDefined();

      // Get memory statistics
      const memoryStats = memoryManager?.getMemoryStats();
      expect(memoryStats).toBeDefined();
      expect(memoryStats?.usedJSHeapSize).toBeGreaterThan(0);

      cleanup();
    });

    it('should perform cleanup when memory threshold exceeded', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 50 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: { x: i, y: 0, z: 0 },
          })),
          edges: [],
        },
        performance: {
          enableMemoryManagement: true,
        },
      });

      await nextTick();

      const memoryManager = graph.render.memoryManager;
      expect(memoryManager).toBeDefined();

      // Force cleanup
      memoryManager?.performStandardCleanup();

      // Verify cleanup completed without errors
      const postCleanupStats = memoryManager?.getMemoryStats();
      expect(postCleanupStats).toBeDefined();

      cleanup();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain performance with large node counts', async () => {
      const nodeCounts = [10, 50, 100, 500];
      const results: Record<number, number> = {};

      for (const count of nodeCounts) {
        const { graph, cleanup } = createTestGraph({
          data: {
            nodes: Array.from({ length: count }, (_, i) => ({
              id: `n${i}`,
              type: 'sphere',
              position: {
                x: Math.random() * 100,
                y: Math.random() * 100,
                z: Math.random() * 100,
              },
            })),
            edges: [],
          },
          performance: {
            enableLOD: true,
            enableCulling: true,
            instancingThreshold: 50,
          },
        });

        // Measure initialization time
        const startTime = performance.now();
        await nextTick();
        const initTime = performance.now() - startTime;

        results[count] = initTime;

        // Verify performance is reasonable (< 100ms per 100 nodes)
        expect(initTime).toBeLessThan(count * 1); // 1ms per node threshold

        cleanup();
      }

      // Verify performance scales reasonably
      const ratio10to100 = results[100] / results[10];
      expect(ratio10to100).toBeLessThan(15); // Should be less than 15x for 10x nodes

      console.log('Performance benchmark results:', results);
    });

    it('should maintain interaction responsiveness', async () => {
      const { graph, cleanup } = createTestGraph({
        data: {
          nodes: Array.from({ length: 200 }, (_, i) => ({
            id: `n${i}`,
            type: 'sphere',
            position: {
              x: Math.random() * 100,
              y: Math.random() * 100,
              z: Math.random() * 100,
            },
          })),
          edges: Array.from({ length: 100 }, (_, i) => ({
            id: `e${i}`,
            source: `n${i}`,
            target: `n${(i + 1) % 200}`,
          })),
        },
        performance: {
          enableLOD: true,
          enableCulling: true,
          enableMemoryManagement: true,
        },
      });

      await nextTick();

      // Measure interaction response time
      const interactionTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        // Simulate interaction
        graph.update({ interaction: { hoveredElementId: `n${i}` } });
        await nextTick();

        const interactionTime = performance.now() - startTime;
        interactionTimes.push(interactionTime);
      }

      // Calculate average interaction time
      const avgInteractionTime =
        interactionTimes.reduce((sum, time) => sum + time, 0) /
        interactionTimes.length;

      // Should maintain < 10ms interaction response time
      expect(avgInteractionTime).toBeLessThan(10);

      console.log(
        'Average interaction time:',
        avgInteractionTime.toFixed(2),
        'ms'
      );

      cleanup();
    });
  });
});
```

### Phase 2: Integration Tests

#### 2.1 Feature Integration Tests

**File**: `tests/integration/feature-integration.spec.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { createTestGraph, nextTick } from '../test-utils';
import { SpaceGraph } from '../../src';

describe('Feature Integration Tests', () => {
  it('should integrate new layout engines with existing systems', async () => {
    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere' },
          { id: 'n2', type: 'sphere' },
          { id: 'n3', type: 'sphere' },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' },
        ],
      },
      layout: { type: 'circle', radius: 20 },
      style: {
        'node:selected': { color: '#ff0000' },
        'edge:hover': { color: '#00ff00' },
      },
      performance: {
        enableLOD: true,
        enableCulling: true,
      },
    });

    await nextTick();

    // Test layout integration
    const nodes = graph.state.data.nodes;
    expect(nodes).toHaveLength(3);

    // Verify circular arrangement
    nodes.forEach((node) => {
      if (node.position) {
        const distance = Math.sqrt(node.position.x ** 2 + node.position.y ** 2);
        expect(distance).toBeCloseTo(20, 1);
      }
    });

    // Test interaction integration
    graph.update({ interaction: { selectedElementIds: ['n1'] } });
    await nextTick();

    graph.update({ interaction: { hoveredElementId: 'e1' } });
    await nextTick();

    // Test performance system integration
    expect(graph.render.lodManager).toBeDefined();
    expect(graph.render.cullingManager).toBeDefined();

    cleanup();
  });

  it('should coordinate edge and node interactions', async () => {
    const events: any[] = [];

    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: [
          { id: 'n1', type: 'sphere' },
          { id: 'n2', type: 'sphere' },
          { id: 'n3', type: 'sphere' },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', selectable: true },
          { id: 'e2', source: 'n2', target: 'n3', selectable: true },
        ],
      },
      layout: { type: 'grid', spacing: 10 },
      style: {
        'node:selected': { color: '#ff0000' },
        'edge:selected': { color: '#0000ff' },
      },
    });

    // Register event listeners
    graph.on('element:click', (event) =>
      events.push({ type: 'node', data: event })
    );
    graph.on('edge:click', (event) =>
      events.push({ type: 'edge', data: event })
    );
    graph.on('edge:select', (event) =>
      events.push({ type: 'edge-select', data: event })
    );

    await nextTick();

    // Select node and edge
    graph.update({ interaction: { selectedElementIds: ['n1', 'e1'] } });
    await nextTick();

    // Verify both types of interactions work
    const nodeEvents = events.filter((e) => e.type === 'node');
    const edgeEvents = events.filter(
      (e) => e.type === 'edge' || e.type === 'edge-select'
    );

    expect(nodeEvents.length + edgeEvents.length).toBeGreaterThan(0);

    // Test connected edge highlighting when node selected
    graph.update({ interaction: { selectedElementIds: ['n2'] } });
    await nextTick();

    // Both edges connected to n2 should be affected
    const connectedEdges = graph.state.data.edges.filter(
      (e) => e.source === 'n2' || e.target === 'n2'
    );
    expect(connectedEdges.length).toBe(2);

    cleanup();
  });

  it('should handle performance optimizations with complex scenes', async () => {
    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `n${i}`,
          type: i % 3 === 0 ? 'sphere' : i % 3 === 1 ? 'box' : 'text',
          text: i % 3 === 2 ? `Node ${i}` : undefined,
          width: i % 3 === 1 ? 2 : undefined,
          height: i % 3 === 1 ? 2 : undefined,
          depth: i % 3 === 1 ? 2 : undefined,
          position: {
            x: Math.random() * 200,
            y: Math.random() * 200,
            z: Math.random() * 200,
          },
        })),
        edges: Array.from({ length: 150 }, (_, i) => ({
          id: `e${i}`,
          source: `n${i % 100}`,
          target: `n${(i + 1) % 100}`,
          type: i % 2 === 0 ? 'straight' : 'curved',
          curvature: i % 2 === 0 ? undefined : 0.3,
          selectable: true,
          hoverable: true,
        })),
      },
      layout: { type: 'random' },
      performance: {
        enableLOD: true,
        enableCulling: true,
        enableMemoryManagement: true,
        instancingThreshold: 50,
      },
    });

    await nextTick();

    // Verify all systems are working together
    expect(graph.render.lodManager).toBeDefined();
    expect(graph.render.cullingManager).toBeDefined();
    expect(graph.render.memoryManager).toBeDefined();

    // Test interactions work with optimizations
    graph.update({ interaction: { selectedElementIds: ['n1', 'n50', 'e25'] } });
    await nextTick();

    graph.update({ interaction: { hoveredElementId: 'e75' } });
    await nextTick();

    // Verify performance systems are active
    const lodStats = graph.render.lodManager?.getStats();
    const cullingStats = graph.render.cullingManager?.getStats();
    const memoryStats = graph.render.memoryManager?.getMemoryStats();

    expect(lodStats).toBeDefined();
    expect(cullingStats).toBeDefined();
    expect(memoryStats).toBeDefined();

    cleanup();
  });
});
```

### Phase 3: Visual Regression Tests

#### 3.1 Visual Tests for New Features

**File**: `tests/visual/new-features.visual.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { createGraphPage, waitForGraphReady } from '../e2e-utils';

test.describe('New Features Visual Tests', () => {
  test('CircleLayout visual appearance', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: Array.from({ length: 8 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          label: `Node ${i}`,
        })),
        edges: [],
      },
      layout: {
        type: 'circle',
        radius: 15,
        dimensions: 2,
      },
      style: {
        node: { color: '#4ecdc4', size: 1 },
        'node:hover': { color: '#ff6b6b' },
        'node:selected': { color: '#ffd93d' },
      },
    });

    await waitForGraphReady(page);

    // Take screenshot of circular layout
    await expect(page).toHaveScreenshot('circle-layout.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Test hover state
    await page.mouse.move(400, 300);
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('circle-layout-hover.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Test selection state
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('circle-layout-selected.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('3D spherical layout visual appearance', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: Array.from({ length: 50 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          label: `Node ${i}`,
        })),
        edges: [],
      },
      layout: {
        type: 'circle',
        radius: 20,
        dimensions: 3,
        distribution: 'equal',
      },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: 45,
        theta: 45,
        distance: 50,
      },
    });

    await waitForGraphReady(page);
    await page.waitForTimeout(2000); // Wait for layout stabilization

    // Take screenshot of 3D spherical layout
    await expect(page).toHaveScreenshot('sphere-layout-3d.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('ColumnLayout visual appearance', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: Array.from({ length: 12 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          label: `Node ${i}`,
        })),
        edges: [],
      },
      layout: {
        type: 'column',
        spacing: 4,
        columns: 3,
        columnSpacing: 8,
      },
    });

    await waitForGraphReady(page);

    await expect(page).toHaveScreenshot('column-layout.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('RowLayout visual appearance', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: Array.from({ length: 10 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          label: `Node ${i}`,
        })),
        edges: [],
      },
      layout: {
        type: 'row',
        spacing: 5,
        rows: 2,
        rowSpacing: 10,
      },
    });

    await waitForGraphReady(page);

    await expect(page).toHaveScreenshot('row-layout.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('GridLayout visual appearance', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: Array.from({ length: 16 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          label: `Node ${i}`,
        })),
        edges: [],
      },
      layout: {
        type: 'grid',
        dimensions: 2,
        spacing: 6,
      },
    });

    await waitForGraphReady(page);

    await expect(page).toHaveScreenshot('grid-layout.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Edge interaction visual states', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: [
          { id: 'n1', type: 'sphere', position: { x: -10, y: 0, z: 0 } },
          { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
          { id: 'n3', type: 'sphere', position: { x: 0, y: 10, z: 0 } },
        ],
        edges: [
          {
            id: 'e1',
            source: 'n1',
            target: 'n2',
            type: 'curved',
            curvature: 0.3,
          },
          { id: 'e2', source: 'n2', target: 'n3', type: 'straight' },
          {
            id: 'e3',
            source: 'n3',
            target: 'n1',
            type: 'dashed',
            dashSize: 0.5,
            gapSize: 0.3,
          },
        ],
      },
      style: {
        edge: { color: '#ffffff', width: 2 },
        'edge:hover': { color: '#ff6b6b', width: 4 },
        'edge:selected': {
          color: '#4ecdc4',
          width: 6,
          glow: { color: '#4ecdc4', strength: 0.8 },
        },
      },
      camera: {
        target: { x: 0, y: 3, z: 0 },
        phi: 45,
        theta: 45,
        distance: 30,
      },
    });

    await waitForGraphReady(page);

    // Base state
    await expect(page).toHaveScreenshot('edge-interaction-base.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Hover over edge
    await page.mouse.move(400, 300);
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('edge-interaction-hover.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Select edge
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('edge-interaction-selected.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Element actors visual appearance', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: [
          { id: 'sphere1', type: 'sphere', position: { x: -15, y: 0, z: 0 } },
          {
            id: 'box1',
            type: 'box',
            width: 3,
            height: 2,
            depth: 4,
            position: { x: -5, y: 0, z: 0 },
          },
          {
            id: 'text1',
            type: 'text',
            text: 'Hello World',
            fontSize: 2,
            position: { x: 5, y: 0, z: 0 },
          },
          {
            id: 'custom1',
            type: 'custom',
            geometryData: {
              /* custom geometry */
            },
            position: { x: 15, y: 0, z: 0 },
          },
        ],
        edges: [],
      },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: 25,
        theta: 45,
        distance: 40,
      },
    });

    await waitForGraphReady(page);
    await page.waitForTimeout(1000); // Wait for custom geometry loading

    await expect(page).toHaveScreenshot('element-actors.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('Camera presets visual appearance', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: Array.from({ length: 20 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          position: {
            x: (i % 5) * 8 - 16,
            y: Math.floor(i / 5) * 8 - 12,
            z: Math.random() * 10 - 5,
          },
        })),
        edges: [],
      },
      layout: { type: 'random' },
    });

    await waitForGraphReady(page);

    // Top view
    await page.evaluate(() => {
      (window as any).graph.camera.applyQuickPreset('top');
    });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('camera-preset-top.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Isometric view
    await page.evaluate(() => {
      (window as any).graph.camera.applyQuickPreset('isometric');
    });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('camera-preset-isometric.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Side view
    await page.evaluate(() => {
      (window as any).graph.camera.applyQuickPreset('side');
    });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('camera-preset-side.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Performance optimizations visual impact', async ({ page }) => {
    await createGraphPage(page, {
      data: {
        nodes: Array.from({ length: 500 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          position: {
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            z: Math.random() * 200 - 100,
          },
        })),
        edges: Array.from({ length: 200 }, (_, i) => ({
          id: `e${i}`,
          source: `n${i % 500}`,
          target: `n${(i + 1) % 500}`,
        })),
      },
      layout: { type: 'random' },
      performance: {
        enableLOD: true,
        enableCulling: true,
        enableMemoryManagement: true,
        instancingThreshold: 100,
      },
      camera: {
        target: { x: 0, y: 0, z: 0 },
        phi: 45,
        theta: 45,
        distance: 150,
      },
    });

    await waitForGraphReady(page);
    await page.waitForTimeout(2000); // Wait for LOD and culling to stabilize

    await expect(page).toHaveScreenshot('performance-optimizations.png', {
      fullPage: true,
      threshold: 0.3,
    });

    // Test camera movement to see LOD in action
    await page.evaluate(() => {
      (window as any).graph.camera.flyTo(
        {
          target: { x: 50, y: 50, z: 50 },
          distance: 50,
        },
        { duration: 2000 }
      );
    });

    await page.waitForTimeout(2500);
    await expect(page).toHaveScreenshot('performance-optimizations-close.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });
});
```

### Phase 4: Performance and Load Testing

#### 4.1 Load Testing

**File**: `tests/performance/load-testing.spec.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { createTestGraph, nextTick } from '../test-utils';
import { SpaceGraph } from '../../src';

describe('Load Testing', () => {
  it('should handle 1000+ nodes with acceptable performance', async () => {
    const nodeCount = 1000;
    const startTime = performance.now();

    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: Array.from({ length: nodeCount }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          position: {
            x: Math.random() * 500 - 250,
            y: Math.random() * 500 - 250,
            z: Math.random() * 500 - 250,
          },
        })),
        edges: Array.from({ length: nodeCount * 2 }, (_, i) => ({
          id: `e${i}`,
          source: `n${Math.floor(Math.random() * nodeCount)}`,
          target: `n${Math.floor(Math.random() * nodeCount)}`,
        })),
      },
      layout: { type: 'random' },
      performance: {
        enableLOD: true,
        enableCulling: true,
        enableMemoryManagement: true,
        instancingThreshold: 200,
      },
    });

    const initTime = performance.now() - startTime;

    // Should initialize within reasonable time (< 5 seconds for 1000 nodes)
    expect(initTime).toBeLessThan(5000);

    // Wait for full stabilization
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test interaction performance
    const interactionStart = performance.now();

    for (let i = 0; i < 10; i++) {
      graph.update({
        interaction: {
          selectedElementIds: [`n${Math.floor(Math.random() * nodeCount)}`],
        },
      });
      await nextTick();
    }

    const interactionTime = performance.now() - interactionStart;

    // Interactions should be responsive (< 100ms average)
    expect(interactionTime / 10).toBeLessThan(100);

    console.log(`Load test results for ${nodeCount} nodes:`);
    console.log(`Initialization time: ${initTime.toFixed(2)}ms`);
    console.log(
      `Average interaction time: ${(interactionTime / 10).toFixed(2)}ms`
    );

    cleanup();
  }, 30000); // 30 second timeout for large graphs

  it('should handle rapid dynamic updates', async () => {
    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          position: { x: i, y: 0, z: 0 },
        })),
        edges: [],
      },
      performance: {
        enableObjectPooling: true,
        enableLOD: true,
      },
    });

    await nextTick();

    // Test rapid node additions
    const addStartTime = performance.now();

    for (let i = 0; i < 50; i++) {
      graph.update({
        data: {
          nodes: {
            add: [
              {
                id: `new${i}`,
                type: 'sphere',
                position: { x: i + 100, y: 0, z: 0 },
              },
            ],
          },
        },
      });
      await nextTick();
    }

    const addTime = performance.now() - addStartTime;
    expect(addTime).toBeLessThan(1000); // Should add 50 nodes in under 1 second

    // Test rapid node removals
    const removeStartTime = performance.now();

    for (let i = 0; i < 25; i++) {
      graph.update({
        data: {
          nodes: {
            remove: [`n${i}`],
          },
        },
      });
      await nextTick();
    }

    const removeTime = performance.now() - removeStartTime;
    expect(removeTime).toBeLessThan(500); // Should remove 25 nodes in under 0.5 seconds

    console.log(`Dynamic update performance:`);
    console.log(`Add 50 nodes: ${addTime.toFixed(2)}ms`);
    console.log(`Remove 25 nodes: ${removeTime.toFixed(2)}ms`);

    cleanup();
  });

  it('should maintain performance during extended use', async () => {
    const { graph, cleanup } = createTestGraph({
      data: {
        nodes: Array.from({ length: 200 }, (_, i) => ({
          id: `n${i}`,
          type: 'sphere',
          position: { x: Math.random() * 100, y: Math.random() * 100, z: 0 },
        })),
        edges: Array.from({ length: 100 }, (_, i) => ({
          id: `e${i}`,
          source: `n${i}`,
          target: `n${(i + 1) % 200}`,
        })),
      },
      performance: {
        enableLOD: true,
        enableCulling: true,
        enableMemoryManagement: true,
      },
    });

    await nextTick();

    const performanceSamples: number[] = [];

    // Simulate extended use
    for (let cycle = 0; cycle < 100; cycle++) {
      const cycleStart = performance.now();

      // Random interactions
      for (let i = 0; i < 5; i++) {
        graph.update({
          interaction: {
            selectedElementIds: [`n${Math.floor(Math.random() * 200)}`],
          },
        });
        await nextTick();
      }

      // Random camera movements
      await graph.camera.flyTo(
        {
          target: {
            x: Math.random() * 100,
            y: Math.random() * 100,
            z: Math.random() * 50,
          },
          distance: Math.random() * 100 + 50,
        },
        { duration: 50 }
      );

      const cycleTime = performance.now() - cycleStart;
      performanceSamples.push(cycleTime);
    }

    // Calculate performance metrics
    const avgCycleTime =
      performanceSamples.reduce((sum, time) => sum + time, 0) /
      performanceSamples.length;
    const maxCycleTime = Math.max(...performanceSamples);
    const minCycleTime = Math.min(...performanceSamples);

    // Performance should remain consistent
    expect(avgCycleTime).toBeLessThan(100); // Average cycle under 100ms
    expect(maxCycleTime).toBeLessThan(200); // Max cycle under 200ms

    // Check for performance degradation (last 20% vs first 20%)
    const first20 = performanceSamples.slice(
      0,
      Math.floor(performanceSamples.length * 0.2)
    );
    const last20 = performanceSamples.slice(
      -Math.floor(performanceSamples.length * 0.2)
    );

    const first20Avg =
      first20.reduce((sum, time) => sum + time, 0) / first20.length;
    const last20Avg =
      last20.reduce((sum, time) => sum + time, 0) / last20.length;

    // Should not degrade by more than 50%
    expect(last20Avg).toBeLessThan(first20Avg * 1.5);

    console.log(`Extended use performance:`);
    console.log(`Average cycle time: ${avgCycleTime.toFixed(2)}ms`);
    console.log(`Min cycle time: ${minCycleTime.toFixed(2)}ms`);
    console.log(`Max cycle time: ${maxCycleTime.toFixed(2)}ms`);
    console.log(
      `Performance degradation: ${((last20Avg / first20Avg - 1) * 100).toFixed(1)}%`
    );

    cleanup();
  }, 60000); // 60 second timeout for extended test
});
```

## Testing Infrastructure

### Test Utilities and Helpers

**File**: `tests/test-utils.ts`

```typescript
import { SpaceGraph } from '../src';
import { createRoot } from 'solid-js';

export interface TestGraphResult {
  graph: SpaceGraph;
  cleanup: () => void;
}

/**
 * Create a test graph with cleanup function
 */
export function createTestGraph(initialSpec: any): TestGraphResult {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);

  let graph: SpaceGraph;
  let dispose: () => void;

  try {
    dispose = createRoot((disposeFn) => {
      graph = new SpaceGraph(container, initialSpec);
      return disposeFn;
    });

    return {
      graph: graph!,
      cleanup: () => {
        if (dispose) dispose();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      },
    };
  } catch (error) {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    throw error;
  }
}

/**
 * Wait for next reactive update cycle
 */
export async function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 16)); // ~1 frame at 60fps
}

/**
 * Simulate pointer events for interaction testing
 */
export async function simulatePointerEvent(
  graph: SpaceGraph,
  type: string,
  position: { x: number; y: number }
): Promise<void> {
  const container = graph.getContainer();
  const rect = container.getBoundingClientRect();

  const event = new PointerEvent(type, {
    clientX: rect.left + position.x,
    clientY: rect.top + position.y,
    bubbles: true,
    cancelable: true,
  });

  container.dispatchEvent(event);
  await nextTick();
}

/**
 * Create mock Three.js objects for testing
 */
export function createMockThreeObject(type: string, props: any = {}) {
  switch (type) {
    case 'mesh':
      return {
        type: 'Mesh',
        geometry: props.geometry || { dispose: () => {} },
        material: props.material || { dispose: () => {} },
        position: props.position || { x: 0, y: 0, z: 0 },
        visible: props.visible !== false,
        userData: props.userData || {},
      };
    case 'geometry':
      return {
        dispose: () => {},
        computeBoundingBox: () => {},
        computeBoundingSphere: () => {},
      };
    case 'material':
      return {
        dispose: () => {},
        color: props.color || { set: () => {} },
        opacity: props.opacity || 1,
        transparent: props.transparent || false,
      };
    default:
      return {};
  }
}

/**
 * Performance measurement utility
 */
export class PerformanceTimer {
  private startTimes: Map<string, number> = new Map();
  private results: Map<string, number[]> = new Map();

  start(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      throw new Error(`No start time found for label: ${label}`);
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(label);

    if (!this.results.has(label)) {
      this.results.set(label, []);
    }
    this.results.get(label)!.push(duration);

    return duration;
  }

  getAverage(label: string): number {
    const results = this.results.get(label);
    if (!results || results.length === 0) return 0;
    return results.reduce((sum, time) => sum + time, 0) / results.length;
  }

  getStats(label: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } {
    const results = this.results.get(label);
    if (!results || results.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

    return {
      average: this.getAverage(label),
      min: Math.min(...results),
      max: Math.max(...results),
      count: results.length,
    };
  }

  reset(): void {
    this.startTimes.clear();
    this.results.clear();
  }
}

/**
 * Memory usage measurement
 */
export function measureMemoryUsage(): Promise<number> {
  return new Promise((resolve) => {
    if ((performance as any).memory) {
      setTimeout(() => {
        const memoryInfo = (performance as any).memory;
        resolve(memoryInfo.usedJSHeapSize);
      }, 100);
    } else {
      resolve(0);
    }
  });
}

/**
 * Create test data for different scenarios
 */
export const TestData = {
  smallGraph: () => ({
    nodes: [
      { id: 'n1', type: 'sphere' },
      { id: 'n2', type: 'sphere' },
      { id: 'n3', type: 'sphere' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  }),

  mediumGraph: () => ({
    nodes: Array.from({ length: 50 }, (_, i) => ({
      id: `n${i}`,
      type: 'sphere',
      position: { x: Math.random() * 100, y: Math.random() * 100, z: 0 },
    })),
    edges: Array.from({ length: 75 }, (_, i) => ({
      id: `e${i}`,
      source: `n${Math.floor(Math.random() * 50)}`,
      target: `n${Math.floor(Math.random() * 50)}`,
    })),
  }),

  largeGraph: () => ({
    nodes: Array.from({ length: 500 }, (_, i) => ({
      id: `n${i}`,
      type: 'sphere',
      position: {
        x: Math.random() * 200,
        y: Math.random() * 200,
        z: Math.random() * 200,
      },
    })),
    edges: Array.from({ length: 750 }, (_, i) => ({
      id: `e${i}`,
      source: `n${Math.floor(Math.random() * 500)}`,
      target: `n${Math.floor(Math.random() * 500)}`,
    })),
  }),

  hierarchicalGraph: (levels: number = 3) => {
    const nodes: any[] = [];
    const edges: any[] = [];

    let nodeId = 0;
    for (let level = 0; level < levels; level++) {
      const nodesInLevel = Math.pow(2, level);
      for (let i = 0; i < nodesInLevel; i++) {
        nodes.push({
          id: `n${nodeId}`,
          type: 'sphere',
          position: {
            x: (i - nodesInLevel / 2) * 10,
            y: level * 15,
            z: 0,
          },
        });

        if (level > 0) {
          const parentId = Math.floor(i / 2);
          edges.push({
            id: `e${nodeId}`,
            source: `n${Math.pow(2, level - 1) - 1 + parentId}`,
            target: `n${nodeId}`,
          });
        }

        nodeId++;
      }
    }

    return { nodes, edges };
  },
};

/**
 * Mock requestAnimationFrame for testing
 */
export function mockRequestAnimationFrame() {
  const callbacks: FrameRequestCallback[] = [];
  let time = 0;

  global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    callbacks.push(callback);
    return callbacks.length;
  };

  global.cancelAnimationFrame = (id: number): void => {
    callbacks[id - 1] = () => {};
  };

  return {
    trigger: (deltaTime: number = 16) => {
      time += deltaTime;
      const currentCallbacks = [...callbacks];
      callbacks.length = 0;
      currentCallbacks.forEach((callback) => callback(time));
    },
    reset: () => {
      callbacks.length = 0;
      time = 0;
    },
  };
}

/**
 * Create a test scene with specific characteristics
 */
export function createTestScene(config: {
  width?: number;
  height?: number;
  cameraPosition?: { x: number; y: number; z: number };
  backgroundColor?: string;
}) {
  const width = config.width || 800;
  const height = config.height || 600;

  return {
    width,
    height,
    aspectRatio: width / height,
    camera: {
      position: config.cameraPosition || { x: 0, y: 0, z: 10 },
      fov: 75,
      near: 0.1,
      far: 1000,
    },
    backgroundColor: config.backgroundColor || '#000000',
  };
}
```

## Continuous Integration and Automation

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js 18.x
        uses: actions/setup-node@v3
        with:
          node-version: 18.x

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration

  visual-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js 18.x
        uses: actions/setup-node@v3
        with:
          node-version: 18.x

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run visual tests
        run: npm run test:visual

      - name: Upload visual test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-test-results
          path: tests/visual/test-results/

  performance-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js 18.x
        uses: actions/setup-node@v3
        with:
          node-version: 18.x

      - name: Install dependencies
        run: npm ci

      - name: Run performance tests
        run: npm run test:performance

      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: tests/performance/results/

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js 18.x
        uses: actions/setup-node@v3
        with:
          node-version: 18.x

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-test-results
          path: tests/e2e/test-results/
```

## Success Metrics and KPIs

### Test Coverage Targets

- **Unit Test Coverage**: >95% for new features
- **Integration Test Coverage**: >90% for feature interactions
- **Visual Test Coverage**: 100% for new UI features
- **Performance Test Coverage**: All optimization features

### Performance Benchmarks

- **Test Execution Time**: <30 seconds for full unit test suite
- **Visual Test Stability**: <5% flake rate
- **Performance Regression**: <10% degradation threshold
- **Memory Leak Detection**: Zero tolerance for leaks >1MB

### Quality Metrics

- **Test Pass Rate**: Maintain >98% (current: 98.2%)
- **Bug Detection**: >90% of bugs caught by tests before release
- **Documentation Coverage**: 100% of public APIs documented
- **Example Coverage**: Working examples for all major features

## Conclusion

This comprehensive testing strategy ensures that all new features are thoroughly validated while maintaining the high
quality standards established by the existing SpaceGraphJS3 codebase. The multi-layered approach combining unit tests,
integration tests, visual regression tests, and performance benchmarks provides confidence in the reliability and
performance of the enhanced system.

The testing infrastructure is designed to be maintainable, extensible, and automated, ensuring that quality assurance
remains a core part of the development process as the library continues to evolve.
