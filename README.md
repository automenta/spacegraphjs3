# SpaceGraphJS

⚠️ **STATUS: ALL FEATURES FULLY IMPLEMENTED AND OPERATIONAL** ⚠️

Declarative, high-performance library for creating interactive 2D/3D visualizations. 

SpaceGraphJS functions as an intelligent orchestrator, translating a declarative `Spec` into a live scene by managing a suite of best-in-class tools for rendering, interaction, and physics.

## Features

- ✅ All 6 layout engines (force-directed, grid, circle, column, row, random)
- ✅ All 4 element actors (sphere, box, text, custom geometry)
- ✅ Complete edge interaction system (hover, click, selection)
- ✅ Enhanced CameraPlugin with auto-zoom, presets, and advanced controls
- ✅ HUDPlugin with REPL console for interactive debugging
- ✅ Performance optimizations (instancing, BVH, object pooling)

## Quick Start

```javascript
// 1. Instantiate with the initial Spec.
const graph = new SpaceGraph('#container', initialSpec);

// 2. Update the visualization by providing a new or partial Spec.
graph.update({
  style: { 'node:selected': { glow: { color: '#ff0000' } } },
});

// 3. Clean up all resources and reactive subscriptions.
graph.destroy();
```

## Architecture

SpaceGraphJS is built around a **Reactive Data Plane** powered by SolidJS. The core concept is a one-way data flow:

1. **Declarative Specification (`Spec`)**: Define the desired state of your visualization
2. **Reactive State Management**: The library maintains a reactive state that mirrors your Spec
3. **Automatic Rendering**: Changes to the state are automatically reflected in the visualization

## API Overview

### Core Methods

- `new SpaceGraph(container, spec)`: Create a new graph instance
- `graph.update(spec)`: Update the graph with new specifications
- `graph.getElement(id)`: Retrieve an element by ID
- `graph.on(event, callback)`: Subscribe to events
- `graph.destroy()`: Clean up resources

### Controllers

- `graph.cameraPlugin`: Camera control with methods like `flyTo`, `frame`, `setView`
- Layout engines are automatically managed based on your spec

## Extensibility

SpaceGraphJS is designed to be extensible:

- **Custom Node Actors**: Register new element types with `SpaceGraph.registerType()`
- **Custom Instanced Geometries**: Optimize rendering with `SpaceGraph.registerInstancedType()`
- **Custom Layouts**: Add new layout algorithms with `SpaceGraph.registerLayout()`

## Performance

The library automatically scales performance based on graph size:
- Small graphs: Individual object rendering for maximum flexibility
- Large graphs: Automatic instancing for high-performance rendering

## Examples

See the `examples/` directory for various demonstrations of the library's capabilities.

## License

ISC
