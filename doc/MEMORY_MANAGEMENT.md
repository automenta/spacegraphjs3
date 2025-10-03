# Memory Management System

## Overview

The Memory Management system in SpaceGraph provides robust resource handling to prevent memory leaks and optimize
performance. It includes object pooling, safe disposal mechanisms, and tracking systems for Three.js objects.

## Components

### MemoryManager

The central memory management system that provides:

- Safe disposal of Three.js objects (geometries, materials, textures)
- Object tracking to prevent double disposal
- Batch disposal of multiple objects
- Integration with global object pooling

#### Key Features

1. **Safe Disposal**: Wraps disposal calls in try-catch blocks to prevent crashes
2. **Double Disposal Prevention**: Tracks disposed objects to prevent attempting to dispose them twice
3. **Recursive Cleanup**: Automatically disposes child objects and their resources
4. **Resource-Specific Handling**: Specialized disposal for different types of Three.js resources

#### Usage

```typescript
const memoryManager = MemoryManager.getInstance();

// Track an object for later disposal
memoryManager.trackObject(mesh);

// Dispose a specific object safely
memoryManager.disposeObject(mesh);

// Dispose all tracked objects
memoryManager.disposeAllTrackedObjects();
```

### ObjectPool

Generic object pooling implementation for recycling objects to reduce garbage collection:

- Pre-allocated objects for better performance
- Configurable pool sizes
- Automatic object resetting
- Support for custom creation and reset functions

#### Usage

```typescript
// Create a pool for Vector3 objects
const vector3Pool = new ObjectPool<THREE.Vector3>(
  () => new THREE.Vector3(),  // Creation function
  (vec) => vec.set(0, 0, 0),  // Reset function
  100,                        // Initial size
  1000                        // Max size
);

// Acquire an object from the pool
const vec = vector3Pool.acquire();

// Release an object back to the pool
vector3Pool.release(vec);
```

### ThreeObjectPoolManager

Global pool manager for all Three.js object pools:

- Pre-configured pools for common objects (Vector3, Matrix4, geometries, materials)
- Dynamic pool creation for parameterized objects (different sized geometries)
- Statistics tracking
- Easy access to pooled objects

#### Pre-configured Pools

- Vector3: For 3D vector operations
- Matrix4: For matrix transformations
- BoxGeometry: For box geometries with common sizes
- SphereGeometry: For sphere geometries with common parameters
- Material: For basic materials

#### Usage

```typescript
const poolManager = ThreeObjectPoolManager.getInstance();

// Get a pooled Vector3
const vec = poolManager.getVector3();
vec.set(1, 2, 3);

// Release it back to the pool
poolManager.releaseVector3(vec);

// Get a pooled BoxGeometry
const boxGeom = poolManager.getBoxGeometry(1, 1, 1);

// Release it back to the pool
poolManager.releaseBoxGeometry(boxGeom, 1, 1, 1);
```

### safeDispose Utilities

Utility functions for safely disposing Three.js objects:

- `safeDisposeObject()`: Disposes an entire Three.js object hierarchy
- `safeDisposeGeometry()`: Safely disposes a geometry
- `safeDisposeMaterial()`: Safely disposes a material or array of materials

#### Features

- Automatic removal from parent objects
- Recursive disposal of children
- Error handling to prevent crashes
- Support for bounds tree disposal (for spatial libraries)

## Performance Benefits

1. **Reduced Garbage Collection**: Object pooling minimizes object creation/destruction
2. **Faster Allocation**: Pooled objects are pre-allocated and ready to use
3. **Memory Leak Prevention**: Safe disposal ensures all resources are properly cleaned up
4. **Efficient Resource Reuse**: Common objects are reused instead of recreated

## Best Practices

1. **Use Pools for Frequently Created Objects**: Vector3, Matrix4, and temporary geometries
2. **Track Long-lived Objects**: Add objects to MemoryManager tracking for automatic cleanup
3. **Dispose Properly**: Always dispose of Three.js objects when no longer needed
4. **Use Utility Functions**: Prefer `safeDispose*` functions over direct disposal calls
5. **Batch Operations**: Use `disposeAllTrackedObjects()` when cleaning up scenes

## Integration Points

- **Element Actors**: Automatic disposal of meshes and materials
- **Edge Renderer**: Geometry caching and disposal
- **Rendering Manager**: Scene and renderer cleanup
- **Layout Engines**: Temporary object cleanup