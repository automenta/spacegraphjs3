# Enhanced SpaceGraphJS Features Documentation

## Overview

This document provides comprehensive documentation for the enhanced features added to SpaceGraphJS, including advanced
camera controls, visual feedback systems, enhanced interactions, performance optimization, and animation systems.

## Table of Contents

1. [Advanced Camera Controls](#advanced-camera-controls)
2. [Visual Feedback System](#visual-feedback-system)
3. [Enhanced Interaction System](#enhanced-interaction-system)
4. [Enhanced HUD System](#enhanced-hud-system)
5. [Performance Optimizer](#performance-optimizer)
6. [Enhanced Animation System](#enhanced-animation-system)
7. [Integration Example](#integration-example)
8. [Best Practices](#best-practices)

---

## Advanced Camera Controls

### Overview

The `AdvancedCameraControls` class provides sophisticated camera control capabilities with smooth animations,
constraints, and advanced movement patterns.

### Features

- **Smooth Damping**: Fluid camera movements with configurable damping
- **Auto-Rotation**: Automatic camera rotation around targets
- **Object Framing**: Automatic framing of selected objects
- **Gesture Support**: Touch and multi-touch gesture recognition
- **Constraint System**: Distance, angle, and rotation constraints
- **Animation Queue**: Queued camera movements for cinematic sequences

### Usage

```typescript
import { AdvancedCameraControls } from './src/utils/AdvancedCameraControls';

const cameraControls = new AdvancedCameraControls({
  camera: camera,
  domElement: renderer.domElement,
  options: {
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    autoRotate: false,
    autoRotateSpeed: 0.5,
    minDistance: 10,
    maxDistance: 200,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI
  }
});

// Update in animation loop
cameraControls.update();

// Frame objects
cameraControls.frameObjects([object1, object2]);

// Reset camera
cameraControls.reset();
```

### Configuration Options

| Option            | Type    | Default | Description              |
|-------------------|---------|---------|--------------------------|
| `enableDamping`   | boolean | true    | Enable smooth damping    |
| `dampingFactor`   | number  | 0.05    | Damping intensity (0-1)  |
| `enableZoom`      | boolean | true    | Enable zoom controls     |
| `enableRotate`    | boolean | true    | Enable rotation controls |
| `enablePan`       | boolean | true    | Enable pan controls      |
| `autoRotate`      | boolean | false   | Enable auto-rotation     |
| `autoRotateSpeed` | number  | 0.5     | Auto-rotation speed      |
| `minDistance`     | number  | 10      | Minimum zoom distance    |
| `maxDistance`     | number  | 200     | Maximum zoom distance    |
| `minPolarAngle`   | number  | 0       | Minimum polar angle      |
| `maxPolarAngle`   | number  | Math.PI | Maximum polar angle      |

---

## Visual Feedback System

### Overview

The `VisualFeedbackSystem` provides rich visual feedback for user interactions, including glow effects, pulsing,
particles, and color changes.

### Features

- **Multiple Feedback Types**: Hover, select, drag, click, context, error, success, warning, info
- **Glow Effects**: Configurable glow with color and intensity
- **Pulse Animations**: Rhythmic pulsing effects
- **Particle Systems**: Dynamic particle effects for special interactions
- **Color Transitions**: Smooth color changes
- **Scale Animations**: Object scaling effects
- **Configurable Intensity**: Adjustable feedback intensity

### Usage

```typescript
import { VisualFeedbackSystem } from './src/utils/VisualFeedbackSystem';

const visualFeedback = new VisualFeedbackSystem(scene);

// Apply hover feedback
visualFeedback.applyFeedback(object, {
  type: 'hover',
  intensity: 0.5,
  duration: 0,
  glow: true,
  pulse: false
});

// Apply selection feedback
visualFeedback.applyFeedback(object, {
  type: 'select',
  intensity: 0.8,
  duration: 0,
  glow: true,
  pulse: true,
  particles: true,
  color: '#00ff00'
});

// Clear feedback
visualFeedback.clearFeedback(object.uuid);
```

### Feedback Configuration

| Property    | Type         | Default  | Description                   |
|-------------|--------------|----------|-------------------------------|
| `type`      | FeedbackType | required | Type of feedback              |
| `color`     | string       | auto     | Feedback color                |
| `intensity` | number       | 1.0      | Feedback intensity (0-1)      |
| `duration`  | number       | 0        | Duration in ms (0 = infinite) |
| `scale`     | number       | 1.0      | Scale multiplier              |
| `pulse`     | boolean      | false    | Enable pulsing                |
| `glow`      | boolean      | true     | Enable glow effect            |
| `particles` | boolean      | false    | Enable particles              |
| `sound`     | boolean      | false    | Enable sound (future)         |

---

## Enhanced Interaction System

### Overview

The `EnhancedInteractionSystem` provides comprehensive interaction handling with visual feedback, gesture recognition,
and advanced event management.

### Features

- **Multi-Modal Input**: Mouse, touch, and keyboard support
- **Visual Feedback Integration**: Automatic visual feedback for interactions
- **Gesture Recognition**: Pinch, zoom, rotate gestures
- **Multi-Selection**: Ctrl+click for multiple selection
- **Drag and Drop**: Smooth object dragging
- **Context Menus**: Right-click context menus
- **Keyboard Shortcuts**: Comprehensive keyboard controls

### Usage

```typescript
import { EnhancedInteractionSystem } from './src/utils/EnhancedInteractionSystem';

const interactionSystem = new EnhancedInteractionSystem(
  scene,
  camera,
  {
    enableVisualFeedback: true,
    enableHapticFeedback: false,
    enableSoundFeedback: false,
    feedbackIntensity: 1.0,
    hoverDelay: 100,
    clickThreshold: 200,
    dragThreshold: 5,
    multiSelect: true,
    enableGestures: true
  }
);

// Set camera controls
interactionSystem.setCameraControls(cameraControls);

// Listen to events
interactionSystem.on('hoverstart', (object) => {
  console.log('Object hovered:', object);
});

interactionSystem.on('click', (object) => {
  console.log('Object clicked:', object);
});

interactionSystem.on('select', (object) => {
  console.log('Object selected:', object);
});
```

### Event Types

| Event         | Parameters                             | Description            |
|---------------|----------------------------------------|------------------------|
| `hoverstart`  | `object: THREE.Object3D`               | Object hover started   |
| `hoverend`    | `objectId: string`                     | Object hover ended     |
| `click`       | `object: THREE.Object3D`               | Object clicked         |
| `doubleclick` | `object: THREE.Object3D`               | Object double-clicked  |
| `select`      | `object: THREE.Object3D`               | Object selected        |
| `deselect`    | `object: THREE.Object3D`               | Object deselected      |
| `dragstart`   | `object: THREE.Object3D`               | Drag started           |
| `drag`        | `object: THREE.Object3D`               | Object being dragged   |
| `dragend`     | `objectId: string`                     | Drag ended             |
| `contextmenu` | `object: THREE.Object3D, event: Event` | Context menu requested |
| `keydown`     | `event: KeyboardEvent`                 | Key pressed            |
| `keyup`       | `event: KeyboardEvent`                 | Key released           |

---

## Enhanced HUD System

### Overview

The `EnhancedHUDSystem` provides a comprehensive heads-up display with interactive elements, performance monitoring, and
customizable UI components.

### Features

- **Interactive Elements**: Buttons, sliders, text, charts, panels
- **Performance Monitoring**: Real-time FPS, memory usage, draw calls
- **Animated Transitions**: Smooth show/hide animations
- **Customizable Styling**: Colors, fonts, borders, opacity
- **Notification System**: Toast notifications with different types
- **Responsive Design**: Adapts to screen size changes

### Usage

```typescript
import { EnhancedHUDSystem } from './src/utils/EnhancedHUDSystem';

const hudSystem = new EnhancedHUDSystem(container);

// Create elements
hudSystem.createElement({
  id: 'status-text',
  type: 'text',
  position: { x: 20, y: 20 },
  size: { width: 200, height: 30 },
  content: 'Ready',
  style: {
    textColor: '#ffffff',
    fontSize: 14
  }
});

// Update element content
hudSystem.updateElement('status-text', 'New status');

// Show notification
hudSystem.showNotification('Operation completed', 'success', 3000);

// Toggle element visibility
hudSystem.toggleElement('status-text', true, 500);
```

### Element Types

| Type     | Description        | Properties               |
|----------|--------------------|--------------------------|
| `text`   | Text display       | `content`, `style`       |
| `button` | Interactive button | `content`, `interactive` |
| `slider` | Range input        | `interactive`            |
| `chart`  | Data visualization | `content` (canvas)       |
| `panel`  | Container element  | `style`                  |
| `icon`   | Icon display       | `content`                |

---

## Performance Optimizer

### Overview

The `PerformanceOptimizer` provides comprehensive performance optimization including object pooling, frustum culling,
LOD management, and adaptive quality.

### Features

- **Object Pooling**: Reuse objects to reduce garbage collection
- **Frustum Culling**: Hide objects outside camera view
- **LOD Management**: Switch detail levels based on distance
- **Memory Management**: Automatic cleanup and disposal
- **Batching**: Combine similar objects for fewer draw calls
- **Instancing**: Efficient rendering of repeated objects
- **Adaptive Quality**: Automatically adjust quality based on performance
- **Performance Monitoring**: Real-time metrics and thresholds

### Usage

```typescript
import { PerformanceOptimizer } from './src/utils/PerformanceOptimizer';

const performanceOptimizer = new PerformanceOptimizer(
  scene,
  camera,
  renderer,
  {
    enableObjectPooling: true,
    enableFrustumCulling: true,
    enableLOD: true,
    enableMemoryManagement: true,
    enableBatching: true,
    enableInstancing: true,
    maxFPS: 60,
    targetFrameTime: 16.67,
    qualityLevel: 'high',
    adaptiveQuality: true
  }
);

// Get performance metrics
const metrics = performanceOptimizer.getMetrics();
console.log(`FPS: ${metrics.fps}, Memory: ${metrics.memoryUsage}MB`);

// Enable/disable optimizations
performanceOptimizer.setOptimizationEnabled(false);
```

### Configuration Options

| Option                   | Type    | Default | Description              |
|--------------------------|---------|---------|--------------------------|
| `enableObjectPooling`    | boolean | true    | Enable object pooling    |
| `enableFrustumCulling`   | boolean | true    | Enable frustum culling   |
| `enableLOD`              | boolean | true    | Enable level of detail   |
| `enableMemoryManagement` | boolean | true    | Enable memory management |
| `enableBatching`         | boolean | true    | Enable object batching   |
| `enableInstancing`       | boolean | true    | Enable instancing        |
| `maxFPS`                 | number  | 60      | Target maximum FPS       |
| `targetFrameTime`        | number  | 16.67   | Target frame time (ms)   |
| `qualityLevel`           | string  | 'high'  | Initial quality level    |
| `adaptiveQuality`        | boolean | true    | Enable adaptive quality  |

---

## Enhanced Animation System

### Overview

The `EnhancedAnimationSystem` provides advanced animation capabilities with multiple animation types, particle effects,
and complex sequences.

### Features

- **Multiple Animation Types**: Fade, scale, rotate, translate, color, glow, pulse, bounce, shake, morph, explode,
  implode, wave, spiral
- **Particle Systems**: Dynamic particle effects
- **Animation Sequences**: Chain multiple animations
- **Parallel Animations**: Run multiple animations simultaneously
- **Spring Physics**: Physics-based animations
- **Custom Easing**: Various easing functions
- **Loop Support**: Infinite or finite loops

### Usage

```typescript
import { EnhancedAnimationSystem } from './src/utils/EnhancedAnimationSystem';

const animationSystem = new EnhancedAnimationSystem(scene);

// Create simple animation
const animId = animationSystem.createAnimation(object, {
  type: 'pulse',
  duration: 1000,
  to: 0.8
});

// Create complex sequence
const sequenceId = animationSystem.createSequence([
  {
    object: object1,
    config: { type: 'scale', duration: 500, to: 1.5 },
    delay: 0
  },
  {
    object: object1,
    config: { type: 'rotate', duration: 1000, to: Math.PI * 2 },
    delay: 200
  },
  {
    object: object1,
    config: { type: 'color', duration: 800, to: 0xff0000 },
    delay: 400
  }
]);

// Stop animation
animationSystem.stopAnimation(animId);
```

### Animation Types

| Type        | Description        | Parameters        |
|-------------|--------------------|-------------------|
| `fade`      | Opacity animation  | `from`, `to`      |
| `scale`     | Size animation     | `from`, `to`      |
| `rotate`    | Rotation animation | `from`, `to`      |
| `translate` | Position animation | `from`, `to`      |
| `color`     | Color transition   | `from`, `to`      |
| `glow`      | Glow effect        | `from`, `to`      |
| `pulse`     | Pulsing animation  | `to`, `intensity` |
| `bounce`    | Bouncing animation | `to`, `spring`    |
| `shake`     | Shaking animation  | `to` (intensity)  |
| `morph`     | Geometry morphing  | `to` (factor)     |
| `explode`   | Explosion effect   | `from`, `to`      |
| `implode`   | Implosion effect   | `to` (scale)      |
| `wave`      | Wave motion        | `to` (amplitude)  |
| `spiral`    | Spiral motion      | `to` (radius)     |

---

## Integration Example

### Complete Integration

```typescript
import * as THREE from 'three';
import { SpaceGraph } from '../src/index';
import { AdvancedCameraControls } from '../src/utils/AdvancedCameraControls';
import { EnhancedInteractionSystem } from '../src/utils/EnhancedInteractionSystem';
import { EnhancedHUDSystem } from '../src/utils/EnhancedHUDSystem';
import { PerformanceOptimizer } from '../src/utils/PerformanceOptimizer';
import { EnhancedAnimationSystem } from '../src/utils/EnhancedAnimationSystem';
import { VisualFeedbackSystem } from '../src/utils/VisualFeedbackSystem';

// Initialize SpaceGraph
const spaceGraph = new SpaceGraph('#container', {
  data: { nodes: [], edges: [] },
  layout: { type: 'force-directed' },
  camera: { target: { x: 0, y: 0, z: 0 }, phi: 0, theta: 0, distance: 50 },
  controls: { keyboard: { enabled: true, panSpeed: 1, zoomSpeed: 1, orbitSpeed: 1 } },
  performance: { instancingThreshold: 100 },
  interaction: { hoveredElementId: null, selectedElementIds: [] },
  style: {}
});

// Get scene and camera
const scene = spaceGraph.scene;
const camera = spaceGraph.camera;

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Initialize enhanced systems
const cameraControls = new AdvancedCameraControls({
  camera,
  domElement: renderer.domElement,
  options: { enableDamping: true, dampingFactor: 0.05 }
});

const interactionSystem = new EnhancedInteractionSystem(scene, camera, {
  enableVisualFeedback: true,
  multiSelect: true,
  enableGestures: true
});

const hudSystem = new EnhancedHUDSystem(container);
const performanceOptimizer = new PerformanceOptimizer(scene, camera, renderer);
const animationSystem = new EnhancedAnimationSystem(scene);
const visualFeedback = new VisualFeedbackSystem(scene);

// Connect systems
interactionSystem.setCameraControls(cameraControls);
animationSystem.setLODManager(performanceOptimizer['lodManager']);
animationSystem.setCullingManager(performanceOptimizer['cullingManager']);

// Setup event handlers
interactionSystem.on('hoverstart', (object) => {
  visualFeedback.applyFeedback(object, { type: 'hover', glow: true });
});

interactionSystem.on('click', (object) => {
  animationSystem.createAnimation(object, { type: 'pulse', duration: 500 });
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  cameraControls.update();
  interactionSystem.update();
  animationSystem.update();
  
  const metrics = performanceOptimizer.getMetrics();
  hudSystem.updatePerformanceMetrics(metrics);
  
  renderer.render(scene, camera);
}

animate();
```

---

## Best Practices

### Performance Optimization

1. **Use Object Pooling**: Enable object pooling for frequently created/destroyed objects
2. **Enable Frustum Culling**: Always enable frustum culling for large scenes
3. **Implement LOD**: Use level of detail for complex objects
4. **Monitor Performance**: Regularly check performance metrics
5. **Adaptive Quality**: Enable adaptive quality for consistent frame rates

### User Experience

1. **Provide Visual Feedback**: Always give users immediate visual feedback
2. **Use Smooth Animations**: Prefer smooth, natural animations
3. **Implement Keyboard Shortcuts**: Provide keyboard alternatives to mouse actions
4. **Show Status Information**: Keep users informed about system state
5. **Handle Errors Gracefully**: Provide clear error messages and recovery options

### Development Guidelines

1. **Dispose Resources**: Always dispose of systems when done
2. **Handle Edge Cases**: Account for null objects and invalid states
3. **Test Thoroughly**: Test with different devices and input methods
4. **Document Code**: Provide clear documentation for complex features
5. **Monitor Memory**: Watch for memory leaks and excessive resource usage

### Integration Tips

1. **Initialize Order**: Initialize systems in the correct order (renderer → camera → controls → interaction → feedback)
2. **Event Handling**: Set up event handlers before adding data
3. **Error Handling**: Implement proper error handling for all systems
4. **Resource Management**: Share resources between systems when possible
5. **Testing**: Test integration thoroughly with real-world scenarios

---

## Conclusion

The enhanced SpaceGraphJS features provide a comprehensive set of tools for creating sophisticated, performant, and
user-friendly 3D graph visualizations. By following the documentation and best practices outlined here, developers can
create engaging and interactive experiences that leverage the full power of modern web technologies.

For additional support and examples, refer to the integration demo and source code comments.