import * as THREE from 'three';
import { createEffect, createRoot } from 'solid-js';
import { Store } from 'solid-js/store';
import { HtmlNodeSpec, NodeSpec, Spec } from '../../types';
import { BaseElementActor } from './BaseElementActor';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

/**
 * An ElementActor for rendering HTML nodes in 3D space.
 * This actor integrates HTML content with the Three.js scene using CSS3DRenderer.
 */
export class HtmlNodeElementActor extends BaseElementActor {
  private readonly elementId: string;
  private css3DObject!: CSS3DObject;
  private isDragging: boolean = false;
  private dragStartPoint: THREE.Vector3 = new THREE.Vector3();
  private elementStartPoint: THREE.Vector3 = new THREE.Vector3();
  private graphInstance: any = null;

  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
    this.elementId = elementState.id;

    // Try to get reference to the SpaceGraph instance
    try {
      // This is a workaround to get the SpaceGraph instance
      // In a real implementation, we would pass it directly
      if (typeof window !== 'undefined' && (window as any).graph) {
        this.graphInstance = (window as any).graph;
      }
    } catch (e) {
      // Ignore if we can't get the graph instance
      console.debug('Could not get graph instance:', e);
    }
  }

  public init(): void {
    // Create a CSS3D object for the HTML content
    const element = document.createElement('div');
    const htmlNodeState = this.elementState as HtmlNodeSpec;

    // Set initial content and class
    element.innerHTML = htmlNodeState.content || '';
    element.className = htmlNodeState.className || 'spacegraph-html-node';

    // Add default styles for better visibility and interaction
    element.style.pointerEvents = 'auto';
    element.style.userSelect = 'none';
    element.style.position = 'absolute'; // Required for CSS3D positioning
    element.style.transformStyle = 'preserve-3d';
    element.style.willChange = 'transform';

    // Enhanced widget styling for modern UI appearance
    element.style.background =
      'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95))';
    element.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    element.style.borderRadius = '12px';
    element.style.padding = '20px';
    element.style.minWidth = '240px';
    element.style.minHeight = '120px';
    element.style.boxShadow =
      '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
    element.style.backdropFilter = 'blur(20px)';
    element.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    element.style.fontSize = '14px';
    element.style.color = '#ffffff';
    element.style.overflow = 'hidden';
    element.style.lineHeight = '1.5';

    // Add subtle inner glow for depth
    element.style.position = 'relative';
    const innerGlow = document.createElement('div');
    innerGlow.style.position = 'absolute';
    innerGlow.style.top = '0';
    innerGlow.style.left = '0';
    innerGlow.style.right = '0';
    innerGlow.style.bottom = '0';
    innerGlow.style.borderRadius = '11px';
    innerGlow.style.padding = '1px';
    innerGlow.style.background =
      'linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent)';
    innerGlow.style.pointerEvents = 'none';
    element.appendChild(innerGlow);

    this.css3DObject = new CSS3DObject(element);
    this.css3DObject.userData.nodeId = this.elementId;
    this.threeObject = this.css3DObject;

    // The actual addition to the CSS3D scene is handled by the NodeRenderer
    // or HTMLRenderer depending on the implementation

    this.setupEventListeners();

    this.disposeEffect = createRoot((dispose) => {
      createEffect(() => this.update());
      return dispose;
    });
  }

  private setupEventListeners(): void {
    if (!this.css3DObject || !this.css3DObject.element) return;

    const element = this.css3DObject.element;

    // Add mouse event listeners for interaction
    element.addEventListener('mousedown', this.onMouseDown.bind(this));
    element.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    element.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    element.addEventListener('click', this.onClick.bind(this));

    // Add touch event listeners for mobile support
    element.addEventListener('touchstart', this.onTouchStart.bind(this), {
      passive: false,
    });

    // Prevent default browser behavior for better interaction
    element.addEventListener('dragstart', (e) => e.preventDefault());
  }

  private onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDragging = true;
    this.dragStartPoint.set(event.clientX, event.clientY, 0);

    // Store the initial position of the element
    if (this.elementState.position) {
      this.elementStartPoint.set(
        this.elementState.position.x,
        this.elementState.position.y,
        this.elementState.position.z
      );
    }

    // Add global mouse listeners for dragging
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 1) return; // Only handle single touch
    event.preventDefault();
    event.stopPropagation();

    const touch = event.touches[0];
    this.isDragging = true;
    this.dragStartPoint.set(touch.clientX, touch.clientY, 0);

    // Store the initial position of the element
    if (this.elementState.position) {
      this.elementStartPoint.set(
        this.elementState.position.x,
        this.elementState.position.y,
        this.elementState.position.z
      );
    }

    // Add global touch listeners for dragging
    document.addEventListener('touchmove', this.onTouchMove.bind(this), {
      passive: false,
    });
    document.addEventListener('touchend', this.onTouchEnd.bind(this), {
      passive: false,
    });
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.handleDrag(event.clientX, event.clientY);
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length > 1) return;
    event.preventDefault();
    event.stopPropagation();

    const touch = event.touches[0];
    this.handleDrag(touch.clientX, touch.clientY);
  }

  private handleDrag(clientX: number, clientY: number): void {
    // Calculate movement delta
    const deltaX = clientX - this.dragStartPoint.x;
    const deltaY = clientY - this.dragStartPoint.y;

    // Convert screen delta to 3D world coordinates
    // This is a simplified conversion - in a real implementation,
    // we would need to consider the camera and projection
    const worldDeltaX = deltaX * 0.02;
    const worldDeltaY = -deltaY * 0.02; // Invert Y axis

    // Update position
    const newPosition = {
      x: this.elementStartPoint.x + worldDeltaX,
      y: this.elementStartPoint.y + worldDeltaY,
      z: this.elementStartPoint.z,
    };

    // Emit event for position update through the graph instance
    if (this.graphInstance && this.graphInstance.update) {
      this.graphInstance.update({
        data: {
          nodes: {
            update: [
              {
                id: this.elementId,
                position: newPosition,
              },
            ],
          },
        },
      });
    } else {
      // Fallback to direct position update
      if (this.elementState.position) {
        (this.elementState as any).position = newPosition;
      }
    }
  }

  private onMouseUp(event: MouseEvent): void {
    // Prevent default to avoid any potential issues
    event.preventDefault();

    this.isDragging = false;

    // Remove global mouse listeners
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private onTouchEnd(event: TouchEvent): void {
    // Prevent default to avoid any potential issues
    event.preventDefault();

    this.isDragging = false;

    // Remove global touch listeners
    document.removeEventListener('touchmove', this.onTouchMove.bind(this));
    document.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onMouseEnter(event: MouseEvent): void {
    // Handle hover enter
    console.log(`Hover enter on HTML node ${this.elementId}`);

    // Emit hover enter event through the graph instance
    if (this.graphInstance && this.graphInstance.events) {
      this.graphInstance.events.emit('element:hover:enter', {
        target: this.elementState,
        event: event,
      });
    }
  }

  private onMouseLeave(event: MouseEvent): void {
    // Handle hover leave
    console.log(`Hover leave on HTML node ${this.elementId}`);

    // Emit hover leave event through the graph instance
    if (this.graphInstance && this.graphInstance.events) {
      this.graphInstance.events.emit('element:hover:leave', {
        target: this.elementState,
        event: event,
      });
    }
  }

  private onClick(event: MouseEvent): void {
    event.stopPropagation();
    // Handle click
    console.log(`Click on HTML node ${this.elementId}`);

    // Emit click event through the graph instance
    if (this.graphInstance && this.graphInstance.events) {
      this.graphInstance.events.emit('element:click', {
        target: this.elementState,
        event: event,
      });
    }
  }

  public getRaycastableObject(): THREE.Object3D | null {
    // Return the CSS3D object for raycasting
    return this.css3DObject;
  }

  public update(): void {
    const isSelected = this.graphState.interaction.selectedElementIds.includes(
      this.elementId
    );
    const isHovered =
      this.graphState.interaction.hoveredElementId === this.elementId;

    if (!this.elementState) {
      return;
    }

    this.updateVisuals(
      this.elementState as HtmlNodeSpec,
      isHovered,
      isSelected
    );
  }

  public dispose(): void {
    // Clean up event listeners
    if (this.css3DObject && this.css3DObject.element) {
      const element = this.css3DObject.element;
      element.removeEventListener('mousedown', this.onMouseDown.bind(this));
      element.removeEventListener('mouseenter', this.onMouseEnter.bind(this));
      element.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
      element.removeEventListener('click', this.onClick.bind(this));
      element.removeEventListener('touchstart', this.onTouchStart.bind(this));
    }

    // Remove global listeners if they exist
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('touchmove', this.onTouchMove.bind(this));
    document.removeEventListener('touchend', this.onTouchEnd.bind(this));

    super.dispose();
  }

  private updateVisuals(
    elementState: HtmlNodeSpec,
    isElementHovered: boolean,
    isElementSelected: boolean
  ): void {
    if (!this.css3DObject || !this.css3DObject.element) return;

    const element = this.css3DObject.element;

    // Update position
    if (elementState.position) {
      this.css3DObject.position.set(
        elementState.position.x,
        elementState.position.y,
        elementState.position.z
      );
    }

    // Update content if it has changed
    if (element.innerHTML !== (elementState.content || '')) {
      element.innerHTML = elementState.content || '';
    }

    // Update class name if it has changed
    const className = elementState.className || 'spacegraph-html-node';
    if (element.className !== className) {
      element.className = className;
    }

    // Apply hover/selection styles with enhanced visual effects
    if (isElementSelected) {
      element.style.boxShadow =
        '0 12px 40px rgba(0, 255, 0, 0.4), 0 0 20px rgba(0, 255, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      element.style.transform = 'scale(1.08) translateZ(15px) rotateX(2deg)';
      element.style.borderColor = 'rgba(0, 255, 0, 0.4)';
      element.style.zIndex = '1000';
    } else if (isElementHovered) {
      element.style.boxShadow =
        '0 8px 30px rgba(255, 255, 0, 0.3), 0 0 15px rgba(255, 255, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
      element.style.transform = 'scale(1.05) translateZ(10px) rotateX(1deg)';
      element.style.borderColor = 'rgba(255, 255, 0, 0.3)';
      element.style.zIndex = '999';
    } else {
      element.style.boxShadow =
        '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
      element.style.transform = 'scale(1) translateZ(0) rotateX(0deg)';
      element.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      element.style.zIndex = 'auto';
    }

    // Apply transition for smooth animations
    element.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
  }
}
