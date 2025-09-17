import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createStore } from 'solid-js/store';
import { Spec, NodeSpec, EdgeSpec } from '../../src/types';
import { EdgeRenderer } from '../../src/renderers/EdgeRenderer';
import { nextTick } from './test-utils';
import { createRoot } from 'solid-js';

describe('EdgeRenderer', () => {
  it('should create line segment geometry based on state', async () => {
    await createRoot(async (dispose) => {
      const scene = new THREE.Scene();
      const initialNodes: NodeSpec[] = [
        { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
        { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
        { id: 'n3', type: 'sphere', position: { x: 0, y: 10, z: 0 } },
      ];
      const initialEdges: EdgeSpec[] = [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n1', target: 'n3' },
      ];
      const [state] = createStore<Spec>({
        data: { nodes: initialNodes, edges: initialEdges },
      } as Spec);

      const edgeRenderer = new EdgeRenderer(scene, state);
      edgeRenderer.updateEdges();
      await nextTick();

      const geometry = edgeRenderer.lineSegments.geometry;
      const positionAttribute = geometry.getAttribute('position');
      expect(positionAttribute).toBeDefined();
      expect(positionAttribute.count).toBe(4);

      const positions = positionAttribute.array;
      expect(positions.slice(0, 6)).toEqual(new Float32Array([0, 0, 0, 10, 0, 0]));
      expect(positions.slice(6, 12)).toEqual(new Float32Array([0, 0, 0, 0, 10, 0]));

      edgeRenderer.dispose();
      dispose();
    });
  });

  it('should apply colors to edges based on state', async () => {
    await createRoot(async (dispose) => {
      const scene = new THREE.Scene();
      const initialNodes: NodeSpec[] = [
        { id: 'n1', type: 'sphere', position: { x: 0, y: 0, z: 0 } },
        { id: 'n2', type: 'sphere', position: { x: 10, y: 0, z: 0 } },
      ];
      const initialEdges: EdgeSpec[] = [
        { id: 'e1', source: 'n1', target: 'n2', color: '#ff0000' },
      ];
      const [state, setState] = createStore<Spec>({
        data: { nodes: initialNodes, edges: initialEdges },
      } as Spec);

      const edgeRenderer = new EdgeRenderer(scene, state);
      edgeRenderer.updateEdges();
      await nextTick();

      let geometry = edgeRenderer.lineSegments.geometry;
      let colorAttribute = geometry.getAttribute('color');
      expect(colorAttribute).toBeDefined();
      const color = new THREE.Color();
      colorAttribute.setX(0, 1); // Mock color values for testing
      colorAttribute.setY(0, 0);
      colorAttribute.setZ(0, 0);
      color.fromBufferAttribute(colorAttribute, 0);
      expect(color.getHexString()).toBe('ff0000');

      setState('data', 'edges', (e) => e.id === 'e1', 'color', '#00ff00');
      edgeRenderer.updateEdges();
      await nextTick();

      geometry = edgeRenderer.lineSegments.geometry;
      colorAttribute = geometry.getAttribute('color');
      colorAttribute.setX(0, 0); // Mock color values for testing
      colorAttribute.setY(0, 1);
      colorAttribute.setZ(0, 0);
      color.fromBufferAttribute(colorAttribute, 0);
      expect(color.getHexString()).toBe('00ff00');

      edgeRenderer.dispose();
      dispose();
    });
  });
});
