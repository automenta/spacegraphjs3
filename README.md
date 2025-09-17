# **SpaceGraphJS: Fractal UI**

Declarative, high-performance library for creating interactive 2D/3D visualizations. The library functions as an
intelligent orchestrator, translating a declarative `Spec` into a live scene by managing a suite of best-in-class tools
for rendering, interaction, and physics.

---

### **1. Core Architectural Philosophy**

- **The Reactive Data Plane:** The library's core is a central, reactive state store, powered by a fine-grained
  reactivity system (e.g., SolidJS signals). This "Data Plane" is the single source of truth for the entire
  visualization.
- **Declarative Specification (`Spec`):** The developer defines the _desired state_ of the visualization through a
  single, serializable `Spec` object. The library's primary job is to make the rendered output continuously match this
  specification.
- **Stateless Modules:** All functional units (renderer, interaction manager, layout engine) are stateless. They either
  mutate the Data Plane (inputs) or react to changes on it (outputs). This ensures a predictable, one-way data flow and
  a highly decoupled architecture.
- **Synergistic Integration:** The library is built by orchestrating a curated stack of high-performance dependencies
  for rendering (Three.js), interaction (@use-gesture), animation (Popmotion), and layout (d3-force), focusing its own
  logic on the powerful glue that binds them.

---

### **2. The `SpaceGraph` API**

The public API is intentionally minimal, focusing on managing the reactive state and handling asynchronous events.

```javascript
// 1. Instantiate with the initial Spec.
// This creates the reactive Data Plane and renders the initial state.
const graph = new SpaceGraph('#container', initialSpec);

// 2. Update the visualization by providing a new or partial Spec.
// This merges the changes into the Data Plane, and the visuals update automatically.
graph.update({
  style: { 'node:selected': { glow: { color: '#ff0000' } } },
});

// 3. Access the reactive state directly for fine-grained control or inspection.
console.log(graph.state.camera.zoom); // Read a reactive value
graph.state.data.nodes.push({ id: 'n4', type: 'box' }); // Write to the state

// 4. Use controllers for actions that involve processes over time.
graph.camera.flyTo({ zoom: 2.0 }, { duration: 1000 });

// 5. Subscribe to events.
graph.on('element:click', ({ target }) => {
  // The event payload includes a direct reference to the element's state proxy.
  target.state.color = '#ffffff'; // This change is instantly rendered.
});

// 6. Clean up all resources and reactive subscriptions.
graph.destroy();
```

---

### **3. The `Spec` Object: The Blueprint**

The `Spec` object is the declarative blueprint for the visualization.

#### **3.1 `data`**

Defines the elements that exist in the scene.

- `nodes: Element[]`
- `edges: Edge[]`

**The `Element` Object:**

| Property  | Type                 | Description                                                            |
| --------- | -------------------- | ---------------------------------------------------------------------- |
| `id`      | `string`             | **Required.** Unique identifier.                                       |
| `type`    | `string`             | **Required.** Renderer type (e.g., `sphere`, `html`).                  |
| `pinning` | `object` \| `string` | Position: world-space `{x,y,z}` or screen-space `'top-left'`.          |
| `data`    | `object`             | Arbitrary, non-reactive user data payload.                             |
| `...`     | `any`                | Initial values for other reactive properties (e.g., `label`, `color`). |

#### **3.2 `style`**

A CSS-like `StyleSheet` that applies visual properties based on element state. These rules are reactively applied.

**Selector Syntax:** `node`, `edge`, `:hover`, `:selected`, `[type=html]`.

**Key Style Properties:** `color`, `size`, `opacity`, `label`, `frame`, `glow`, `width`.

#### **3.3 `layout`**

Defines the autonomous positioning engine.

| Property | Type     | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `type`   | `string` | Algorithm (`force-directed`, `grid`, `manual`). |
| `...`    | `any`    | Settings specific to the chosen layout type.    |

#### **3.4 `camera` & `controls`**

Defines the initial state and behavior of the viewport and user input.

---

### **4. The Reactive Data Plane (`graph.state`)**

Once instantiated, the `Spec` is used to create the live, reactive `graph.state` object. This is the library's core.
Modifying this object directly is a primary feature, enabling seamless integration with other frameworks and tools.

**Structure of `graph.state`:**

- **`data`**: A reactive version of the `spec.data` object. Arrays are reactive to additions/removals, and each element
  object within them is a reactive proxy.
  - `graph.state.data.nodes[0].position = {x: 10, y: 20, z: 0};` // The node moves.
- **`camera`**: A reactive object holding the camera's current `position`, `zoom`, etc.
- **`interaction`**: A reactive object tracking global interaction state.
  - `hoveredElementId: string | null`
  - `selectedElementIds: string[]`
- **`style`**, **`layout`**, **`controls`**: Reactive versions of their `Spec` counterparts.

**The `Element` State Proxy:**
When an element is clicked or accessed, the event payload or direct access provides a proxy to its state.

```javascript
// Accessing an element's state proxy
const nodeState = graph.getElement('n1');

// Reading a property
console.log(nodeState.position);

// Writing to a property (triggers a re-render)
nodeState.color = '#ff9900';
```

This proxy combines properties from the original data, the computed style, and the layout engine into a single, unified
view of the element's current state.

---

### **5. Controllers: Process-Oriented APIs**

For actions that are not instantaneous state changes (like animations), the library provides controllers. These
controllers interact with the Data Plane over time.

- **`graph.camera`**:
  - `flyTo(targetState, options)`: Animates the `graph.state.camera` properties to a new state using the animation
    engine.
  - `frame(elements, options)`: Calculates the required camera state to frame the given elements and then uses `flyTo`
    to execute the move.
- **`graph.layout`**:
  - `resume()`: Starts the layout simulation.
  - `pause()`: Stops the layout simulation.
  - `reheat()`: Adds energy back into a force-directed simulation.

---

### **6. Event System**

The event system fires in response to user actions. The payload is designed for maximum utility within the reactive
ecosystem.

**`graph.on(eventName, callback)`**

| Event Name            | Payload `{ target, domEvent }`                              | Description                                                                      |
| --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `element:click`       | `target`: The reactive state proxy for the clicked element. | Fired on click. Allows for immediate, direct state manipulation in the callback. |
| `element:hover:enter` | `target`: The state proxy for the hovered element.          | Fired when the cursor enters an element.                                         |
| `...`                 | ...                                                         | Other events (`drag:start`, `background:click`, etc.) follow the same pattern.   |

---

### **7. Extensibility**

The library's decoupled nature makes it highly extensible.

- **Custom Node Actors**: `SpaceGraph.registerType(name, ElementActorClass)` registers a new class responsible for
  creating and managing the Three.js objects for a custom element type. This is ideal for complex nodes with unique
  behaviors. The actor is given the element's state proxy and is expected to react to its changes.

- **Custom Instanced Geometries**: For high-performance rendering of many similar nodes, you can register a custom
  `THREE.BufferGeometry` with `SpaceGraph.registerInstancedType(name, geometry)`. When the number of nodes of that
  `type` exceeds the `instancingThreshold`, the library will automatically use the `InstancedRenderer` with your custom
  geometry.

- **Custom Layouts**: `SpaceGraph.registerLayout(name, LayoutEngineClass)` registers a new layout algorithm. The engine
  is given access to the reactive node/edge arrays and is expected to mutate their position properties.

### **8. Performance: Automatic Scaling**

SpaceGraphJS is designed for both small, simple diagrams and large, complex networks. To achieve this, it employs a
two-pronged rendering strategy that automatically adapts to the size of the graph.

- **Default Renderer (`NodeRenderer`)**: For smaller graphs, this renderer creates individual `THREE.Object3D` instances
  for each node. This approach is highly flexible and ideal for rich, heterogeneous scenes where each node might have
  unique behavior (managed by its `ElementActor`).

- **High-Performance Renderer (`InstancedRenderer`)**: When the number of nodes exceeds a certain threshold, the library
  automatically switches to a high-performance `InstancedRenderer`. This renderer uses `THREE.InstancedMesh` to draw
  many thousands of nodes in a single draw call, dramatically improving performance. It also uses `three-mesh-bvh` to
  accelerate raycasting, ensuring that interactions like hovering and clicking remain fluid even with massive graphs.

This switching is seamless and requires no manual intervention. You can, however, control the threshold at which this
switch occurs via the `performance` property in the `Spec`:

```javascript
const graph = new SpaceGraph('#container', {
  // ... other spec properties
  performance: {
    // Switch to the instanced renderer when there are more than 200 nodes.
    instancingThreshold: 200,
  },
});
```

This dual-renderer architecture provides the best of both worlds: the flexibility of individual objects for small graphs
and the raw power of instancing for large ones.

This specification provides a clear blueprint that directly maps to the synergistic implementation plan, resulting in a
library that is powerful, performant, and intuitive to use.

---

Excellent. This is the final distillation. This plan presents a decisive, high-level architectural strategy, focusing on
the synergy between a minimal set of elite dependencies. It is structured as a strategic roadmap for building a
best-in-class library.

---

### **Implementation Plan: SpaceGraphJS v3.1 (Definitive Edition)**

#### **Architectural Mandate: The Reactive Data Plane**

The core of SpaceGraphJS will be a **Reactive Data Plane**, powered by **SolidJS**. This is the central nervous system
of the entire library. It is the single source of truth. All other systems are stateless modules that either _mutate_
this plane (input/physics) or _react_ to it (rendering). This architecture provides maximum decoupling, testability, and
performance.

The development process is the sequential construction of this plane and the integration of specialized modules.

#### **The Core Synergy: A Curated Stack**

| Category            | **Chosen Dependency**    | **Synergistic Role & Justification**                                                                                                                                                                                                                             |
| ------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reactivity Core** | **SolidJS**              | **The Brain.** Provides the fine-grained reactive primitives (`signals`, `effects`) that form the Data Plane. Its non-VDOM, direct-update model is the perfect performance match for an imperative library like Three.js.                                        |
| **3D Rendering**    | **Three.js**             | **The Body.** The imperative rendering target. Its objects (`Mesh`, `Material`) are the final expression of the state. SolidJS effects will directly manipulate these objects, creating a highly efficient bridge between declarative state and visual output.   |
| **Interaction**     | **@use-gesture/vanilla** | **The Senses.** A headless, sophisticated gesture engine. It translates raw browser events into meaningful gestures (`drag`, `pinch`) and its sole job is to mutate signals on the Data Plane (e.g., `setCameraPosition`). It is completely unaware of Three.js. |
| **Animation**       | **Popmotion**            | **The Muscles.** A functional, low-level animation library. It provides the physics and easing for all transitions. It will be used to drive signals on the Data Plane over time, enabling smooth camera flights and style transitions.                          |
| **Physics Layout**  | **d3-force-3d**          | **The Autonomous System.** A self-contained simulation engine. It runs independently, and on each `tick`, its only job is to mutate the position signals of nodes on the Data Plane. It is completely unaware of rendering or interaction.                       |

---

### **The Implementation Roadmap**

#### **Phase 1: The Reactive Core & Visual Echo**

**Objective:** To create a one-way data flow where the state on the Data Plane is perfectly mirrored as a visual scene.

- **Core Task:** Implement the `ElementActor`. This is a class or factory that represents a single element. It is the
  critical bridge between a declarative signal and an imperative Three.js object.
- **Key Dependencies:** SolidJS, Three.js.
- **Architectural Outcome:** The `Spec` object becomes a live blueprint. The 3D scene is a "visual echo" of the state.
  Any change to a signal in the state is instantly and efficiently reflected in the corresponding mesh's properties (
  position, color, scale).
- **Definition of Done:**
  - [ ] A `Spec` object passed to the `SpaceGraph` constructor renders the correct number and type of elements.
  - [ ] Calling `graph.update()` with a changed `Spec` (e.g., adding/removing a node, changing a color) correctly
        updates the scene.
  - [ ] **Unit Tests (Vitest):** The state initialization and update logic is fully tested.
  - [ ] **Visual Tests (Playwright):** A suite of "golden image" snapshots for various static scenes passes.

#### **Phase 2: The Sensory Loop**

**Objective:** To close the loop by allowing user interaction to mutate the Data Plane.

- **Core Task:** Integrate `@use-gesture` and a `Raycaster` module to translate user input into state changes.
- **Key Dependencies:** `@use-gesture/vanilla`.
- **Architectural Outcome:** The system becomes interactive. The data flow is now a complete loop:
  `State -> Visuals -> User Input -> State`. Because the rendering is already reactive to the state, no new rendering
  logic is needed.
- **Definition of Done:**
  - [ ] Dragging the background updates the camera position signals, panning the view.
  - [ ] Pinching/scrolling updates the camera zoom signal.
  - [ ] Clicking an element updates the selection signals in the central state.
  - [ ] The `StyleSheet` engine correctly applies `:hover` and `:selected` styles in reaction to state changes.
  - [ ] **Visual Tests (Playwright):** Scripts simulating clicks and drags result in snapshots showing the correct
        visual feedback (e.g., selection glows).

#### **Phase 3: Autonomous Systems**

**Objective:** To integrate dynamic, time-based systems that manipulate the Data Plane independently.

- **Core Task:** Plug the `d3-force-3d` simulation and the Popmotion animation engine into the Data Plane.
- **Key Dependencies:** `d3-force-3d`, Popmotion.
- **Architectural Outcome:** The graph becomes a living simulation. The layout engine continuously updates node
  positions, and the renderer automatically follows. The `camera.flyTo()` method can execute complex, interruptible
  animations by driving camera state signals over time.
- **Definition of Done:**
  - [ ] Enabling a `force-directed` layout causes nodes to move and settle into a stable configuration.
  - [ ] Calling `camera.flyTo()` produces a smooth, animated transition to the target.
  - [ ] Animations and physics can run concurrently without interfering with user interaction.
  - [ ] **Visual Tests (Playwright):** Snapshots are taken after layouts stabilize to ensure deterministic results. A
        simple animation test verifies movement.

#### **Phase 4: Productionization & API Formalization**

**Objective:** To harden the system, optimize for performance, and encapsulate the internal complexity behind a clean,
public API.

- **Core Task:** Implement performance optimizations and build the final, developer-facing `SpaceGraph` class.
- **Key Dependencies:** `three-mesh-bvh` (for GPU-accelerated raycasting), Vite (for production bundling), TypeDoc (for
  documentation).
- **Architectural Outcome:** The library is transformed from a powerful internal architecture into a robust,
  distributable, and well-documented product.
- **Definition of Done:**
  - [ ] The public API is finalized and all internal complexity is encapsulated.
  - [ ] The `AdvancedRenderer` path using `InstancedMesh` is implemented and automatically enabled for large graphs.
  - [ ] Raycasting is accelerated with `three-mesh-bvh`.
  - [ ] The `graph.destroy()` method correctly disposes of all SolidJS effects, Three.js objects, and event listeners.
  - [ ] A full suite of API documentation, tutorials, and examples is generated and published.
  - [ ] The final package is bundled and published to npm.

---

# Original Notes

- Guidelines
  - The library loaded by a single import, and manages its own dependencies and resources.
  - This enables a developer to import the library in 1 line, and instantiate a SpaceGraph in another, with minimal
    boilerplate.
  - Forward-thinking, extensible API
- Camera
  - Smooth transitions, adjustable speed
- Layouts
  - Modes
    - Force-Directed (default: tuned well for general-purpose use)
    - Grid, Circle, Column, Row, etc...
    - Unoverlap: moves items just far enough to not overlap or cover other objects
  - Does not affect objects the user is interacting with
  - Throttled if compute intensive, LERP animated between delayed iterations
- Controls: Mouse, Touch, Keyboard
  - Drag translate, if not pinned
  - Drag resize, if resizeable
  - Camera
    - AutoZoom(targets)
    - Translate
      - trigger: left mouse button drags background
    - Rotate: access the side of elements, look "around the corner"
      - trigger: right mouse button drags background
    - Zoom: Mouse Wheel, +/- keys, etc...
- Nodes, Edges
  - Node Types
    - Box, Sphere
    - HTMLNode: renders interactive HTML surfaces, using CSS3D transforms
    - etc...
  - Edge Types
    - Straight, Curved, etc...
  - Appearance
    - Color
    - Icon (ex: emoji character)
    - Name label
    - Opacity
  - Decorations: visibility/opacity conditions, gesture interactions
    - Highlight frame: focused, hovered, etc...
    - Editable Bounds frame, for precise 3D positioning / scaling / rotating
    - Hover frame: can include text, icons, links, etc... to provide more context
    - etc...
  - Events: ex:`space.on(...)`
    - Hover
    - Focus
    - Click
    - AutoZoom
- Renderer
  - BasicRenderer
    - Simple Scenegraph management
  - AdvancedRenderer: high-performance
    - Instancing
    - Culling
    - LOD
    - Shader Pipeline
- HUD components: opacity, position, size, draggable, resizable
  - Menubar
  - Status bar
    - REPL/Console
    - Notifications
