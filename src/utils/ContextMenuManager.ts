import { EdgeSpec, NodeSpec } from '../types';

/**
 * Manages context menus for the interaction plugin
 */
export class ContextMenuManager {
  private contextMenuElement: HTMLElement | null = null;
  private contextMenuActive: boolean = false;

  /**
   * Show context menu for an edge
   * @param x - X coordinate for menu placement
   * @param y - Y coordinate for menu placement
   * @param edge - The edge the menu is for
   * @param sourceNode - The source node of the edge
   * @param targetNode - The target node of the edge
   * @param callbacks - Callback functions for menu actions
   */
  public showEdgeContextMenu(
    x: number, 
    y: number, 
    edge: EdgeSpec, 
    sourceNode: NodeSpec, 
    targetNode: NodeSpec,
    callbacks: {
      selectEdge: (edgeId: string) => void;
      deleteEdge: (edgeId: string) => void;
      editEdgeLabel: (edgeId: string) => void;
      reverseEdgeDirection: (edgeId: string) => void;
      highlightPath: (edgeId: string) => void;
      editEdgePath: (edgeId: string) => void;
    }
  ): void {
    // Hide any existing context menu
    this.hideContextMenu();
    
    // Create context menu element
    const menu = document.createElement('div');
    menu.className = 'spacegraph-context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = '#2d2d2d';
    menu.style.color = '#ffffff';
    menu.style.border = '1px solid #555555';
    menu.style.borderRadius = '4px';
    menu.style.padding = '4px 0';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    menu.style.zIndex = '10000';
    menu.style.minWidth = '150px';
    
    // Add menu items
    const items = [
      { label: 'Select Edge', action: () => callbacks.selectEdge(edge.id) },
      { label: 'Delete Edge', action: () => callbacks.deleteEdge(edge.id) },
      { label: 'Edit Label', action: () => callbacks.editEdgeLabel(edge.id) },
      { label: 'Reverse Direction', action: () => callbacks.reverseEdgeDirection(edge.id) },
      { label: 'Highlight Path', action: () => callbacks.highlightPath(edge.id) },
      { label: 'Edit Path', action: () => callbacks.editEdgePath(edge.id) }
    ];
    
    items.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.style.padding = '8px 12px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.fontSize = '14px';
      menuItem.textContent = item.label;
      
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#444444';
      });
      
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      
      menuItem.addEventListener('click', () => {
        item.action();
        this.hideContextMenu();
      });
      
      menu.appendChild(menuItem);
    });
    
    // Add to document
    document.body.appendChild(menu);
    this.contextMenuElement = menu;
    this.contextMenuActive = true;
    
    // Add click outside listener to hide menu
    const handleClickOutside = (e: MouseEvent) => {
      if (menu && !menu.contains(e.target as Node)) {
        this.hideContextMenu();
        document.removeEventListener('click', handleClickOutside);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }

  /**
   * Show context menu for a node
   * @param x - X coordinate for menu placement
   * @param y - Y coordinate for menu placement
   * @param node - The node the menu is for
   * @param callbacks - Callback functions for menu actions
   */
  public showNodeContextMenu(
    x: number, 
    y: number, 
    node: NodeSpec,
    callbacks: {
      selectNode: (nodeId: string) => void;
      deleteNode: (nodeId: string) => void;
      editNodeLabel: (nodeId: string) => void;
      addNodeConnection: (nodeId: string) => void;
      createGroup: () => void;
      addToGroup: (nodeId: string) => void;
    }
  ): void {
    // Hide any existing context menu
    this.hideContextMenu();
    
    // Create context menu element
    const menu = document.createElement('div');
    menu.className = 'spacegraph-context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = '#2d2d2d';
    menu.style.color = '#ffffff';
    menu.style.border = '1px solid #555555';
    menu.style.borderRadius = '4px';
    menu.style.padding = '4px 0';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    menu.style.zIndex = '10000';
    menu.style.minWidth = '150px';
    
    // Add menu items
    const items = [
      { label: 'Select Node', action: () => callbacks.selectNode(node.id) },
      { label: 'Delete Node', action: () => callbacks.deleteNode(node.id) },
      { label: 'Edit Label', action: () => callbacks.editNodeLabel(node.id) },
      { label: 'Add Connection', action: () => callbacks.addNodeConnection(node.id) },
      { label: 'Group Selected', action: () => callbacks.createGroup() },
      { label: 'Add to Group', action: () => callbacks.addToGroup(node.id) }
    ];
    
    items.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.style.padding = '8px 12px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.fontSize = '14px';
      menuItem.textContent = item.label;
      
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#444444';
      });
      
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      
      menuItem.addEventListener('click', () => {
        item.action();
        this.hideContextMenu();
      });
      
      menu.appendChild(menuItem);
    });
    
    // Add to document
    document.body.appendChild(menu);
    this.contextMenuElement = menu;
    this.contextMenuActive = true;
    
    // Add click outside listener to hide menu
    const handleClickOutside = (e: MouseEvent) => {
      if (menu && !menu.contains(e.target as Node)) {
        this.hideContextMenu();
        document.removeEventListener('click', handleClickOutside);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }

  /**
   * Show context menu for the background
   * @param x - X coordinate for menu placement
   * @param y - Y coordinate for menu placement
   * @param callbacks - Callback functions for menu actions
   */
  public showBackgroundContextMenu(
    x: number, 
    y: number,
    callbacks: {
      addNodeAtPosition: (x: number, y: number) => void;
      selectAll: () => void;
      clearAllSelections: () => void;
      resetView: () => void;
    }
  ): void {
    // Hide any existing context menu
    this.hideContextMenu();
    
    // Create context menu element
    const menu = document.createElement('div');
    menu.className = 'spacegraph-context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = '#2d2d2d';
    menu.style.color = '#ffffff';
    menu.style.border = '1px solid #555555';
    menu.style.borderRadius = '4px';
    menu.style.padding = '4px 0';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    menu.style.zIndex = '10000';
    menu.style.minWidth = '150px';
    
    // Add menu items
    const items = [
      { label: 'Add Node', action: () => callbacks.addNodeAtPosition(x, y) },
      { label: 'Select All', action: () => callbacks.selectAll() },
      { label: 'Clear Selection', action: () => callbacks.clearAllSelections() },
      { label: 'Reset View', action: () => callbacks.resetView() }
    ];
    
    items.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.style.padding = '8px 12px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.fontSize = '14px';
      menuItem.textContent = item.label;
      
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#444444';
      });
      
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      
      menuItem.addEventListener('click', () => {
        item.action();
        this.hideContextMenu();
      });
      
      menu.appendChild(menuItem);
    });
    
    // Add to document
    document.body.appendChild(menu);
    this.contextMenuElement = menu;
    this.contextMenuActive = true;
    
    // Add click outside listener to hide menu
    const handleClickOutside = (e: MouseEvent) => {
      if (menu && !menu.contains(e.target as Node)) {
        this.hideContextMenu();
        document.removeEventListener('click', handleClickOutside);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }

  /**
   * Hide the context menu
   */
  public hideContextMenu(): void {
    if (this.contextMenuElement) {
      if (this.contextMenuElement.parentNode) {
        this.contextMenuElement.parentNode.removeChild(this.contextMenuElement);
      }
      this.contextMenuElement = null;
      this.contextMenuActive = false;
    }
  }

  /**
   * Check if a context menu is currently active
   * @returns boolean indicating if a context menu is active
   */
  public isContextMenuActive(): boolean {
    return this.contextMenuActive;
  }
}