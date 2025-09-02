# `src` Directory

This directory contains the source code for the SpaceGraphJS library.

## Architecture

The library is built around a central `SpaceGraph` class, which orchestrates several controller classes to manage the different aspects of the graph visualization.

-   **`SpaceGraph.ts`**: The main class that ties everything together. It initializes the renderer, scene, and all the controllers. It also provides the main API for interacting with the graph.

-   **`CameraController.ts`**: Manages the camera, including panning, zooming, and flying to different positions.

-   **`InteractionController.ts`**: Handles user interactions with the graph, such as clicking, dragging, and hovering over nodes.

-   **`LayoutController.ts`**: Manages the layout of the graph. It uses a force-directed layout algorithm from `d3-force-3d` to position the nodes and edges.

-   **`InstancedRenderer.ts`**: Renders the graph elements (nodes and edges) efficiently using instanced rendering with `three.js`.

-   **`HUDController.ts`**: Manages the Heads-Up Display (HUD), which currently only displays a simple menu bar.

-   **`createState.ts`**: A utility function that creates a reactive state object using SolidJS stores. It also provides an `updateState` function for updating the state in a predictable way.

-   **`types.ts`**: Contains all the type definitions for the application, including the main `Spec` interface, which defines the shape of the graph's configuration.

## Data Flow

The application uses a unidirectional data flow model. The state is held in a SolidJS store, and all updates to the state are done through the `updateState` function. The controllers and the renderer then react to changes in the state and update the view accordingly.
