import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { BoxElementActor } from '../../src/renderers/elementActors/BoxElementActor';
import { CustomGeometryActor } from '../../src/renderers/elementActors/CustomGeometryActor';
import { TextElementActor } from '../../src/renderers/elementActors/TextElementActor';
import { SphereElementActor } from '../../src/renderers/elementActors/SphereElementActor';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { Spec } from '../../src/types';

describe('Element Actors', () => {
  let scene: THREE.Scene;
  let mockElementState: any;
  let mockGraphState: any;

  beforeEach(() => {
    scene = new THREE.Scene();
    mockElementState = {
      id: 'test-node',
      type: 'test',
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000'
    };
    mockGraphState = {
      interaction: {
        hoveredElementId: null,
        selectedElementIds: []
      },
      style: {}
    };
  });

  describe('BoxElementActor', () => {
    it('should create a box element actor', () => {
      const actor = new BoxElementActor(scene, mockElementState, mockGraphState);
      expect(actor).toBeInstanceOf(BoxElementActor);
      // BoxElementActor inherits from BaseElementActor
      const baseActor = actor as any;
      expect(typeof baseActor.init).toBe('function');
      expect(typeof baseActor.dispose).toBe('function');
      expect(typeof baseActor.getRaycastableObject).toBe('function');
    });

    it('should initialize correctly', () => {
      const actor = new BoxElementActor(scene, mockElementState, mockGraphState);
      actor.init();
      
      // Check that the threeObject was created
      expect(actor['threeObject']).toBeDefined();
      expect(actor['threeObject']).toBeInstanceOf(THREE.Group);
      
      // Check that the group has children (main mesh and glow mesh)
      const group = actor['threeObject'] as THREE.Group;
      expect(group.children).toHaveLength(2);
      
      // Check that the main mesh is a BoxGeometry
      const mainMesh = group.children[0] as THREE.Mesh;
      expect(mainMesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
      
      // Check that the glow mesh is also a BoxGeometry
      const glowMesh = group.children[1] as THREE.Mesh;
      expect(glowMesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
      expect(glowMesh.userData.isGlow).toBe(true);
    });

    it('should dispose correctly', () => {
      const actor = new BoxElementActor(scene, mockElementState, mockGraphState);
      actor.init();
      
      // Mock the dispose methods
      const group = actor['threeObject'] as THREE.Group;
      const mainMesh = group.children[0] as THREE.Mesh;
      const glowMesh = group.children[1] as THREE.Mesh;
      
      const geometryDisposeSpy = vi.spyOn(mainMesh.geometry, 'dispose');
      const materialDisposeSpy = vi.spyOn(mainMesh.material as THREE.Material, 'dispose');
      const glowGeometryDisposeSpy = vi.spyOn(glowMesh.geometry, 'dispose');
      const glowMaterialDisposeSpy = vi.spyOn(glowMesh.material as THREE.Material, 'dispose');
      
      actor.dispose();
      
      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
      expect(glowGeometryDisposeSpy).toHaveBeenCalled();
      expect(glowMaterialDisposeSpy).toHaveBeenCalled();
    });
  });

  describe('CustomGeometryActor', () => {
    it('should create a custom geometry element actor', () => {
      const actor = new CustomGeometryActor(scene, mockElementState, mockGraphState);
      expect(actor).toBeInstanceOf(CustomGeometryActor);
    });

    it('should initialize correctly', () => {
      const actor = new CustomGeometryActor(scene, mockElementState, mockGraphState);
      actor.init();
      
      // Check that the threeObject was created
      expect(actor['threeObject']).toBeDefined();
      expect(actor['threeObject']).toBeInstanceOf(THREE.Group);
      
      // Check that the group has children (main mesh and glow mesh)
      const group = actor['threeObject'] as THREE.Group;
      expect(group.children).toHaveLength(2);
      
      // Check that the main mesh is an IcosahedronGeometry
      const mainMesh = group.children[0] as THREE.Mesh;
      expect(mainMesh.geometry).toBeInstanceOf(THREE.IcosahedronGeometry);
      
      // Check that the glow mesh is also an IcosahedronGeometry
      const glowMesh = group.children[1] as THREE.Mesh;
      expect(glowMesh.geometry).toBeInstanceOf(THREE.IcosahedronGeometry);
      expect(glowMesh.userData.isGlow).toBe(true);
    });
  });

  describe('TextElementActor', () => {
    it('should create a text element actor', () => {
      const actor = new TextElementActor(scene, mockElementState, mockGraphState);
      expect(actor).toBeInstanceOf(TextElementActor);
    });

    it('should initialize correctly', () => {
      const actor = new TextElementActor(scene, mockElementState, mockGraphState);
      actor.init();
      
      // Check that the threeObject was created
      expect(actor['threeObject']).toBeDefined();
      expect(actor['threeObject']).toBeInstanceOf(THREE.Group);
      
      // Check that the group has children (text placeholder and glow mesh)
      const group = actor['threeObject'] as THREE.Group;
      expect(group.children).toHaveLength(2);
      
      // Check that the text placeholder is a BoxGeometry
      const textPlaceholder = group.children[0] as THREE.Mesh;
      expect(textPlaceholder.geometry).toBeInstanceOf(THREE.BoxGeometry);
      
      // Check that the glow mesh is also a BoxGeometry
      const glowMesh = group.children[1] as THREE.Mesh;
      expect(glowMesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
      expect(glowMesh.userData.isGlow).toBe(true);
    });
  });

  describe('Element Actor Registration', () => {
    it('should register new element actors with SpaceGraph', () => {
      const registry = SpaceGraph.getElementActorRegistry();
      
      expect(registry.has('box')).toBe(true);
      expect(registry.has('custom')).toBe(true);
      expect(registry.has('text')).toBe(true);
      
      expect(registry.get('box')).toBe(BoxElementActor);
      expect(registry.get('custom')).toBe(CustomGeometryActor);
      expect(registry.get('text')).toBe(TextElementActor);
    });
  });
});