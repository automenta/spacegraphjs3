/**
 * HUD Utilities - Common functions for HUD operations
 * Provides reusable utilities for creating and managing HUD elements
 */

export interface HUDTheme {
  background: string;
  border: string;
  text: string;
  header: string;
  headerText: string;
  content: string;
  closeButton: string;
  accent: string;
}

export interface HUDAnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  callback?: () => void;
}

export class HUDUtils {
  /**
   * Create a styled HTML element with common HUD properties
   */
  static createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    styles: Partial<CSSStyleDeclaration>,
    className?: string
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    // Apply styles
    Object.assign(element.style, styles);

    // Add class if provided
    if (className) {
      element.className = className;
    }

    return element;
  }

  /**
   * Apply theme colors to an element
   */
  static applyTheme(
    element: HTMLElement,
    theme: HUDTheme,
    elementType: keyof HUDTheme
  ): void {
    const color = theme[elementType];
    if (color) {
      switch (elementType) {
        case 'background':
          element.style.backgroundColor = color;
          break;
        case 'border':
          element.style.borderColor = color;
          break;
        case 'text':
        case 'headerText':
          element.style.color = color;
          break;
        case 'content':
          if (color !== 'transparent') {
            element.style.backgroundColor = color;
          }
          break;
      }
    }
  }

  /**
   * Animate element with configurable options
   */
  static animateElement(
    element: HTMLElement,
    from: Partial<CSSStyleDeclaration>,
    to: Partial<CSSStyleDeclaration>,
    config: HUDAnimationConfig = {}
  ): Promise<void> {
    const { duration = 300, delay = 0, easing = 'ease-out', callback } = config;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Apply initial styles
        Object.assign(element.style, from);

        // Set transition
        element.style.transition = `all ${duration}ms ${easing}`;

        // Force reflow
        void element.offsetHeight;

        // Apply target styles
        Object.assign(element.style, to);

        // Clean up and resolve
        setTimeout(() => {
          if (callback) callback();
          resolve();
        }, duration);
      }, delay);
    });
  }

  /**
   * Create a close button with standard styling and behavior
   */
  static createCloseButton(
    onClick: (e: MouseEvent) => void,
    theme: HUDTheme = HUDUtils.getDefaultTheme().dark
  ): HTMLSpanElement {
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.transition = 'transform 0.2s, color 0.2s';
    closeBtn.style.color = theme.closeButton;
    closeBtn.style.padding = '0 4px';

    closeBtn.onmouseenter = () => {
      closeBtn.style.color = '#ff4444';
      closeBtn.style.transform = 'scale(1.2)';
    };

    closeBtn.onmouseleave = () => {
      closeBtn.style.color = theme.closeButton;
      closeBtn.style.transform = 'scale(1)';
    };

    closeBtn.onclick = onClick;

    return closeBtn;
  }

  /**
   * Create a progress bar for notifications
   */
  static createProgressBar(duration: number): {
    container: HTMLDivElement;
    fill: HTMLDivElement;
  } {
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

    progressBar.appendChild(progressFill);

    // Start progress animation
    setTimeout(() => {
      progressFill.style.width = '0%';
    }, 10);

    return { container: progressBar, fill: progressFill };
  }

  /**
   * Add CSS animations to document head
   */
  static addCSSAnimations(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      
      @keyframes glow {
        0% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.3); }
        50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.6); }
        100% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.3); }
      }
      
      @keyframes typing {
        from { width: 0; }
        to { width: 100%; }
      }
      
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      
      @keyframes rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes matrix-rain {
        0% { background-position: 0 -100%; }
        100% { background-position: 0 100%; }
      }
      
      .hud-typing-effect {
        overflow: hidden;
        white-space: nowrap;
        animation: typing 2s steps(40, end);
      }
      
      .hud-cursor {
        animation: blink 1s infinite;
      }
      
      .hud-glow-effect {
        animation: glow 2s infinite;
      }
      
      .hud-pulse-effect {
        animation: pulse 1s infinite;
      }
      
      .hud-shake-effect {
        animation: shake 0.5s ease-in-out;
      }
      
      .hud-fade-in {
        animation: fadeIn 0.5s ease-out;
      }
      
      .hud-slide-in {
        animation: slideIn 0.3s ease-out;
      }
      
      .hud-rainbow-border {
        background: linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080);
        background-size: 400% 400%;
        animation: rainbow 3s ease infinite;
      }
      
      .hud-float-effect {
        animation: float 3s ease-in-out infinite;
      }
      
      .hud-rotate-effect {
        animation: rotate 2s linear infinite;
      }
      
      .hud-glass-effect {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .hud-neon-glow {
        text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
      }
      
      .hud-matrix-rain {
        background: linear-gradient(180deg, transparent, rgba(0, 255, 0, 0.1), transparent);
        animation: matrix-rain 2s linear infinite;
      }
      
      /* Custom scrollbar for HUD */
      .hud-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .hud-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
      }
      
      .hud-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }
      
      .hud-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
      
      /* Responsive HUD */
      @media (max-width: 768px) {
        .hud-container {
          font-size: 10px !important;
          min-width: 250px !important;
          max-width: 90vw !important;
        }
        
        .hud-panel {
          max-width: 90vw !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get default themes
   */
  static getDefaultTheme(): Record<string, HUDTheme> {
    return {
      dark: {
        background: 'rgba(0, 0, 0, 0.8)',
        border: 'rgba(255, 255, 255, 0.2)',
        text: '#ffffff',
        header: 'rgba(50, 50, 50, 0.8)',
        headerText: '#ffffff',
        content: 'transparent',
        closeButton: 'rgba(255, 255, 255, 0.7)',
        accent: '#00ff00',
      },
      light: {
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'rgba(0, 0, 0, 0.2)',
        text: '#000000',
        header: 'rgba(240, 240, 240, 0.9)',
        headerText: '#000000',
        content: 'transparent',
        closeButton: 'rgba(0, 0, 0, 0.7)',
        accent: '#0066cc',
      },
      matrix: {
        background: 'rgba(0, 0, 0, 0.9)',
        border: 'rgba(0, 255, 0, 0.3)',
        text: '#00ff00',
        header: 'rgba(0, 20, 0, 0.9)',
        headerText: '#00ff00',
        content: 'transparent',
        closeButton: '#00ff00',
        accent: '#00ff00',
      },
      neon: {
        background: 'rgba(20, 0, 40, 0.9)',
        border: 'rgba(255, 0, 255, 0.3)',
        text: '#ff00ff',
        header: 'rgba(40, 0, 80, 0.9)',
        headerText: '#ff00ff',
        content: 'transparent',
        closeButton: '#ff00ff',
        accent: '#ff00ff',
      },
    };
  }

  /**
   * Create a notification element with standard styling
   */
  static createNotification(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    _theme: HUDTheme = HUDUtils.getDefaultTheme().dark
  ): HTMLDivElement {
    const notification = document.createElement('div');
    notification.style.padding = '12px 16px';
    notification.style.borderRadius = '6px';
    notification.style.marginBottom = '8px';
    notification.style.minWidth = '220px';
    notification.style.maxWidth = '320px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
    notification.style.fontFamily = 'monospace';
    notification.style.fontSize = '13px';
    notification.style.wordWrap = 'break-word';
    notification.style.position = 'relative';
    notification.style.overflow = 'hidden';

    // Set colors based on type
    const colors = {
      info: {
        bg: 'rgba(23, 162, 184, 0.95)',
        text: 'white',
        border: '#17a2b8',
      },
      success: {
        bg: 'rgba(40, 167, 69, 0.95)',
        text: 'white',
        border: '#28a745',
      },
      warning: {
        bg: 'rgba(255, 193, 7, 0.95)',
        text: '#212529',
        border: '#ffc107',
      },
      error: {
        bg: 'rgba(220, 53, 69, 0.95)',
        text: 'white',
        border: '#dc3545',
      },
    };

    const colorSet = colors[type];
    notification.style.backgroundColor = colorSet.bg;
    notification.style.color = colorSet.text;
    notification.style.borderLeft = `4px solid ${colorSet.border}`;

    notification.textContent = message;

    return notification;
  }

  /**
   * Add interactive effects to an element
   */
  static addInteractiveEffects(
    element: HTMLElement,
    theme: HUDTheme,
    options: {
      onHover?: () => void;
      onLeave?: () => void;
      onClick?: () => void;
      enableFloat?: boolean;
      enableGlow?: boolean;
    } = {}
  ): void {
    const {
      onHover,
      onLeave,
      onClick,
      enableFloat = false,
      enableGlow = false,
    } = options;

    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.02)';
      element.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.7)';

      if (enableGlow) {
        element.classList.add('hud-glow-effect');
      }

      if (onHover) onHover();
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
      element.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';

      if (enableGlow) {
        element.classList.remove('hud-glow-effect');
      }

      if (onLeave) onLeave();
    });

    if (onClick) {
      element.addEventListener('click', onClick);
    }

    if (enableFloat) {
      element.classList.add('hud-float-effect');
    }
  }

  /**
   * Create a draggable panel with standard functionality
   */
  static createDraggablePanel(
    id: string,
    title: string,
    content: string,
    options: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      theme?: HUDTheme;
      animated?: boolean;
      onClose?: () => void;
    } = {}
  ): {
    panel: HTMLDivElement;
    header: HTMLDivElement;
    contentArea: HTMLDivElement;
  } {
    const {
      x = 10,
      y = 10,
      width = 300,
      height = 200,
      theme = HUDUtils.getDefaultTheme().dark,
      animated = true,
      onClose,
    } = options;

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: theme.background,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      zIndex: '1000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: theme.text,
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    } as CSSStyleDeclaration);

    if (animated) {
      panel.style.transform = 'scale(0.8) translateY(20px)';
      panel.style.opacity = '0';
    }

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      padding: '8px 12px',
      backgroundColor: theme.header,
      cursor: 'move',
      userSelect: 'none',
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '6px 6px 0 0',
      fontWeight: 'bold',
      color: theme.headerText,
    } as CSSStyleDeclaration);
    header.textContent = title;

    // Close button
    const closeBtn = HUDUtils.createCloseButton((e) => {
      e.stopPropagation();
      if (onClose) onClose();

      if (animated) {
        panel.style.transform = 'scale(0.8) translateY(20px)';
        panel.style.opacity = '0';
        setTimeout(() => {
          panel.style.display = 'none';
        }, 300);
      } else {
        panel.style.display = 'none';
      }
    }, theme);

    header.appendChild(closeBtn);

    // Content area
    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
      flex: '1',
      padding: '12px',
      overflow: 'auto',
      backgroundColor: theme.content,
      borderRadius: '0 0 6px 6px',
    } as CSSStyleDeclaration);
    contentArea.innerHTML = content;

    panel.appendChild(header);
    panel.appendChild(contentArea);

    // Animate in if enabled
    if (animated) {
      setTimeout(() => {
        panel.style.transform = 'scale(1) translateY(0)';
        panel.style.opacity = '1';
      }, 50);
    }

    return { panel, header, contentArea };
  }

  /**
   * Setup dragging for a panel
   */
  static setupDragging(
    panel: HTMLElement,
    header: HTMLElement,
    options: {
      onDragStart?: () => void;
      onDragEnd?: () => void;
      constrainToViewport?: boolean;
    } = {}
  ): void {
    const { onDragStart, onDragEnd, constrainToViewport = true } = options;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
      panel.style.zIndex = '1001'; // Bring to front
      e.preventDefault();

      if (onDragStart) onDragStart();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;

      if (constrainToViewport) {
        const rect = panel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
        newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
      }

      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        panel.style.zIndex = '1000'; // Reset z-index

        if (onDragEnd) onDragEnd();
      }
    });
  }
}

export default HUDUtils;
