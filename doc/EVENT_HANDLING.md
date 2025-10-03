# Event Handling System

## Overview

The Event Handling system in SpaceGraph provides a robust and type-safe mechanism for managing events throughout the
application. It uses the `mitt` library as a foundation but adds important features like disposal safety and improved
TypeScript support.

## Components

### EventManager

The central event management system that provides:

- Type-safe event registration and emission
- Disposal safety to prevent errors after cleanup
- Integration with the SpaceGraph lifecycle

#### Key Features

1. **Type Safety**: Full TypeScript support with typed events and payloads
2. **Disposal Safety**: Prevents registration and emission after disposal
3. **Memory Leak Prevention**: Automatic cleanup of event listeners
4. **Standard Interface**: Consistent API for event handling

#### Usage

```typescript
const eventManager = new EventManager();

// Register an event listener
const unsubscribe = eventManager.on('element:click', (payload) => {
  console.log('Element clicked:', payload.target);
});

// Emit an event
eventManager.emit('element:click', {
  target: node,
  event: pointerEvent
});

// Remove listener
unsubscribe();

// Or remove manually
eventManager.off('element:click', handler);

// Dispose all listeners
eventManager.dispose();
```

### Event Types

The system supports a comprehensive set of events:

#### Element Events

- `element:click`: User clicks on a node or edge
- `element:hover:enter`: Mouse enters a node or edge
- `element:hover:leave`: Mouse leaves a node or edge

#### Background Events

- `background:click`: User clicks on the background

#### Edge Events

- `edge:click`: User clicks on an edge
- `edge:hover:enter`: Mouse enters an edge
- `edge:hover:leave`: Mouse leaves an edge
- `edge:select`: Edge is selected
- `edge:multi-select`: Multiple edges are selected

#### Layout Events

- `layout:pin`: Nodes are pinned
- `layout:unpin`: Nodes are unpinned

#### Camera Events

- `camera:animation:start`: Camera animation begins
- `camera:animation:end`: Camera animation completes

## Integration with SpaceGraph

The EventManager is integrated into the SpaceGraph core:

```typescript
const graph = new SpaceGraph('#container', initialSpec);

// Listen to events directly on the graph
const unsubscribe = graph.on('element:click', (payload) => {
  console.log('Element clicked:', payload.target);
});
```

## Performance Considerations

1. **Efficient Dispatch**: Uses optimized event dispatching
2. **Minimal Overhead**: Lightweight wrapper around mitt
3. **Automatic Cleanup**: Prevents memory leaks through proper disposal
4. **Batch Processing**: Events can be processed in batches when needed

## Best Practices

1. **Always Unsubscribe**: Remove event listeners when no longer needed
2. **Use Graph Methods**: Prefer `graph.on()` over direct EventManager access
3. **Handle Disposal**: Ensure proper cleanup in component dispose methods
4. **Type Payloads**: Use TypeScript interfaces for event payloads
5. **Avoid Anonymous Functions**: Use named functions for easier debugging

## Extending Events

To add new event types:

1. Extend the `GraphEventMap` interface in `types.ts`:

```typescript
export type GraphEventMap = {
  // Existing events...
  'custom:event': { data: string };
};
```

2. Emit the event where needed:

```typescript
eventManager.emit('custom:event', { data: 'example' });
```

3. Listen to the event:

```typescript
eventManager.on('custom:event', (payload) => {
  console.log(payload.data);
});
```

## Error Handling

The EventManager includes built-in error handling:

- Prevents operations after disposal
- Logs warnings for invalid operations
- Graceful degradation when errors occur
- Type checking to prevent runtime errors

## Testing

The event system is designed to be easily testable:

- Mock event managers for unit tests
- Synchronous event emission for predictable testing
- Clear separation of concerns
- Comprehensive event coverage