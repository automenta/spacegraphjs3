import * as THREE from 'three';
import { Spec, SpecUpdate } from '../types';
import { RenderingManager } from '../managers/RenderingManager';
import { EventManager } from '../managers/EventManager';
import { DataManager } from '../managers/DataManager';
import { validateSpec, formatValidationResult } from '../utils/specValidation';

/**
 * Handles SpaceGraph initialization logic
 */
export class SpaceGraphInitialization {
  private performanceWarningsShown = new Set<string>();
  private lastPerformanceCheck = 0;

  /**
   * Initialize container element
   */
  initializeContainer(containerSelector: string): HTMLElement {
    // Validate container selector
    if (
      !containerSelector ||
      typeof containerSelector !== 'string' ||
      containerSelector.trim() === ''
    ) {
      throw new Error(
        'Container selector must be a non-empty string.\n' +
          '💡 Valid examples: "#my-container", ".graph-container", "body"'
      );
    }

    // Check if DOM is available
    if (typeof document === 'undefined') {
      throw new Error(
        'DOM is not available. SpaceGraph requires a browser environment.\n' +
          '💡 Make sure this code runs in a browser, not in Node.js'
      );
    }

    // Try to find the container element
    const container = document.querySelector(containerSelector);
    if (!container) {
      const suggestions = [
        `Check if element with selector "${containerSelector}" exists in the DOM`,
        'Verify the selector is correct (case-sensitive)',
        'Ensure the element is not inside a shadow DOM',
        'Try using a different selector like "#app", ".container", or "body"',
      ];

      throw new Error(
        `Container element '${containerSelector}' not found in DOM.\n` +
          '💡 Suggestions:\n' +
          suggestions.map((s) => `   • ${s}`).join('\n')
      );
    }

    // Check if it's actually an HTMLElement
    if (!(container instanceof HTMLElement)) {
      throw new Error(
        `Container element '${containerSelector}' is not an HTMLElement.\n` +
          `💡 Found: ${container.constructor.name}\n` +
          '💡 Container must be a valid HTML element that can hold child elements'
      );
    }

    // Check if container has reasonable dimensions
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn(
        `Container element '${containerSelector}' has zero width or height.\n` +
          '⚠️  This may cause rendering issues. Consider setting explicit dimensions.'
      );
    }

    return container;
  }

  /**
   * Validate initial spec
   */
  validateInitialSpec(initialSpec: Spec): void {
    const validationResult = validateSpec(initialSpec);
    if (!validationResult.isValid) {
      const errorMessage = `Invalid Spec provided:\n${formatValidationResult(validationResult)}`;
      throw new Error(errorMessage);
    }

    // Log warnings in development mode
    if (
      validationResult.warnings.length > 0 &&
      this.isDevelopmentMode()
    ) {
      console.warn(
        'Spec validation warnings:',
        formatValidationResult(validationResult)
      );
    }
  }

  /**
   * Initialize managers
   */
  initializeManagers(
    spaceGraphInstance: any,
    container: HTMLElement
  ): {
    render: RenderingManager;
    events: EventManager;
    dataManager: DataManager;
  } {
    const render = new RenderingManager(spaceGraphInstance, container);
    const events = new EventManager();
    const dataManager = new DataManager(spaceGraphInstance);

    // Initialize rendering optimizer after event manager is available
    render.initRenderingOptimizer();

    return { render, events, dataManager };
  }

  /**
   * Check for performance issues
   */
  checkPerformanceIssues(state: any): void {
    const nodes = state.data.nodes || [];

    if (nodes.length > 0 && nodes.every((node: any) => !node.position)) {
      this.showPerformanceWarning(
        'no-positions',
        '⚠️  Nodes will not be visible until positioned.\n' +
          '💡 Ensure a layout plugin is enabled and running'
      );
    }

    // Check for very high node count with complex node types
    const complexNodes = nodes.filter(
      (node: any) =>
        node.type === 'custom' ||
        node.type === 'html' ||
        (node.type === 'text' && node.data)
    ).length;

    if (complexNodes > 200) {
      this.showPerformanceWarning(
        'complex-nodes',
        `High number of complex nodes detected: ${complexNodes}.\n` +
          '⚠️  Custom, HTML, and text nodes are more expensive to render.\n' +
          '💡 Consider using simpler node types (sphere, box) for better performance'
      );
    }

    // Check for disabled performance features that should be enabled
    if (
      state.performance &&
      state.performance.instancingThreshold > 1000 &&
      nodes.length > 500
    ) {
      this.showPerformanceWarning(
        'high-instancing-threshold',
        `Instancing threshold is very high: ${state.performance.instancingThreshold}.\n` +
          '⚠️  Consider lowering to 100-200 for better performance with many nodes.\n' +
          '💡 Instanced rendering is more efficient for large numbers of similar objects'
      );
    }
  }

  /**
   * Shows a performance warning, but only once per warning type
   */
  private showPerformanceWarning(warningId: string, message: string): void {
    if (this.performanceWarningsShown.has(warningId)) return;

    this.performanceWarningsShown.add(warningId);
    console.warn(`🚀 Performance Warning [${warningId}]:\n${message}`);
  }

  /**
   * Display initialization error in container
   */
  displayInitializationError(containerSelector: string, error: Error): void {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (container) {
      container.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">
        <h2>Failed to initialize</h2>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>`;
    }
  }

  /**
   * Validate spec update
   */
  validateSpecUpdate(spec: SpecUpdate): void {
    if (this.isDevelopmentMode() && spec.data) {
      const validationResult = validateSpec({
        data: spec.data,
        style: {},
        layout: { type: 'random' },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: 0,
          theta: 0,
          distance: 1,
        },
        controls: {
          keyboard: {
            enabled: false,
            panSpeed: 1,
            zoomSpeed: 1,
            orbitSpeed: 1,
          },
        },
        performance: {
          instancingThreshold: 100,
          enableLOD: false,
          enableCulling: false,
          enableMemoryManagement: false,
          useBasicRenderer: false,
        },
        interaction: { hoveredElementId: null, selectedElementIds: [] },
      });

      if (!validationResult.isValid) {
        console.warn(
          'Spec update validation warnings:',
          formatValidationResult(validationResult)
        );
      }
    }
  }

  /**
   * Checks if we're running in development mode
   */
  private isDevelopmentMode(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }
}