import { createEffect } from 'solid-js';
import * as THREE from 'three';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraphCore } from '../core/SpaceGraphCore';
import { UnifiedHUDSystem } from '../utils/UnifiedHUDSystem';
import { ThemeSystem } from '../utils/ThemeSystem';

/**
 * REPL Commands class for handling console commands
 */
class REPLCommands {
  constructor(private graph: SpaceGraphCore) {}

  help(): string {
    return `Available commands:
=== Graph Navigation ===
- help: Show this help message
- state: Display current graph state
- nodes: List all nodes with details
- edges: List all edges with details
- camera: Show camera state
- layout: Show layout configuration

=== Element Interaction ===
- select <id>: Select a node by ID
- hover <id>: Hover over a node by ID
- deselect: Clear all selections
- focus <id>: Focus camera on element

=== Camera Controls ===
- flyTo <target>: Animate camera to target
- frame <ids>: Frame specified nodes
- autoZoom: Automatically zoom to fit all elements
- setView <view>: Set camera view (top, front, side, isometric)

=== Camera Presets ===
- preset-save <name> [--description <desc>] [--category <cat>] [--tags <tag1,tag2>] [--thumbnail]: Save current camera state as preset
- preset-load <id>: Load camera preset by ID
- preset-list: List all camera presets
- preset-search <query>: Search camera presets
- preset-bookmark <name> [--description <desc>] [--category <cat>] [--tags <tag1,tag2>]: Create a bookmark from current camera state

=== Graph Manipulation ===
- update <spec>: Update graph with new spec
- addNode <spec>: Add a new node
- removeNode <id>: Remove a node
- addEdge <spec>: Add a new edge
- removeEdge <id>: Remove an edge

=== Visualization ===
- theme <name>: Change console theme
- toggleMetrics: Toggle performance metrics
- clear: Clear console output

=== Examples ===
- select node-1: Select node with ID "node-1"
- flyTo {"position":{"x":0,"y":0,"z":0},"distance":30}: Fly to position
- frame ["node-1","node-2"]: Frame nodes "node-1" and "node-2"
- addNode {"id":"new-node","type":"sphere","position":{"x":5,"y":5,"z":0}}: Add new node
- preset-save "My View" --description "Initial view" --category "Views" --tags "initial,setup" --thumbnail: Save current view as preset`;
  }

  state(): object {
    return this.graph.state;
  }

  nodes(): Array<{
    id: string;
    type: string;
    position?: { x: number; y: number; z: number };
  }> {
    return this.graph.state.data.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
    }));
  }

  edges(): Array<{ id: string; source: string; target: string }> {
    return this.graph.state.data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));
  }

  camera(): object {
    return this.graph.state.camera;
  }

  layout(): object {
    return this.graph.state.layout;
  }

  select(id: string): string {
    this.graph.update({
      interaction: { selectedElementIds: [id] },
    });
    return `Selected node: ${id}`;
  }

  hover(id: string): string {
    this.graph.update({
      interaction: { hoveredElementId: id },
    });
    return `Hovering over node: ${id}`;
  }

  flyTo(target: string): string {
    try {
      const parsedTarget = JSON.parse(target);
      this.graph.cameraPlugin?.flyTo(parsedTarget);
      return `Flying camera to: ${target}`;
    } catch (error) {
      throw new Error(
        `Fly to failed: Invalid target format - ${(error as Error).message}`
      );
    }
  }

  frame(ids: string): string {
    try {
      const nodeIds = JSON.parse(ids);
      const nodes = this.graph.state.data.nodes.filter((n) =>
        nodeIds.includes(n.id)
      );
      this.graph.cameraPlugin?.frame(
        nodes.map((n) => ({
          position: new THREE.Vector3(
            n.position?.x || 0,
            n.position?.y || 0,
            n.position?.z || 0
          ),
        }))
      );
      return `Framing nodes: ${ids}`;
    } catch (error) {
      throw new Error(
        `Frame failed: Invalid node IDs format - ${(error as Error).message}`
      );
    }
  }

  update(spec: string): string {
    try {
      const parsedSpec = JSON.parse(spec);
      this.graph.update(parsedSpec);
      return `Graph updated with new specification`;
    } catch (error) {
      throw new Error(
        `Update failed: Invalid spec format - ${(error as Error).message}`
      );
    }
  }

  clear(): string {
    return 'CLEAR_CONSOLE';
  }

  theme(name: string): string {
    const themes: Record<string, { bg: string; text: string; accent: string }> =
      {
        dark: { bg: '#1a1a1a', text: '#ffffff', accent: '#00ff00' },
        light: { bg: '#ffffff', text: '#000000', accent: '#0066cc' },
        matrix: { bg: '#000000', text: '#00ff00', accent: '#00ff00' },
      };

    if (name in themes) {
      return `THEME:${name}`;
    }
    throw new Error(
      `Theme failed: Unknown theme "${name}". Available themes: ${Object.keys(themes).join(', ')}`
    );
  }

  deselect(): string {
    this.graph.update({
      interaction: { selectedElementIds: [] },
    });
    return `Cleared all selections`;
  }

  focus(id: string): string {
    const node = this.graph.state.data.nodes.find((n) => n.id === id);
    if (!node) {
      throw new Error(`Focus failed: Node with ID "${id}" not found`);
    }

    if (this.graph.cameraPlugin) {
      this.graph.cameraPlugin.frame([
        {
          position: new THREE.Vector3(
            node.position?.x || 0,
            node.position?.y || 0,
            node.position?.z || 0
          ),
        },
      ]);
    }
    return `Focusing on node: ${id}`;
  }

  setView(
    view:
      | 'top'
      | 'bottom'
      | 'front'
      | 'back'
      | 'left'
      | 'right'
      | 'isometric'
      | 'auto'
      | 'diagonal'
      | 'perspective'
  ): string {
    if (this.graph.cameraPlugin) {
      this.graph.cameraPlugin.setView(view);
      return `Set camera view to: ${view}`;
    }
    throw new Error('Set view failed: Camera plugin not available');
  }

  autoZoom(): string {
    if (this.graph.cameraPlugin) {
      this.graph.cameraPlugin.autoZoom();
      return `Auto-zooming to fit all elements`;
    }
    throw new Error('Auto zoom failed: Camera plugin not available');
  }

  addNode(spec: string): string {
    try {
      const nodeSpec = JSON.parse(spec);
      if (!nodeSpec.id) {
        throw new Error('Add node failed: Node spec must include an ID');
      }

      this.graph.update({
        data: {
          nodes: {
            add: [nodeSpec],
          },
        },
      });
      return `Added node: ${nodeSpec.id}`;
    } catch (error) {
      throw new Error(
        `Add node failed: Invalid node spec - ${(error as Error).message}`
      );
    }
  }

  removeNode(id: string): string {
    this.graph.update({
      data: {
        nodes: {
          remove: [id],
        },
      },
    });
    return `Removed node: ${id}`;
  }

  addEdge(spec: string): string {
    try {
      const edgeSpec = JSON.parse(spec);
      if (!edgeSpec.id || !edgeSpec.source || !edgeSpec.target) {
        throw new Error(
          'Add edge failed: Edge spec must include id, source, and target'
        );
      }

      this.graph.update({
        data: {
          edges: {
            add: [edgeSpec],
          },
        },
      });
      return `Added edge: ${edgeSpec.id}`;
    } catch (error) {
      throw new Error(
        `Add edge failed: Invalid edge spec - ${(error as Error).message}`
      );
    }
  }

  removeEdge(id: string): string {
    this.graph.update({
      data: {
        edges: {
          remove: [id],
        },
      },
    });
    return `Removed edge: ${id}`;
  }

  toggleMetrics(): string {
    // This would need access to the HUDPlugin instance to toggle metrics
    // For now, we'll just return a message
    return `Use the "Toggle Metrics" button in the HUD to show/hide performance metrics`;
  }

  /**
   * Save current camera state as a preset
   */
  async presetSave(args: string): Promise<string> {
    if (!this.graph.cameraPlugin) {
      throw new Error('Preset save failed: Camera plugin not available');
    }

    // Parse arguments
    const parts = args.match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g) || [];
    if (parts.length === 0) {
      throw new Error('Preset save failed: Preset name is required');
    }

    const name = parts[0]?.replace(/^"(.*)"$/, '$1') || 'Untitled Preset'; // Remove quotes if present
    const options: { [key: string]: any } = {};

    // Parse optional arguments
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part === '--description' && i + 1 < parts.length) {
        options.description = parts[++i]?.replace(/^"(.*)"$/, '$1');
      } else if (part === '--category' && i + 1 < parts.length) {
        options.category = parts[++i]?.replace(/^"(.*)"$/, '$1');
      } else if (part === '--tags' && i + 1 < parts.length) {
        options.tags = parts[++i]?.split(',').map((tag) => tag.trim());
      } else if (part === '--thumbnail') {
        options.generateThumbnail = true;
      }
    }

    try {
      const preset = await this.graph.cameraPlugin
        .getPresetsManager()
        .createPreset(name, options);
      return `Saved camera preset: ${preset.name} (ID: ${preset.id})`;
    } catch (error) {
      throw new Error(`Preset save failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load a camera preset by ID
   */
  async presetLoad(id: string): Promise<string> {
    if (!this.graph.cameraPlugin) {
      throw new Error('Preset load failed: Camera plugin not available');
    }

    try {
      await this.graph.cameraPlugin.getPresetsManager().applyPreset(id);
      return `Loaded camera preset: ${id}`;
    } catch (error) {
      throw new Error(`Preset load failed: ${(error as Error).message}`);
    }
  }

  /**
   * List all camera presets
   */
  presetList(): string {
    if (!this.graph.cameraPlugin) {
      throw new Error('Preset list failed: Camera plugin not available');
    }

    const presets = this.graph.cameraPlugin.getPresetsManager().getAllPresets();
    if (presets.length === 0) {
      return 'No camera presets found';
    }

    return presets
      .map(
        (preset) =>
          `${preset.name} (${preset.id})${preset.description ? ` - ${preset.description}` : ''}`
      )
      .join('\n');
  }

  /**
   * Search camera presets
   */
  presetSearch(query: string): string {
    if (!this.graph.cameraPlugin) {
      throw new Error('Preset search failed: Camera plugin not available');
    }

    const results = this.graph.cameraPlugin
      .getPresetsManager()
      .searchPresets(query);
    if (results.length === 0) {
      return `No presets found matching: ${query}`;
    }

    return results
      .map(
        (preset) =>
          `${preset.name} (${preset.id})${preset.description ? ` - ${preset.description}` : ''}`
      )
      .join('\n');
  }

  /**
   * Create a bookmark from current camera state
   */
  async presetBookmark(args: string): Promise<string> {
    if (!this.graph.cameraPlugin) {
      throw new Error('Preset bookmark failed: Camera plugin not available');
    }

    // Parse arguments
    const parts = args.match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g) || [];
    if (parts.length === 0) {
      throw new Error('Preset bookmark failed: Bookmark name is required');
    }

    const name = parts[0]?.replace(/^"(.*)"$/, '$1') || 'Untitled Bookmark'; // Remove quotes if present
    const options: { [key: string]: any } = {};

    // Parse optional arguments
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part === '--description' && i + 1 < parts.length) {
        options.description = parts[++i]?.replace(/^"(.*)"$/, '$1');
      } else if (part === '--category' && i + 1 < parts.length) {
        options.category = parts[++i]?.replace(/^"(.*)"$/, '$1');
      } else if (part === '--tags' && i + 1 < parts.length) {
        options.tags = parts[++i]?.split(',').map((tag) => tag.trim());
      }
    }

    try {
      const bookmark = await this.graph.cameraPlugin
        .getPresetsManager()
        .createBookmark(name, options);
      return `Created bookmark: ${bookmark.name} (ID: ${bookmark.id})`;
    } catch (error) {
      throw new Error(`Preset bookmark failed: ${(error as Error).message}`);
    }
  }
}

/**
 * Enhanced HUDPlugin with REPL console functionality
 */
export class HUDPlugin implements ISpaceGraphPlugin {
  readonly id = 'hud-plugin';
  readonly name = 'HUD Plugin';
  readonly version = '1.0.0';
  readonly description =
    'Head-up display with REPL console and performance metrics';

  private graph!: SpaceGraphCore;
  private hudContainer!: HTMLElement;
  private consoleContainer!: HTMLElement;
  private inputElement!: HTMLInputElement;
  private outputElement!: HTMLElement;
  private replCommands!: REPLCommands;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private notificationsContainer!: HTMLElement;
  private notificationQueue: Array<{
    message: string;
    type: string;
    duration: number;
  }> = [];
  private activeNotifications: Map<string, HTMLElement> = new Map();
  private performanceMetrics: HTMLElement | null = null;
  private isPerformanceVisible: boolean = false;
  private draggablePanels: Map<
    string,
    {
      element: HTMLElement;
      isDragging: boolean;
      offsetX: number;
      offsetY: number;
    }
  > = new Map();
  private themeManager: ThemeSystem | null = null;
  private notificationSystem: UnifiedHUDSystem | null = null;

  public init(graph: SpaceGraphCore): void {
    this.graph = graph;
    this.replCommands = new REPLCommands(graph);

    const container = this.graph.render.getContainer();
    this.createHUDElements(container);
    this.setupEventListeners();
    this.setupThemeManager();
    this.setupNotificationSystem();

    createEffect(() => this.updateHUD());
  }

  public updateHUD(): void {
    const hudState = this.graph.state.hud;
    if (!hudState) {
      // Animate out
      this.hudContainer.style.transform = 'translateY(-20px)';
      this.hudContainer.style.opacity = '0';

      // Actually hide after animation
      setTimeout(() => {
        this.hudContainer.style.display = 'none';
      }, 300);
      return;
    }

    if (hudState.visible) {
      // Show with animation
      this.hudContainer.style.display = 'block';
      setTimeout(() => {
        this.hudContainer.style.transform = 'translateY(0)';
        this.hudContainer.style.opacity = '1';
      }, 10);

      // Handle console visibility with fade animation
      if (hudState.console?.enabled) {
        this.consoleContainer.style.display = 'block';
        this.consoleContainer.style.opacity = '0';
        this.consoleContainer.style.transform = 'translateY(10px)';
        this.consoleContainer.style.transition = 'all 0.3s ease';

        setTimeout(() => {
          this.consoleContainer.style.opacity = '1';
          this.consoleContainer.style.transform = 'translateY(0)';
        }, 50);
      } else {
        this.consoleContainer.style.opacity = '0';
        this.consoleContainer.style.transform = 'translateY(10px)';

        // Actually hide after animation
        setTimeout(() => {
          this.consoleContainer.style.display = 'none';
        }, 300);
      }

      // Handle legacy content
      if (hudState.content && !hudState.console?.enabled) {
        this.hudContainer.innerHTML = `<div>${hudState.content}</div>`;
      }
    } else {
      // Immediately hide for tests and consistent behavior
      this.hudContainer.style.display = 'none';
      this.hudContainer.style.transform = 'translateY(-20px)';
      this.hudContainer.style.opacity = '0';
    }
  }

  private createHUDElements(container: HTMLElement): void {
    // Main HUD container with enhanced styling and animations
    this.hudContainer = document.createElement('div');
    this.hudContainer.style.position = 'absolute';
    this.hudContainer.style.top = '10px';
    this.hudContainer.style.left = '10px';
    this.hudContainer.style.color = 'white';
    this.hudContainer.style.fontFamily = 'monospace';
    this.hudContainer.style.fontSize = '12px';
    this.hudContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    this.hudContainer.style.padding = '12px';
    this.hudContainer.style.borderRadius = '8px';
    this.hudContainer.style.minWidth = '300px';
    this.hudContainer.style.maxWidth = '500px';
    this.hudContainer.style.zIndex = '1000';
    this.hudContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    this.hudContainer.style.transition =
      'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    this.hudContainer.style.transform = 'translateY(-20px)';
    this.hudContainer.style.opacity = '0';
    this.hudContainer.style.backdropFilter = 'blur(10px)';
    this.hudContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    this.hudContainer.style.overflow = 'hidden';
    this.hudContainer.style.pointerEvents = 'none'; // Allow pointer events to pass through when not interacting with controls

    // Add gradient overlay for enhanced visual appeal
    const gradientOverlay = document.createElement('div');
    gradientOverlay.style.position = 'absolute';
    gradientOverlay.style.top = '0';
    gradientOverlay.style.left = '0';
    gradientOverlay.style.right = '0';
    gradientOverlay.style.height = '2px';
    gradientOverlay.style.background =
      'linear-gradient(90deg, #00ff00, #0088ff, #ff00ff)';
    gradientOverlay.style.opacity = '0.7';
    gradientOverlay.style.transition = 'opacity 0.3s ease';
    this.hudContainer.appendChild(gradientOverlay);

    // Animate in with enhanced effects
    setTimeout(() => {
      this.hudContainer.style.transform = 'translateY(0)';
      this.hudContainer.style.opacity = '1';

      // Add subtle glow effect
      setTimeout(() => {
        this.hudContainer.style.boxShadow =
          '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 0, 0.3)';
      }, 400);
    }, 100);

    // Console container
    this.consoleContainer = document.createElement('div');
    this.consoleContainer.style.display = 'none';
    this.consoleContainer.style.marginTop = '10px';
    this.consoleContainer.style.paddingTop = '10px';
    this.consoleContainer.style.borderTop =
      '1px solid rgba(255, 255, 255, 0.1)';
    this.consoleContainer.style.pointerEvents = 'auto'; // Enable pointer events for console controls

    // Output area with enhanced styling
    this.outputElement = document.createElement('div');
    this.outputElement.style.height = '200px';
    this.outputElement.style.overflowY = 'auto';
    this.outputElement.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    this.outputElement.style.padding = '8px';
    this.outputElement.style.marginBottom = '8px';
    this.outputElement.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.outputElement.style.fontFamily = 'monospace';
    this.outputElement.style.fontSize = '11px';
    this.outputElement.style.borderRadius = '4px';
    this.outputElement.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
    this.outputElement.style.pointerEvents = 'auto'; // Enable pointer events for output area

    // Add syntax highlighting for JSON output
    this.outputElement.addEventListener('DOMNodeInserted', (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.textContent &&
        target.textContent.includes('{')
      ) {
        this.highlightSyntax(target);
      }
    });

    // Input area with enhanced styling
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.alignItems = 'center';
    inputContainer.style.padding = '6px 8px';
    inputContainer.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
    inputContainer.style.borderRadius = '4px';
    inputContainer.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    inputContainer.style.transition =
      'border-color 0.3s ease, box-shadow 0.3s ease';
    inputContainer.style.pointerEvents = 'auto'; // Enable pointer events for input container

    // Add focus effects
    inputContainer.addEventListener('focusin', () => {
      inputContainer.style.borderColor = '#00ff00';
      inputContainer.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
    });

    inputContainer.addEventListener('focusout', () => {
      inputContainer.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      inputContainer.style.boxShadow = 'none';
    });

    const prompt = document.createElement('span');
    prompt.textContent = '>>> ';
    prompt.style.color = '#00ff00';
    prompt.style.fontWeight = 'bold';
    prompt.style.marginRight = '6px';

    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.style.flex = '1';
    this.inputElement.style.backgroundColor = 'transparent';
    this.inputElement.style.border = 'none';
    this.inputElement.style.color = 'white';
    this.inputElement.style.fontFamily = 'monospace';
    this.inputElement.style.fontSize = '12px';
    this.inputElement.style.outline = 'none';
    this.inputElement.style.padding = '2px';
    this.inputElement.style.caretColor = '#00ff00';
    this.inputElement.style.pointerEvents = 'auto'; // Enable pointer events for input element

    // Add placeholder with animation
    this.inputElement.placeholder = 'Type command here...';
    this.inputElement.style.transition = 'color 0.3s ease';

    // Add input history navigation hint
    this.inputElement.addEventListener('focus', () => {
      if (this.inputElement.value === '') {
        this.inputElement.placeholder = '↑↓ for history, Tab for autocomplete';
      }
    });

    this.inputElement.addEventListener('blur', () => {
      this.inputElement.placeholder = 'Type command here...';
    });

    inputContainer.appendChild(prompt);
    inputContainer.appendChild(this.inputElement);

    this.consoleContainer.appendChild(this.outputElement);
    this.consoleContainer.appendChild(inputContainer);

    this.hudContainer.appendChild(this.consoleContainer);

    // Notifications container
    this.notificationsContainer = document.createElement('div');
    this.notificationsContainer.style.position = 'absolute';
    this.notificationsContainer.style.top = '10px';
    this.notificationsContainer.style.right = '10px';
    this.notificationsContainer.style.zIndex = '1001';
    this.notificationsContainer.style.display = 'flex';
    this.notificationsContainer.style.flexDirection = 'column';
    this.notificationsContainer.style.alignItems = 'flex-end';
    this.notificationsContainer.style.gap = '12px';
    this.notificationsContainer.style.pointerEvents = 'none'; // Allow pointer events to pass through notifications container
    container.appendChild(this.notificationsContainer);

    container.appendChild(this.hudContainer);

    // Add welcome message with enhanced animation
    setTimeout(() => {
      this.addOutput('info', '🚀 SpaceGraphJS REPL Console');
      this.addOutput('info', '💡 Type "help" for available commands');
      this.addOutput('info', '🎯 Try "preset-save" to save camera views');
      this.addOutput('info', '🎨 Use "theme <name>" to change appearance');
    }, 500);

    // Add interactive background effects
    this.addBackgroundEffects();

    // Setup event listeners for notifications
    this.setupNotificationSystem();

    // Create performance metrics panel
    this.createPerformancePanel();
  }

  private addBackgroundEffects(): void {
    // Add particle effect background
    const particles = document.createElement('div');
    particles.style.position = 'absolute';
    particles.style.top = '0';
    particles.style.left = '0';
    particles.style.right = '0';
    particles.style.bottom = '0';
    particles.style.pointerEvents = 'none';
    particles.style.zIndex = '-1';
    particles.style.opacity = '0.1';
    particles.style.overflow = 'hidden';

    // Create floating particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '2px';
      particle.style.height = '2px';
      particle.style.backgroundColor = '#00ff00';
      particle.style.borderRadius = '50%';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animation = `float ${3 + Math.random() * 4}s ease-in-out infinite`;
      particle.style.animationDelay = `${Math.random() * 2}s`;
      particle.style.opacity = `${0.3 + Math.random() * 0.7}`;

      particles.appendChild(particle);
    }

    this.hudContainer.appendChild(particles);
  }

  private setupEventListeners(): void {
    this.inputElement.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'Enter':
          this.executeCommand();
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.navigateHistory(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.navigateHistory(1);
          break;
        case 'Tab':
          event.preventDefault();
          this.handleAutoComplete();
          break;
      }
    });

    // Focus input when console is shown
    this.inputElement.focus();
  }

  private executeCommand(): void {
    const command = this.inputElement.value.trim();
    if (!command) return;

    this.addOutput('command', `>>> ${command}`);
    this.commandHistory.push(command);
    this.historyIndex = this.commandHistory.length;

    try {
      const result = this.evaluateCommand(command);
      if (result === 'CLEAR_CONSOLE') {
        this.clearOutput();
      } else if (result.startsWith('THEME:')) {
        this.applyTheme(result.split(':')[1]);
      } else {
        this.addOutput(
          'result',
          typeof result === 'object'
            ? JSON.stringify(result, null, 2)
            : String(result)
        );
      }
    } catch (error) {
      this.addOutput('error', `Error: ${(error as Error).message}`);
    }

    this.inputElement.value = '';
    this.scrollToBottom();
  }

  private navigateHistory(direction: number): void {
    const newIndex = this.historyIndex + direction;
    if (newIndex >= 0 && newIndex < this.commandHistory.length) {
      this.historyIndex = newIndex;
      this.inputElement.value = this.commandHistory[this.historyIndex];
    } else if (newIndex === this.commandHistory.length) {
      this.historyIndex = newIndex;
      this.inputElement.value = '';
    }
  }

  private handleAutoComplete(): void {
    // Basic auto-complete implementation
    const input = this.inputElement.value;
    const commandMethods = [
      'help',
      'state',
      'nodes',
      'edges',
      'camera',
      'layout',
      'select',
      'hover',
      'deselect',
      'focus',
      'flyTo',
      'frame',
      'update',
      'clear',
      'theme',
      'setView',
      'autoZoom',
      'addNode',
      'removeNode',
      'addEdge',
      'removeEdge',
      'toggleMetrics',
      'presetSave',
      'presetLoad',
      'presetList',
      'presetSearch',
      'presetBookmark',
    ];
    const matches = commandMethods.filter((cmd) => cmd.startsWith(input));

    if (matches.length === 1) {
      this.inputElement.value = matches[0];
    } else if (matches.length > 1) {
      this.addOutput('info', `Suggestions: ${matches.join(', ')}`);
    }
  }

  private scrollToBottom(): void {
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }

  private clearOutput(): void {
    this.outputElement.innerHTML = '';
    this.addOutput('info', 'Console cleared');
  }

  private evaluateCommand(command: string): any {
    // Enhanced command parsing to handle commands with arguments
    const parts = command.match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g) || [];
    if (parts.length === 0) {
      throw new Error(`Unknown command. Type 'help' for available commands.`);
    }

    const cmd = parts[0];
    if (!cmd) {
      throw new Error(`Unknown command. Type 'help' for available commands.`);
    }

    const args = parts.slice(1).join(' ');

    // Special handling for commands that need to preserve quoted arguments
    if (cmd === 'preset-save' || cmd === 'preset-bookmark') {
      const argsWithQuotes = command.substring(cmd.length).trim();
      // Directly call the method on replCommands instance
      switch (cmd) {
        case 'preset-save':
          return this.replCommands.presetSave(argsWithQuotes);
        case 'preset-bookmark':
          return this.replCommands.presetBookmark(argsWithQuotes);
        default:
          throw new Error(
            `Unknown command: ${cmd}. Type 'help' for available commands.`
          );
      }
    } else {
      // Directly call the method on replCommands instance
      switch (cmd) {
        case 'help':
          return this.replCommands.help();
        case 'state':
          return this.replCommands.state();
        case 'nodes':
          return this.replCommands.nodes();
        case 'edges':
          return this.replCommands.edges();
        case 'camera':
          return this.replCommands.camera();
        case 'layout':
          return this.replCommands.layout();
        case 'select':
          return this.replCommands.select(args);
        case 'hover':
          return this.replCommands.hover(args);
        case 'deselect':
          return this.replCommands.deselect();
        case 'focus':
          return this.replCommands.focus(args);
        case 'flyTo':
          return this.replCommands.flyTo(args);
        case 'frame':
          return this.replCommands.frame(args);
        case 'update':
          return this.replCommands.update(args);
        case 'clear':
          return this.replCommands.clear();
        case 'theme':
          return this.replCommands.theme(args);
        case 'setView': {
          // Validate that args is one of the accepted view types
          const validViews = [
            'top',
            'bottom',
            'front',
            'back',
            'left',
            'right',
            'isometric',
            'auto',
            'diagonal',
            'perspective',
          ] as const;
          const isValidView = (
            view: string
          ): view is (typeof validViews)[number] => {
            return validViews.includes(view as (typeof validViews)[number]);
          };
          if (isValidView(args)) {
            return this.replCommands.setView(args);
          } else {
            throw new Error(
              `Invalid view: ${args}. Valid views are: ${validViews.join(', ')}`
            );
          }
        }
        case 'autoZoom':
          return this.replCommands.autoZoom();
        case 'addNode':
          return this.replCommands.addNode(args);
        case 'removeNode':
          return this.replCommands.removeNode(args);
        case 'addEdge':
          return this.replCommands.addEdge(args);
        case 'removeEdge':
          return this.replCommands.removeEdge(args);
        case 'toggleMetrics':
          return this.replCommands.toggleMetrics();
        case 'presetLoad':
          return this.replCommands.presetLoad(args);
        case 'presetList':
          return this.replCommands.presetList();
        case 'presetSearch':
          return this.replCommands.presetSearch(args);
        default:
          throw new Error(
            `Unknown command: ${cmd}. Type 'help' for available commands.`
          );
      }
    }
  }

  private applyTheme(themeName: string): void {
    const themes: Record<string, any> = {
      dark: { bg: '#1a1a1a', text: '#ffffff', accent: '#00ff00' },
      light: { bg: '#ffffff', text: '#000000', accent: '#0066cc' },
      matrix: { bg: '#000000', text: '#00ff00', accent: '#00ff00' },
    };

    const theme = themes[themeName];
    if (theme) {
      this.hudContainer.style.backgroundColor = theme.bg;
      this.hudContainer.style.color = theme.text;
      this.outputElement.style.borderColor = theme.accent;
      this.addOutput('info', `Theme applied: ${themeName}`);
    }
  }


  private setupThemeManager(): void {
    // ThemeSystem is now initialized in init() method
    // Set up theme change listener
    try {
      this.themeManager = new ThemeSystem();
      if (
        this.themeManager &&
        typeof this.themeManager.onThemeChange === 'function'
      ) {
        this.themeManager.onThemeChange(() => {
          this.applyThemeToHUD();
        });
      }
    } catch (error) {
      console.warn('Failed to initialize ThemeSystem:', error);
    }
  }

  private applyThemeToHUD(): void {
    if (!this.themeManager) return;

    try {
      const theme = this.themeManager.getCurrentTheme();
      if (!theme) return;

      // Apply to main HUD container
      if (this.hudContainer) {
        this.hudContainer.style.backgroundColor = theme.colors.surface;
        this.hudContainer.style.borderColor = theme.colors.border;
        this.hudContainer.style.color = theme.colors.text;
      }

      // Apply to input container
      const inputContainer = this.inputElement?.parentElement;
      if (inputContainer) {
        inputContainer.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
        inputContainer.style.borderColor = theme.colors.border;
      }

      // Apply to output element
      if (this.outputElement) {
        this.outputElement.style.borderColor = theme.colors.border;
        this.outputElement.style.backgroundColor = theme.colors.background;
      }
    } catch (error) {
      console.warn('Failed to apply theme to HUD:', error);
    }
  }

  private highlightSyntax(element: HTMLElement): void {
    if (!element.textContent) return;

    try {
      // Simple JSON syntax highlighting
      if (
        element.textContent.includes('{') &&
        element.textContent.includes('}')
      ) {
        let content = element.textContent;

        // Highlight strings
        content = content.replace(
          /"([^"]*)"/g,
          '<span style="color: #ce9178;">"$1"</span>'
        );

        // Highlight numbers
        content = content.replace(
          /\b(\d+)\b/g,
          '<span style="color: #b5cea8;">$1</span>'
        );

        // Highlight booleans and null
        content = content.replace(
          /\b(true|false|null)\b/g,
          '<span style="color: #569cd6;">$1</span>'
        );

        // Highlight keys
        content = content.replace(
          /"([^"]*)":/g,
          '<span style="color: #9cdcfe;">"$1"</span>:'
        );

        element.innerHTML = content;
      }
    } catch (error) {
      // Fallback to plain text if highlighting fails
      console.warn('Syntax highlighting failed:', error);
    }
  }

  private setupNotificationSystem(): void {
    // Listen for graph events to show notifications
    try {
      if (this.graph && this.graph.events) {
        this.graph.events.on('element:click', ({ target }) => {
          this.showNotification(`Clicked: ${target.id}`, 'info', 2000);
        });

        this.graph.events.on('element:hover:enter', ({ target }) => {
          this.showNotification(`Hovering: ${target.id}`, 'info', 1500);
        });

        this.graph.events.on('element:drag:start', ({ target }) => {
          this.showNotification(`Dragging: ${target.id}`, 'info', 1500);
        });

        this.graph.events.on('element:drag:end', ({ target }) => {
          this.showNotification(`Dropped: ${target.id}`, 'success', 2000);
        });

        this.graph.events.on('edge:click', ({ target }) => {
          this.showNotification(`Edge clicked: ${target.id}`, 'info', 2000);
        });

        this.graph.events.on('edge:hover:enter', ({ target }) => {
          this.showNotification(`Edge hovering: ${target.id}`, 'info', 1500);
        });

        this.graph.events.on('edge:select', ({ target }) => {
          this.showNotification(`Edge selected: ${target.id}`, 'success', 2000);
        });

        this.graph.events.on('camera:animation:start', () => {
          this.showNotification('Camera animation started', 'info', 1500);
        });

        this.graph.events.on('camera:animation:end', () => {
          this.showNotification(
            '✨ Camera animation completed',
            'success',
            2000
          );
        });
      }
    } catch (error) {
      console.warn('Failed to set up notification system:', error);
    }
  }

  public showNotification(
    message: string,
    type: string = 'info',
    duration: number = 3000
  ): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.padding = '12px 16px';
    notification.style.borderRadius = '6px';
    notification.style.marginBottom = '8px';
    notification.style.minWidth = '220px';
    notification.style.maxWidth = '320px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
    notification.style.transform = 'translateX(100%) scale(0.8)';
    notification.style.opacity = '0';
    notification.style.transition = 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    notification.style.fontFamily = 'monospace';
    notification.style.fontSize = '13px';
    notification.style.wordWrap = 'break-word';
    notification.style.position = 'relative';
    notification.style.overflow = 'hidden';
    notification.style.pointerEvents = 'auto'; // Enable pointer events for notification (needed for close button)

    // Add subtle glow effect
    notification.style.boxShadow =
      '0 4px 12px rgba(0, 0, 0, 0.25), 0 0 8px rgba(255, 255, 255, 0.1)';

    // Set styles based on type with enhanced colors
    switch (type) {
      case 'success':
        notification.style.backgroundColor = 'rgba(40, 167, 69, 0.95)';
        notification.style.color = 'white';
        notification.style.borderLeft = '4px solid #28a745';
        break;
      case 'error':
        notification.style.backgroundColor = 'rgba(220, 53, 69, 0.95)';
        notification.style.color = 'white';
        notification.style.borderLeft = '4px solid #dc3545';
        break;
      case 'warning':
        notification.style.backgroundColor = 'rgba(255, 193, 7, 0.95)';
        notification.style.color = '#212529';
        notification.style.borderLeft = '4px solid #ffc107';
        break;
      case 'info':
      default:
        notification.style.backgroundColor = 'rgba(23, 162, 184, 0.95)';
        notification.style.color = 'white';
        notification.style.borderLeft = '4px solid #17a2b8';
        break;
    }

    // Add enhanced visual effects based on type
    if (type === 'error' || type === 'warning') {
      notification.style.animation = 'pulse 2s infinite';
      notification.classList.add('hud-shake-effect');
    } else if (type === 'success') {
      notification.classList.add('hud-float-effect');
    }

    // Add special effects for certain messages
    if (message.includes('🚀') || message.includes('✨')) {
      notification.classList.add('hud-neon-glow');
    }

    notification.textContent = message;

    // Add close button with hover effect
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '8px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.transition = 'transform 0.2s, color 0.2s';
    closeBtn.style.color = 'rgba(255, 255, 255, 0.7)';

    closeBtn.onmouseenter = () => {
      closeBtn.style.color = 'white';
      closeBtn.style.transform = 'scale(1.2)';
    };

    closeBtn.onmouseleave = () => {
      closeBtn.style.color = 'rgba(255, 255, 255, 0.7)';
      closeBtn.style.transform = 'scale(1)';
    };

    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.hideNotification(notification);
    };

    notification.appendChild(closeBtn);

    // Add progress bar for auto-hide duration
    if (duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.style.position = 'absolute';
      progressBar.style.bottom = '0';
      progressBar.style.left = '0';
      progressBar.style.height = '3px';
      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      progressBar.style.overflow = 'hidden';

      const progressFill = document.createElement('div');
      progressFill.style.height = '100%';
      progressFill.style.width = '100%';
      progressFill.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      progressFill.style.transition = `width ${duration}ms linear`;
      progressFill.style.width = '100%';

      // Start progress animation
      setTimeout(() => {
        progressFill.style.width = '0%';
      }, 10);

      progressBar.appendChild(progressFill);
      notification.appendChild(progressBar);
    }

    // Add to container
    this.notificationsContainer.appendChild(notification);

    // Generate unique ID for this notification
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.activeNotifications.set(id, notification);

    // Animate in with bounce effect
    setTimeout(() => {
      notification.style.transform = 'translateX(0) scale(1)';
      notification.style.opacity = '1';
    }, 10);

    // Add slight delay before full appearance for smoother effect
    setTimeout(() => {
      notification.style.transition =
        'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    }, 400);

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, duration);
    }
  }

  private hideNotification(notification: HTMLElement): void {
    // Find and remove from active notifications
    for (const [id, notif] of this.activeNotifications.entries()) {
      if (notif === notification) {
        this.activeNotifications.delete(id);
        break;
      }
    }

    // Animate out with scaling effect
    notification.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    notification.style.transform = 'translateX(100%) scale(0.8)';
    notification.style.opacity = '0';

    // Remove after animation completes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  private addOutput(
    type: 'command' | 'result' | 'error' | 'info',
    content: string
  ): void {
    const line = document.createElement('div');
    line.style.marginBottom = '3px';
    line.style.whiteSpace = 'pre-wrap';
    line.style.wordBreak = 'break-word';
    line.style.opacity = '0';
    line.style.transform = 'translateY(10px)';
    line.style.transition = 'all 0.3s ease-out';

    switch (type) {
      case 'command':
        line.style.color = '#00ff00';
        line.style.fontWeight = 'bold';
        break;
      case 'result':
        line.style.color = '#ffffff';
        break;
      case 'error':
        line.style.color = '#ff4444';
        line.style.fontWeight = 'bold';
        break;
      case 'info':
        line.style.color = '#888888';
        line.style.fontStyle = 'italic';
        break;
    }

    line.textContent = content;
    this.outputElement.appendChild(line);

    // Add special effects for certain content
    if (
      content.includes('🚀') ||
      content.includes('✨') ||
      content.includes('🎯')
    ) {
      line.classList.add('hud-neon-glow');
    }

    // Animate in with enhanced effects
    setTimeout(() => {
      line.style.opacity = '1';
      line.style.transform = 'translateY(0)';

      // Add subtle glow for results
      if (type === 'result') {
        line.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.3)';
      }
    }, 10);
  }

  private createPerformancePanel(): void {
    this.performanceMetrics = document.createElement('div');
    this.performanceMetrics.id = 'performance-metrics';
    this.performanceMetrics.style.position = 'absolute';
    this.performanceMetrics.style.bottom = '10px';
    this.performanceMetrics.style.right = '10px';
    this.performanceMetrics.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    this.performanceMetrics.style.border = '1px solid #555';
    this.performanceMetrics.style.borderRadius = '8px';
    this.performanceMetrics.style.padding = '12px';
    this.performanceMetrics.style.color = 'white';
    this.performanceMetrics.style.fontFamily = 'monospace';
    this.performanceMetrics.style.fontSize = '12px';
    this.performanceMetrics.style.zIndex = '1000';
    this.performanceMetrics.style.display = 'none'; // Hidden by default
    this.performanceMetrics.style.minWidth = '220px';
    this.performanceMetrics.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    this.performanceMetrics.style.backdropFilter = 'blur(5px)';
    this.performanceMetrics.style.transform = 'translateY(20px)';
    this.performanceMetrics.style.opacity = '0';
    this.performanceMetrics.style.transition =
      'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    this.performanceMetrics.style.pointerEvents = 'auto'; // Enable pointer events for performance metrics

    // Title
    const title = document.createElement('div');
    title.textContent = 'Performance Metrics';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.style.color = '#00ff00';
    title.style.fontSize = '13px';
    title.style.display = 'flex';
    title.style.justifyContent = 'space-between';
    title.style.alignItems = 'center';

    // Close button for metrics panel
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.padding = '0 4px';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.togglePerformanceMetrics();
    };
    title.appendChild(closeBtn);

    this.performanceMetrics.appendChild(title);

    // Metrics content
    const content = document.createElement('div');
    content.id = 'performance-content';
    content.style.display = 'grid';
    content.style.gridTemplateColumns = 'auto 1fr';
    content.style.gap = '6px 12px';
    content.innerHTML = `
      <div>FPS:</div><div id="fps-value">0</div>
      <div>Nodes:</div><div id="node-count">0</div>
      <div>Edges:</div><div id="edge-count">0</div>
      <div>Memory:</div><div id="memory-usage">0 KB</div>
    `;
    this.performanceMetrics.appendChild(content);

    // Style the metrics labels
    const labels = content.querySelectorAll('div:nth-child(odd)');
    labels.forEach((label) => {
      if (label instanceof HTMLElement) {
        label.style.fontWeight = 'bold';
        label.style.color = '#aaa';
      }
    });

    // Style the metrics values
    const values = content.querySelectorAll('div:nth-child(even)');
    values.forEach((value) => {
      if (value instanceof HTMLElement) {
        value.style.textAlign = 'right';
      }
    });

    // Toggle button
    const toggleBtn = document.createElement('div');
    toggleBtn.textContent = 'Toggle Metrics';
    toggleBtn.style.marginTop = '10px';
    toggleBtn.style.padding = '6px 10px';
    toggleBtn.style.backgroundColor = 'rgba(50, 50, 50, 0.8)';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.textAlign = 'center';
    toggleBtn.style.borderRadius = '4px';
    toggleBtn.style.border = '1px solid #444';
    toggleBtn.style.transition = 'all 0.2s ease';
    toggleBtn.style.fontSize = '11px';

    toggleBtn.onmouseenter = () => {
      toggleBtn.style.backgroundColor = 'rgba(70, 70, 70, 0.9)';
    };

    toggleBtn.onmouseleave = () => {
      toggleBtn.style.backgroundColor = 'rgba(50, 50, 50, 0.8)';
    };

    toggleBtn.onclick = () => {
      this.togglePerformanceMetrics();
    };
    this.performanceMetrics.appendChild(toggleBtn);

    // Add to container
    this.hudContainer.appendChild(this.performanceMetrics);

    // Start FPS monitoring
    this.startFPSMonitoring();
  }

  private togglePerformanceMetrics(): void {
    if (this.performanceMetrics) {
      this.isPerformanceVisible = !this.isPerformanceVisible;

      if (this.isPerformanceVisible) {
        // Show with animation
        this.performanceMetrics.style.display = 'block';
        setTimeout(() => {
          this.performanceMetrics!.style.transform = 'translateY(0)';
          this.performanceMetrics!.style.opacity = '1';
        }, 10);
      } else {
        // Hide with animation
        this.performanceMetrics.style.transform = 'translateY(20px)';
        this.performanceMetrics.style.opacity = '0';

        // Actually hide after animation completes
        setTimeout(() => {
          if (this.performanceMetrics) {
            this.performanceMetrics.style.display = 'none';
          }
        }, 400);
      }
    }
  }

  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;

    const updateMetrics = () => {
      if (!this.isPerformanceVisible) {
        requestAnimationFrame(updateMetrics);
        return;
      }

      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        // Update FPS display
        const fpsElement = document.getElementById('fps-value');
        if (fpsElement) {
          fpsElement.textContent = fps.toString();
          fpsElement.style.color =
            fps > 30 ? '#00ff00' : fps > 15 ? '#ffff00' : '#ff0000';
        }

        // Update node/edge counts
        const nodeCountElement = document.getElementById('node-count');
        const edgeCountElement = document.getElementById('edge-count');
        if (nodeCountElement && edgeCountElement && this.graph) {
          nodeCountElement.textContent =
            this.graph.state.data.nodes.length.toString();
          edgeCountElement.textContent =
            this.graph.state.data.edges.length.toString();
        }

        // Update memory usage (approximation)
        const memoryElement = document.getElementById('memory-usage');
        if (memoryElement) {
          // Rough estimation based on node/edge count
          const nodeMemory = this.graph.state.data.nodes.length * 100; // Approx 100 bytes per node
          const edgeMemory = this.graph.state.data.edges.length * 50; // Approx 50 bytes per edge
          const totalMemory = Math.round((nodeMemory + edgeMemory) / 1024); // KB
          memoryElement.textContent = `${totalMemory} KB`;
        }
      }

      requestAnimationFrame(updateMetrics);
    };

    requestAnimationFrame(updateMetrics);
  }

  public dispose(): void {
    if (this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
  }
}
