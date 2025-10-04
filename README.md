# SpaceGraphJS

Declarative library for creating interactive 2D/3D visualizations. Translates declarative specifications into live scenes through intelligent orchestration of rendering, interaction, and physics tools.

## Project Details

- **Architecture**: Reactive Data Plane powered by SolidJS
- **Rendering**: Three.js with automatic performance scaling
- **Extensibility**: Plugin-based system for custom components
- **Performance**: Scales from small graphs to thousands of nodes

## Functionality

Core concept: One-way data flow from declarative `Spec` to reactive visualization state. Library manages rendering, interaction, layout, and physics automatically.

## Possibilities

Enables creation of complex, nested interfaces where UI elements exist in 3D space with natural physics-based interactions. Supports embedding rich HTML content, custom geometries, and multi-scale visualizations.

## Vision: Fractal UI

Introduces new paradigm for user interfaces: fractal-like structures where each element can contain nested, self-similar interfaces. Elements positioned in 3D space with physics-based layout engines create organic, explorable information landscapes. Interaction patterns scale from individual elements to entire graph structures, enabling intuitive navigation of complex data hierarchies.

## Features

### Core Architecture
- ✅ Reactive Data Plane (SolidJS)
- ✅ Declarative Specification (Spec)
- ✅ Plugin-based Architecture
- ✅ TypeScript Type Safety
- ✅ Comprehensive Event System

### Rendering System
- ✅ Three.js Integration
- ✅ Automatic Instanced Rendering
- ✅ BasicRenderer (debugging)
- ✅ HTML Node Rendering (CSS3DRenderer)
- ✅ Geometry Caching

### Layout Engines
- ✅ Force-directed (physics-based)
- ✅ Grid (2D/3D structured)
- ✅ Circle (circular/spherical)
- ✅ Column (vertical arrangement)
- ✅ Row (horizontal arrangement)
- ✅ Random (initial positioning)

### Element Types
- ✅ Sphere (configurable radius, glow effects)
- ✅ Box (configurable dimensions, rounded corners)
- ✅ Text (3D text with font/size/color styling)
- ✅ Custom Geometry (external model loading)
- ✅ HTML Nodes (rich interactive content)

### Interaction System
- ✅ Node Interaction (hover, click, drag, selection)
- ✅ Edge Interaction (hover, click, selection)
- ✅ Multi-selection (modifier keys)
- ✅ Curved/Dashed Edges
- ✅ Drag-to-reposition

### Camera Controls
- ✅ Orbital Controls
- ✅ FlyTo Animation
- ✅ Auto-zoom to Selection
- ✅ Camera Presets/Bookmarks
- ✅ Advanced Framing
- ✅ Rotation Constraints

### Performance Features
- ✅ Automatic Instancing (threshold-based)
- ✅ BVH Acceleration
- ✅ Object Pooling
- ✅ Level-of-Detail (LOD)
- ✅ Frustum/Occlusion Culling
- ✅ Memory Management
- ✅ Spec Validation

### Development Tools
- ✅ HUD REPL Console
- ✅ Visual Debugging
- ✅ Performance Monitoring
- ✅ Error Handling
- ✅ Comprehensive Testing

## Setup

1. Install: `npm install spacegraphjs`
2. Create container element
3. Instantiate with initial spec
4. Update spec for dynamic changes
5. Clean up on destruction

## Documentation

- [Layout Engines](doc/LAYOUT_ENGINES_CONSOLIDATED.md): Complete layout engine documentation
- [Element Actors](doc/ELEMENT_ACTORS_CONSOLIDATED.md): Element actor implementation details
- [Edge Interaction](doc/EDGE_INTERACTION_CONSOLIDATED.md): Edge interaction system guide
- [Camera Enhancement](doc/CAMERA_ENHANCEMENT_SPECIFICATION.md): Advanced camera features
- [Performance Optimization](doc/PERFORMANCE_OPTIMIZATION_SPECIFICATION.md): Performance tuning guide

## Examples

- `examples/comprehensive-demo.html`: All features demonstration
- `examples/layout-engines-demo.html`: Layout engine showcase
- `examples/element-actors-demo.html`: Element type examples
- `examples/edge-interaction-demo.html`: Edge interaction patterns
- `examples/html-node-demo.html`: HTML node integration
- `examples/large-graph.html`: Performance with 1000+ nodes
