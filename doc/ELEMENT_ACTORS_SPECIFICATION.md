# SpaceGraphJS3 Element Actors Specification

## Overview

This document specifies the implementation of additional element actors for SpaceGraphJS3, including BoxElementActor, CustomGeometryActor, and TextElementActor. These actors extend the current SphereElementActor to provide more diverse 3D visualization capabilities.

## BaseElementActor Architecture

All element actors inherit from [`BaseElementActor`](src/renderers/elementActors/BaseElementActor.ts) which provides:
- Scene management
- Reactive state integration
- Resource cleanup
- Raycastable object interface

## Implemented Element Actors

### ✅ SphereElementActor (Existing)
**File**: [`src/renderers/elementActors/SphereElementActor.ts`](src/renderers/elementActors/SphereElementActor.ts)
**Features**:
- Sphere geometry with configurable radius
- Glow effects for selection/hover states
- Color management with hex expansion
- BVH acceleration support
- Reactive updates for position, color, and visual states

## New Element Actors to Implement

### 🔧 BoxElementActor

**File**: `src/renderers/elementActors/BoxElementActor.ts`

**NodeSpec Extension**:
```typescript
export interface BoxNodeSpec extends NodeSpec {
  width?: number;    // Box width (default: 1.0)
  height?: number;   // Box height (default: 1.0)  
  depth?: number;    // Box depth (default: 1.0)
  rounded?: boolean; // Use rounded box geometry (default: false)
}
```

**Implementation Requirements**:
```typescript
export class BoxElementActor extends BaseElementActor {
  private glowMesh!: THREE.Mesh;
  private mainMesh!: THREE.Mesh;
  private readonly elementId: string;

  constructor(
    scene: THREE.Scene,
    elementState: Element,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
  }

  public init(): void {
    // Create group for the box element
    const group = new THREE.Group();
    this.threeObject = group;
    this.threeObject.userData.nodeId = this.elementId;
    this.scene.add(this.threeObject);

    // Get dimensions from node spec or use defaults
    const width = (this.elementState as BoxNodeSpec).width ?? 1.0;
    const height = (this.elementState as BoxNodeSpec).height ?? 1.0;
    const depth = (this.elementState as BoxNodeSpec).depth ?? 1.0;
    const rounded = (this.elementState as BoxNodeSpec).rounded ?? false;

    // Create appropriate geometry
    const geometry = rounded 
      ? new THREE.RoundedBoxGeometry(width, height, depth, 4, 0.1)
      : new THREE.BoxGeometry(width, height, depth);
    
    geometry.computeBoundsTree();

    // Create material with initial color
    const initialColor = new THREE.Color();
    try {
      const colorValue = this.elementState.color || '#ffffff';
      initialColor.set(expandHex(colorValue));
    } catch (error) {
      console.warn(`Invalid initial color for box node ${this.elementState.id}:`, this.elementState.color);
      initialColor.set('#ff00ff'); // Fallback to magenta
    }

    const material = new THREE.MeshBasicMaterial({ color: initialColor });
    this.mainMesh = new THREE.Mesh(geometry, material);
    this.mainMesh.userData.nodeId = this.elementId;
    group.add(this.mainMesh);

    // Create glow mesh
    const glowGeometry = rounded
      ? new THREE.RoundedBoxGeometry(width, height, depth, 4, 0.1)
      : new THREE.BoxGeometry(width, height, depth);
    
    const glowMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
    });
    
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glowMesh.scale.set(1.2, 1.2, 1.2);
    this.glowMesh.userData.isGlow = true;
    group.add(this.glowMesh);

    // Set up reactive updates
    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => this.update());
      return dispose;
    });
  }

  private update(): void {
    // Similar to SphereElementActor.update() but for box elements
    // Handle position, color, hover, selection states
  }

  public dispose(): void {
    // Clean up geometries, materials, and effects
    super.dispose();
  }
}
```

**Registration**:
```typescript
// In SpaceGraph.registerDefaults() or similar
SpaceGraph.registerType('box', BoxElementActor);
SpaceGraph.registerInstancedType('box', new THREE.BoxGeometry(1, 1, 1));
```

### 🔧 CustomGeometryActor

**File**: `src/renderers/elementActors/CustomGeometryActor.ts`

**NodeSpec Extension**:
```typescript
export interface CustomGeometryNodeSpec extends NodeSpec {
  geometryUrl?: string;        // URL to load geometry from
  geometryData?: any;          // Inline geometry data
  geometryType?: 'json' | 'obj' | 'gltf' | 'buffer'; // Geometry format
  material?: {
    type: 'basic' | 'standard' | 'phong';
    color?: string;
    transparent?: boolean;
    opacity?: number;
    // ... other material properties
  };
}
```

**Implementation Requirements**:
```typescript
export class CustomGeometryActor extends BaseElementActor {
  private mainMesh!: THREE.Mesh;
  private readonly elementId: string;
  private geometryLoader!: THREE.Loader;

  constructor(
    scene: THREE.Scene,
    elementState: Element,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
  }

  public async init(): Promise<void> {
    // Create group for the custom geometry
    const group = new THREE.Group();
    this.threeObject = group;
    this.threeObject.userData.nodeId = this.elementId;
    this.scene.add(this.threeObject);

    // Load or create geometry based on node spec
    const geometry = await this.loadGeometry();
    geometry.computeBoundsTree();

    // Create material based on specification
    const material = this.createMaterial();

    this.mainMesh = new THREE.Mesh(geometry, material);
    this.mainMesh.userData.nodeId = this.elementId;
    group.add(this.mainMesh);

    // Set up reactive updates
    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => this.update());
      return dispose;
    });
  }

  private async loadGeometry(): Promise<THREE.BufferGeometry> {
    const nodeSpec = this.elementState as CustomGeometryNodeSpec;
    
    if (nodeSpec.geometryUrl) {
      // Load from URL
      return await this.loadGeometryFromUrl(nodeSpec.geometryUrl, nodeSpec.geometryType);
    } else if (nodeSpec.geometryData) {
      // Create from data
      return this.createGeometryFromData(nodeSpec.geometryData, nodeSpec.geometryType);
    } else {
      // Default to simple box
      return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  private createMaterial(): THREE.Material {
    const nodeSpec = this.elementState as CustomGeometryNodeSpec;
    const materialSpec = nodeSpec.material || { type: 'basic' };
    
    switch (materialSpec.type) {
      case 'standard':
        return new THREE.MeshStandardMaterial({
          color: materialSpec.color || '#ffffff',
          transparent: materialSpec.transparent || false,
          opacity: materialSpec.opacity ?? 1.0,
        });
      case 'phong':
        return new THREE.MeshPhongMaterial({
          color: materialSpec.color || '#ffffff',
          transparent: materialSpec.transparent || false,
          opacity: materialSpec.opacity ?? 1.0,
        });
      default:
        return new THREE.MeshBasicMaterial({
          color: materialSpec.color || '#ffffff',
          transparent: materialSpec.transparent || false,
          opacity: materialSpec.opacity ?? 1.0,
        });
    }
  }

  private update(): void {
    // Handle position updates, material changes, etc.
  }
}
```

### 🔧 TextElementActor

**File**: `src/renderers/elementActors/TextElementActor.ts`

**NodeSpec Extension**:
```typescript
export interface TextNodeSpec extends NodeSpec {
  text: string;                    // The text content (required)
  fontUrl?: string;               // URL to font file
  fontSize?: number;              // Font size (default: 1.0)
  fontWeight?: 'normal' | 'bold'; // Font weight
  textAlign?: 'left' | 'center' | 'right'; // Text alignment
  verticalAlign?: 'top' | 'middle' | 'bottom'; // Vertical alignment
  color?: string;                 // Text color
  backgroundColor?: string;       // Background color (for 2D text)
  billboard?: boolean;            // Always face camera
  maxWidth?: number;              // Maximum text width for wrapping
}
```

**Implementation Requirements**:
```typescript
export class TextElementActor extends BaseElementActor {
  private textMesh!: THREE.Mesh;
  private readonly elementId: string;
  private font!: THREE.Font;

  constructor(
    scene: THREE.Scene,
    elementState: Element,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;
  }

  public async init(): Promise<void> {
    // Load font if specified
    const nodeSpec = this.elementState as TextNodeSpec;
    if (nodeSpec.fontUrl) {
      this.font = await this.loadFont(nodeSpec.fontUrl);
    } else {
      // Use default font
      this.font = await this.loadDefaultFont();
    }

    this.createTextMesh();
    
    // Set up reactive updates
    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => this.update());
      return dispose;
    });
  }

  private createTextMesh(): void {
    const nodeSpec = this.elementState as TextNodeSpec;
    const text = nodeSpec.text || '';
    const fontSize = nodeSpec.fontSize || 1.0;

    // Create text geometry
    const geometry = new THREE.TextGeometry(text, {
      font: this.font,
      size: fontSize,
      height: fontSize * 0.1, // Small depth for 3D effect
      curveSegments: 12,
    });

    // Center the geometry
    geometry.computeBoundingBox();
    const centerOffset = this.calculateCenterOffset(geometry, nodeSpec);

    // Create material
    const color = nodeSpec.color || '#ffffff';
    const material = new THREE.MeshBasicMaterial({ color });

    this.textMesh = new THREE.Mesh(geometry, material);
    this.textMesh.position.copy(centerOffset);
    this.textMesh.userData.nodeId = this.elementId;

    // Apply billboard effect if requested
    if (nodeSpec.billboard) {
      this.textMesh.userData.isBillboard = true;
    }

    this.threeObject = this.textMesh;
    this.scene.add(this.threeObject);
  }

  private update(): void {
    const nodeSpec = this.elementState as TextNodeSpec;
    
    // Update position
    if (this.elementState.position) {
      this.textMesh.position.set(
        this.elementState.position.x,
        this.elementState.position.y,
        this.elementState.position.z
      );
    }

    // Handle billboard effect
    if (nodeSpec.billboard && this.graphState.camera) {
      this.textMesh.lookAt(
        this.graphState.camera.target.x,
        this.graphState.camera.target.y,
        this.graphState.camera.target.z
      );
    }

    // Update color if changed
    if (this.elementState.color) {
      (this.textMesh.material as THREE.MeshBasicMaterial).color.set(
        expandHex(this.elementState.color)
      );
    }
  }

  private async loadFont(url: string): Promise<THREE.Font> {
    // Implementation for loading font from URL
    // This would typically use THREE.FontLoader or similar
  }

  private async loadDefaultFont(): Promise<THREE.Font> {
    // Load a built-in default font
    // Could embed a simple font or use system fallback
  }
}
```

## Registration and Integration

### Element Actor Registration
Update the SpaceGraph registration system to include new element actors:

```typescript
// In src/core/SpaceGraph.ts
import { BoxElementActor } from '../renderers/elementActors/BoxElementActor';
import { CustomGeometryActor } from '../renderers/elementActors/CustomGeometryActor';
import { TextElementActor } from '../renderers/elementActors/TextElementActor';

private static elementActorRegistry: Map<string, ElementActorClass> = new Map([
  ['sphere', SphereElementActor],
  ['box', BoxElementActor],
  ['custom', CustomGeometryActor],
  ['text', TextElementActor],
  ['html', HtmlNodeElementActor], // Special case for HTML nodes
]);
```

### Instanced Geometry Registration
For performance, register instanced versions:

```typescript
SpaceGraph.registerInstancedType('box', new THREE.BoxGeometry(1, 1, 1));
// Text and custom geometry typically don't work well with instancing
```

## Usage Examples

### Box Nodes
```typescript
const graph = new SpaceGraph('#container', {
  data: {
    nodes: [
      { 
        id: 'box1', 
        type: 'box',
        width: 2,
        height: 1,
        depth: 3,
        rounded: true,
        color: '#ff0000'
      }
    ],
    edges: []
  },
  // ... other config
});
```

### Custom Geometry Nodes
```typescript
const graph = new SpaceGraph('#container', {
  data: {
    nodes: [
      { 
        id: 'custom1', 
        type: 'custom',
        geometryUrl: '/models/my-model.obj',
        geometryType: 'obj',
        material: {
          type: 'standard',
          color: '#00ff00',
          transparent: true,
          opacity: 0.8
        }
      }
    ],
    edges: []
  },
  // ... other config
});
```

### Text Nodes
```typescript
const graph = new SpaceGraph('#container', {
  data: {
    nodes: [
      { 
        id: 'text1', 
        type: 'text',
        text: 'Hello World',
        fontSize: 2,
        color: '#ffffff',
        billboard: true,
        textAlign: 'center'
      }
    ],
    edges: []
  },
  // ... other config
});
```

## Testing Requirements

### Unit Tests
- Geometry creation and disposal
- Material management
- Reactive updates
- Resource cleanup
- Error handling for invalid inputs

### Integration Tests
- Registration with SpaceGraph
- Interaction with layout engines
- Style system integration
- Performance with multiple actors

### Visual Tests
- Reference images for each actor type
- Visual consistency across different configurations
- Animation and transition testing

## Performance Considerations

### Memory Management
- Proper disposal of geometries and materials
- Texture cleanup for text actors
- Font unloading when possible

### Rendering Optimization
- Use instancing for simple geometries when possible
- Billboard optimization for text actors
- Material sharing where appropriate

### Loading Optimization
- Async font loading for text actors
- Geometry caching for custom actors
- Progressive loading strategies

This specification provides a complete blueprint for implementing the missing element actors while maintaining consistency with the existing architecture and performance standards.