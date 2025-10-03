# HUDPlugin REPL Console Specification

## Overview

This specification details the enhancement of the existing HUDPlugin to include an interactive REPL (Read-Eval-Print
Loop) console for debugging and runtime manipulation of the SpaceGraph instance.

## Current State

The existing HUDPlugin (`src/plugins/HUDPlugin.ts`) provides basic functionality:

- Simple HUD container creation
- Basic content display based on `graph.state.hud.visible` and `graph.state.hud.content`
- Minimal styling and positioning

## Target Enhancement

A fully-featured interactive console that provides:

1. **Command Input**: Text input field for entering commands
2. **Output Display**: Scrollable output area for command results
3. **Graph State Inspection**: Ability to examine current graph state
4. **Runtime Manipulation**: Ability to modify graph properties dynamically
5. **Auto-completion**: Smart suggestions for available commands
6. **Command History**: Navigate through previously entered commands

## Technical Implementation

### 1. Enhanced State Structure

```typescript
interface HUDState {
  visible: boolean;
  console: {
    enabled: boolean;
    history: string[];
    currentInput: string;
    output: Array<{
      type: 'command' | 'result' | 'error' | 'info';
      content: string;
      timestamp: number;
    }>;
    autoComplete: {
      enabled: boolean;
      suggestions: string[];
      selectedIndex: number;
    };
  };
  content?: string; // Legacy support for simple content
}
```

### 2. Core Commands Implementation

```typescript
class REPLCommands {
  constructor(private graph: SpaceGraph) {}

  // Graph inspection commands
  help(): string {
    return `Available commands:
    - help: Show this help message
    - state: Display current graph state
    - nodes: List all nodes
    - edges: List all edges
    - camera: Show camera state
    - layout: Show layout configuration
    - select <id>: Select a node by ID
    - hover <id>: Hover over a node by ID
    - flyTo <target>: Animate camera to target
    - frame <ids>: Frame specified nodes
    - update <spec>: Update graph with new spec
    - clear: Clear console output
    - theme <name>: Change console theme`;
  }

  state(): object {
    return this.graph.state;
  }

  nodes(): Array<{id: string, type: string, position?: {x: number, y: number, z: number}}> {
    return this.graph.state.data.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position
    }));
  }

  edges(): Array<{id: string, source: string, target: string}> {
    return this.graph.state.data.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target
    }));
  }

  camera(): object {
    return this.graph.state.camera;
  }

  layout(): object {
    return this.graph.state.layout;
  }

  select(id: string): string {
    this.graph.updateState({
      interaction: { selectedElementIds: [id] }
    });
    return `Selected node: ${id}`;
  }

  hover(id: string): string {
    this.graph.updateState({
      interaction: { hoveredElementId: id }
    });
    return `Hovering over node: ${id}`;
  }

  flyTo(target: string): string {
    try {
      const parsedTarget = JSON.parse(target);
      this.graph.camera.flyTo(parsedTarget);
      return `Flying camera to: ${target}`;
    } catch (error) {
      throw new Error(`Invalid target format: ${error.message}`);
    }
  }

  frame(ids: string): string {
    try {
      const nodeIds = JSON.parse(ids);
      const nodes = this.graph.state.data.nodes.filter(n => nodeIds.includes(n.id));
      this.graph.camera.frame(nodes);
      return `Framing nodes: ${ids}`;
    } catch (error) {
      throw new Error(`Invalid node IDs format: ${error.message}`);
    }
  }

  update(spec: string): string {
    try {
      const parsedSpec = JSON.parse(spec);
      this.graph.update(parsedSpec);
      return `Graph updated with new specification`;
    } catch (error) {
      throw new Error(`Invalid spec format: ${error.message}`);
    }
  }

  clear(): string {
    return 'CLEAR_CONSOLE'; // Special signal to clear output
  }

  theme(name: string): string {
    const themes = {
      dark: { bg: '#1a1a1a', text: '#ffffff', accent: '#00ff00' },
      light: { bg: '#ffffff', text: '#000000', accent: '#0066cc' },
      matrix: { bg: '#000000', text: '#00ff00', accent: '#00ff00' }
    };
    
    if (themes[name]) {
      return `THEME:${name}`; // Special signal to apply theme
    }
    throw new Error(`Unknown theme: ${name}. Available: ${Object.keys(themes).join(', ')}`);
  }
}
```

### 3. Enhanced HUDPlugin Implementation

```typescript
export class HUDPlugin implements ISpaceGraphPlugin {
  private graph!: SpaceGraph;
  private hudContainer!: HTMLElement;
  private consoleContainer!: HTMLElement;
  private inputElement!: HTMLInputElement;
  private outputElement!: HTMLElement;
  private replCommands!: REPLCommands;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;

  public init(graph: SpaceGraph): void {
    this.graph = graph;
    this.replCommands = new REPLCommands(graph);
    
    const container = this.graph.render.getContainer();
    this.createHUDElements(container);
    this.setupEventListeners();
    
    createEffect(() => this.updateHUD());
  }

  private createHUDElements(container: HTMLElement): void {
    // Main HUD container
    this.hudContainer = document.createElement('div');
    this.hudContainer.style.position = 'absolute';
    this.hudContainer.style.top = '10px';
    this.hudContainer.style.left = '10px';
    this.hudContainer.style.color = 'white';
    this.hudContainer.style.fontFamily = 'monospace';
    this.hudContainer.style.fontSize = '12px';
    this.hudContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.hudContainer.style.padding = '10px';
    this.hudContainer.style.borderRadius = '5px';
    this.hudContainer.style.minWidth = '300px';
    this.hudContainer.style.maxWidth = '500px';
    
    // Console container
    this.consoleContainer = document.createElement('div');
    this.consoleContainer.style.display = 'none';
    
    // Output area
    this.outputElement = document.createElement('div');
    this.outputElement.style.height = '200px';
    this.outputElement.style.overflowY = 'auto';
    this.outputElement.style.border = '1px solid #333';
    this.outputElement.style.padding = '5px';
    this.outputElement.style.marginBottom = '5px';
    this.outputElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    
    // Input area
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.alignItems = 'center';
    
    const prompt = document.createElement('span');
    prompt.textContent = '>>> ';
    prompt.style.color = '#00ff00';
    
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.style.flex = '1';
    this.inputElement.style.backgroundColor = 'transparent';
    this.inputElement.style.border = 'none';
    this.inputElement.style.color = 'white';
    this.inputElement.style.fontFamily = 'monospace';
    this.inputElement.style.fontSize = '12px';
    this.inputElement.style.outline = 'none';
    
    inputContainer.appendChild(prompt);
    inputContainer.appendChild(this.inputElement);
    
    this.consoleContainer.appendChild(this.outputElement);
    this.consoleContainer.appendChild(inputContainer);
    
    this.hudContainer.appendChild(this.consoleContainer);
    container.appendChild(this.hudContainer);
  }

  private setupEventListeners(): void {
    this.inputElement.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'Enter':
          this.executeCommand();
          break;
        case 'ArrowUp':
          this.navigateHistory(-1);
          break;
        case 'ArrowDown':
          this.navigateHistory(1);
          break;
        case 'Tab':
          event.preventDefault();
          this.handleAutoComplete();
          break;
      }
    });
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
        this.addOutput('result', typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
      }
    } catch (error) {
      this.addOutput('error', `Error: ${error.message}`);
    }
    
    this.inputElement.value = '';
    this.scrollToBottom();
  }

  private evaluateCommand(command: string): any {
    // Simple command parsing - can be enhanced with proper parser
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');
    
    if (cmd in this.replCommands) {
      const commandFn = (this.replCommands as any)[cmd];
      return args ? commandFn(args) : commandFn();
    } else {
      throw new Error(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
  }

  private addOutput(type: 'command' | 'result' | 'error' | 'info', content: string): void {
    const line = document.createElement('div');
    line.style.marginBottom = '2px';
    line.style.whiteSpace = 'pre-wrap';
    
    switch (type) {
      case 'command':
        line.style.color = '#00ff00';
        break;
      case 'result':
        line.style.color = '#ffffff';
        break;
      case 'error':
        line.style.color = '#ff4444';
        break;
      case 'info':
        line.style.color = '#888888';
        break;
    }
    
    line.textContent = content;
    this.outputElement.appendChild(line);
  }

  private clearOutput(): void {
    this.outputElement.innerHTML = '';
  }

  private scrollToBottom(): void {
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }

  private navigateHistory(direction: number): void {
    const newIndex = this.historyIndex + direction;
    if (newIndex >= 0 && newIndex < this.commandHistory.length) {
      this.historyIndex = newIndex;
      this.inputElement.value = this.commandHistory[this.historyIndex];
    }
  }

  private handleAutoComplete(): void {
    // Basic auto-complete implementation
    const input = this.inputElement.value;
    const commands = Object.keys(this.replCommands);
    const matches = commands.filter(cmd => cmd.startsWith(input));
    
    if (matches.length === 1) {
      this.inputElement.value = matches[0];
    } else if (matches.length > 1) {
      this.addOutput('info', `Suggestions: ${matches.join(', ')}`);
    }
  }

  private applyTheme(themeName: string): void {
    const themes: Record<string, any> = {
      dark: { bg: '#1a1a1a', text: '#ffffff', accent: '#00ff00' },
      light: { bg: '#ffffff', text: '#000000', accent: '#0066cc' },
      matrix: { bg: '#000000', text: '#00ff00', accent: '#00ff00' }
    };
    
    const theme = themes[themeName];
    if (theme) {
      this.hudContainer.style.backgroundColor = theme.bg;
      this.hudContainer.style.color = theme.text;
      this.outputElement.style.borderColor = theme.accent;
    }
  }

  public updateHUD(): void {
    const hudState = this.graph.state.hud;
    if (!hudState) {
      this.hudContainer.style.display = 'none';
      return;
    }
    
    if (hudState.visible) {
      this.hudContainer.style.display = 'block';
      
      // Handle console visibility
      if (hudState.console?.enabled) {
        this.consoleContainer.style.display = 'block';
      } else {
        this.consoleContainer.style.display = 'none';
      }
      
      // Handle legacy content
      if (hudState.content && !hudState.console?.enabled) {
        this.hudContainer.innerHTML = `<div>${hudState.content}</div>`;
      }
    } else {
      this.hudContainer.style.display = 'none';
    }
  }

  public dispose(): void {
    if (this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
  }
}
```

## Usage Examples

```javascript
// Enable console in initial spec
const spec = {
  // ... other properties
  hud: {
    visible: true,
    console: {
      enabled: true,
      history: [],
      currentInput: '',
      output: []
    }
  }
};

// Programmatic usage
graph.update({
  hud: {
    visible: true,
    console: {
      enabled: true
    }
  }
});

// Console commands users can type:
// >>> help
// >>> state
// >>> nodes
// >>> select n1
// >>> flyTo {"distance": 10, "phi": 1.5}
// >>> frame ["n1", "n2", "n3"]
// >>> theme matrix
// >>> clear
```

## Benefits

1. **Developer Experience**: Immediate feedback and debugging capabilities
2. **Learning Tool**: Interactive way to understand the API
3. **Debugging Aid**: Real-time inspection of graph state
4. **Prototyping**: Quick testing of layout and styling changes
5. **Documentation**: Self-documenting through help system and auto-completion

## Future Enhancements

1. **Scripting Support**: Allow multi-line scripts and functions
2. **Export/Import**: Save and load command sessions
3. **Custom Commands**: Plugin system for user-defined commands
4. **Syntax Highlighting**: Better visual feedback for commands
5. **File Operations**: Load data from files, export configurations