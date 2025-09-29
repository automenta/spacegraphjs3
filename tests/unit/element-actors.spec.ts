import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { BoxElementActor } from '../../src/renderers/elementActors/BoxElementActor';
import { CustomGeometryActor } from '../../src/renderers/elementActors/CustomGeometryActor';
import { TextElementActor } from '../../src/renderers/elementActors/TextElementActor';
import { SphereElementActor } from '../../src/renderers/elementActors/SphereElementActor';
import { HtmlNodeElementActor } from '../../src/renderers/elementActors/HtmlNodeElementActor';
import { SpaceGraph } from '../../src/core/SpaceGraph';
import { Spec, HtmlNodeSpec } from '../../src/types';

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

    it('should dispose correctly', async () => {
      const actor = new BoxElementActor(scene, mockElementState, mockGraphState);
      actor.init();
      
      // Capture the threeObject before disposal
      const threeObject = actor['threeObject'];
      
      // Mock the safeDisposeObject function
      const utilsModule = await import('../../src/utils/threeUtils');
      const disposeSpy = vi.spyOn(utilsModule, 'safeDisposeObject');
      
      actor.dispose();
      
      // Check that safeDisposeObject was called with the captured threeObject
      expect(disposeSpy).toHaveBeenCalledWith(threeObject);
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

  describe('HtmlNodeElementActor', () => {
    let htmlElementState: HtmlNodeSpec;

    beforeEach(() => {
      htmlElementState = {
        id: 'html-node',
        type: 'html',
        position: { x: 0, y: 0, z: 0 },
        content: '<div>Hello World</div>',
        className: 'test-html-node'
      };
    });

    it('should create an HTML node element actor', () => {
      const actor = new HtmlNodeElementActor(scene, htmlElementState, mockGraphState);
      expect(actor).toBeInstanceOf(HtmlNodeElementActor);
    });

    it('should initialize correctly', () => {
      const actor = new HtmlNodeElementActor(scene, htmlElementState, mockGraphState);
      actor.init();
      
      // Check that the threeObject was created
      expect(actor['threeObject']).toBeDefined();
      expect(actor['threeObject']).toBeInstanceOf(THREE.Object3D);
      
      // Check that the CSS3D object has the correct element
      const css3DObject: any = actor['threeObject'];
      expect(css3DObject.element.innerHTML).toBe('<div>Hello World</div>');
      expect(css3DObject.element.className).toBe('test-html-node');
    });

    it('should update visuals correctly', () => {
      const actor = new HtmlNodeElementActor(scene, htmlElementState, mockGraphState);
      actor.init();
      
      // Update the element state
      const updatedState = {
        ...htmlElementState,
        content: '<div>Updated Content</div>',
        className: 'updated-html-node',
        position: { x: 10, y: 20, z: 30 }
      };
      
      // Mock the update method to test visual updates
      (actor as any).updateVisuals(updatedState, false, false);
      
      // Check that the element content was updated
      const css3DObject: any = actor['threeObject'];
      expect(css3DObject.element.innerHTML).toBe('<div>Updated Content</div>');
      expect(css3DObject.element.className).toBe('updated-html-node');
      expect(css3DObject.position).toEqual(new THREE.Vector3(10, 20, 30));
    });

    it('should dispose correctly', async () => {
      const actor = new HtmlNodeElementActor(scene, htmlElementState, mockGraphState);
      actor.init();
      
      // Capture the threeObject before disposal
      const threeObject = actor['threeObject'];
      
      // Mock the safeDisposeObject function
      const utilsModule = await import('../../src/utils/threeUtils');
      const disposeSpy = vi.spyOn(utilsModule, 'safeDisposeObject');
      
      actor.dispose();
      
      // Check that safeDisposeObject was called with the captured threeObject
      expect(disposeSpy).toHaveBeenCalledWith(threeObject);
    });

    it('should be registered with SpaceGraph', () => {
      const registry = SpaceGraph.getElementActorRegistry();
      expect(registry.has('html')).toBe(true);
      expect(registry.get('html')).toBe(HtmlNodeElementActor);
    });
  });
});