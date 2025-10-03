# SpaceGraphJS

⚠️ **STATUS: ALL FEATURES FULLY IMPLEMENTED AND OPERATIONAL** ⚠️

Declarative, high-performance library for creating interactive 2D/3D visualizations.

SpaceGraphJS functions as an intelligent orchestrator, translating a declarative `Spec` into a live scene by managing a
suite of best-in-class tools for rendering, interaction, and physics.

## Recent Improvements

We've recently made significant improvements to the codebase:

- **Element Actors Refactoring**: Eliminated code duplication with a new inheritance-based architecture
- **Memory Management Enhancements**: Improved resource disposal and leak prevention
- **Event Handling Improvements**: Fixed TypeScript issues and added disposal safety
- **Layout Engine Optimizations**: Improved performance for large graphs
- **Rendering Performance**: Implemented geometry caching for edges
- **Documentation Consolidation**: Removed duplicate documentation and consolidated into comprehensive guides

For details, see [CODEBASE_IMPROVEMENTS_SUMMARY.md](doc/CODEBASE_IMPROVEMENTS_SUMMARY.md)

## Features

- ✅ All 6 layout engines (force-directed, grid, circle, column, row, random)
- ✅ All 5 element actors (sphere, box, text, custom geometry, html)
- ✅ Complete edge interaction system (hover, click, selection)
- ✅ Rich interactive HTML nodes in 3D space
- ✅ Enhanced CameraPlugin with auto-zoom, presets, and advanced controls
- ✅ HUDPlugin with REPL console for interactive debugging
- ✅ Performance optimizations (instancing, BVH, object pooling)
- ✅ BasicRenderer for debugging instancing issues

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

### HTML Nodes

HTML nodes allow you to embed rich interactive HTML content directly in 3D space. They support all standard HTML
elements, CSS styling, and user interactions.

#### Creating HTML Nodes

```javascript
const htmlNode = {
  id: 'html-node-1',
  type: 'html',
  position: { x: 0, y: 0, z: 0 },
  content: '<div class="my-node"><h3>My Node</h3><p>Rich HTML content</p></div>',
  className: 'my-node-class'
};
```

#### HTML Node Properties

- `content`: HTML string content to display in the node
- `className`: CSS class name to apply to the node container

#### Interacting with HTML Nodes

HTML nodes support all standard interactions:

- Click events
- Hover effects
- Dragging to reposition
- Form elements and controls
- CSS animations and transitions

See `examples/html-node-demo.html` for a complete example.

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

### BasicRenderer for Debugging

The BasicRenderer is an alternative rendering backend that can be used for debugging instancing issues. To use it, set
`performance.useBasicRenderer: true` in your spec.

## Documentation

We've consolidated our documentation into comprehensive guides that accurately reflect the current implementation:

- [Layout Engines - Consolidated Guide](doc/LAYOUT_ENGINES_CONSOLIDATED.md): Complete documentation for all layout
  engines with implementation details
- [Element Actors - Consolidated Guide](doc/ELEMENT_ACTORS_CONSOLIDATED.md): Comprehensive guide to all element actors
  with implementation details
- [Edge Interaction - Consolidated Guide](doc/EDGE_INTERACTION_CONSOLIDATED.md): Complete documentation for edge
  interaction system with implementation details

## Examples

We've consolidated our examples into fewer, more comprehensive demos that showcase all major features:

- `examples/comprehensive-demo.ts`: A single comprehensive demo showcasing all element types, edge types, and
  interactions
- `examples/basic.ts`: A minimal example for getting started
- `examples/large-graph.ts`: Performance demonstration with large graphs
- `examples/layout-engines-demo.ts`: Interactive demo for switching between layout engines
- `examples/edge-interaction-demo.ts`: Detailed edge interaction demonstration
- `examples/element-actors-demo.ts`: Comprehensive element actors demonstration
- `examples/html-node-demo.ts`: HTML nodes demonstration
- `examples/instanced-interaction.ts`: Instancing and interaction demonstration
- `examples/performance-optimizations.ts`: Performance optimization techniques
- `examples/visible-rendering-demo.ts`: Visible rendering demonstration

See the `examples/` directory for various demonstrations of the library's capabilities.

## License

ISC
