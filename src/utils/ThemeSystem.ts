/**
 * Theme System - Comprehensive theming and styling utilities
 * Provides unified theming with dynamic switching and customization
 */

import * as THREE from 'three';
import { Logger } from './Logger';

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
    glow: string;
  };
  materials: {
    node: any; // Using any for material parameters to avoid TypeScript issues
    edge: any;
    background: any;
    highlight: any;
    selected: any;
  };
  effects: {
    glowIntensity: number;
    shadowIntensity: number;
    animationSpeed: number;
    particleDensity: number;
    blurAmount: number;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
  };
  spacing: {
    unit: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
}

export interface ThemeConfig {
  allowCustomThemes?: boolean;
  transitionDuration?: number;
  autoSwitch?: boolean;
  timeBasedSwitching?: boolean;
}

export class ThemeSystem {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme;
  private config: ThemeConfig;
  private themeChangeCallbacks: Array<(theme: Theme) => void> = [];
  private customProperties: Map<string, any> = new Map();

  private logger: Logger;
  
  constructor(config: ThemeConfig = {}) {
    this.logger = Logger.getInstance();
    
    this.config = {
      allowCustomThemes: true,
      transitionDuration: 300,
      autoSwitch: false,
      timeBasedSwitching: false,
      ...config
    };

    try {
      this.initializeDefaultThemes();
      this.currentTheme = this.themes.get('dark')!;
      
      if (this.config.autoSwitch) {
        this.setupAutoSwitching();
      }
    } catch (error) {
      this.logger.error('ThemeSystem', 'Failed to initialize theme system', error);
      throw error;
    }
  }

  /**
   * Initialize default themes
   */
  private initializeDefaultThemes(): void {
    // Dark theme
    this.themes.set('dark', {
      name: 'dark',
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: '#334155',
        shadow: '#000000',
        glow: '#3b82f6'
      },
      materials: {
        node: { color: 0x3b82f6, emissive: 0x1e40af, emissiveIntensity: 0.2 },
        edge: { color: 0x64748b, transparent: true, opacity: 0.8 },
        background: { color: 0x0f172a },
        highlight: { color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 },
        selected: { color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 0.3 }
      },
      effects: {
        glowIntensity: 1.0,
        shadowIntensity: 0.8,
        animationSpeed: 1.0,
        particleDensity: 1.0,
        blurAmount: 0.5
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5
      },
      spacing: {
        unit: 8,
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32
      }
    });

    // Light theme
    this.themes.set('light', {
      name: 'light',
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#d97706',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        shadow: '#000000',
        glow: '#2563eb'
      },
      materials: {
        node: { color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.1 },
        edge: { color: 0x64748b, transparent: true, opacity: 0.6 },
        background: { color: 0xffffff },
        highlight: { color: 0xd97706, emissive: 0xd97706, emissiveIntensity: 0.3 },
        selected: { color: 0x7c3aed, emissive: 0x7c3aed, emissiveIntensity: 0.2 }
      },
      effects: {
        glowIntensity: 0.8,
        shadowIntensity: 0.4,
        animationSpeed: 1.0,
        particleDensity: 0.8,
        blurAmount: 0.3
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5
      },
      spacing: {
        unit: 8,
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32
      }
    });

    // Matrix theme
    this.themes.set('matrix', {
      name: 'matrix',
      colors: {
        primary: '#00ff41',
        secondary: '#008f11',
        accent: '#39ff14',
        background: '#000000',
        surface: '#003b00',
        text: '#00ff41',
        textSecondary: '#008f11',
        border: '#00ff41',
        shadow: '#000000',
        glow: '#00ff41'
      },
      materials: {
        node: { color: 0x00ff41, emissive: 0x00ff41, emissiveIntensity: 0.5 },
        edge: { color: 0x008f11, transparent: true, opacity: 0.9 },
        background: { color: 0x000000 },
        highlight: { color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 0.8 },
        selected: { color: 0x00ff41, emissive: 0x00ff41, emissiveIntensity: 0.6 }
      },
      effects: {
        glowIntensity: 2.0,
        shadowIntensity: 1.0,
        animationSpeed: 1.5,
        particleDensity: 2.0,
        blurAmount: 0.2
      },
      typography: {
        fontFamily: 'Courier New, monospace',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.4
      },
      spacing: {
        unit: 8,
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32
      }
    });

    // Neon theme
    this.themes.set('neon', {
      name: 'neon',
      colors: {
        primary: '#ff00ff',
        secondary: '#00ffff',
        accent: '#ffff00',
        background: '#0a0a0a',
        surface: '#1a0a1a',
        text: '#ff00ff',
        textSecondary: '#00ffff',
        border: '#ff00ff',
        shadow: '#000000',
        glow: '#ff00ff'
      },
      materials: {
        node: { color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.6 },
        edge: { color: 0x00ffff, transparent: true, opacity: 0.8 },
        background: { color: 0x0a0a0a },
        highlight: { color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1.0 },
        selected: { color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.8 }
      },
      effects: {
        glowIntensity: 2.5,
        shadowIntensity: 0.9,
        animationSpeed: 1.2,
        particleDensity: 1.5,
        blurAmount: 0.1
      },
      typography: {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.3
      },
      spacing: {
        unit: 8,
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32
      }
    });
  }

  /**
   * Setup automatic theme switching
   */
  private setupAutoSwitching(): void {
    if (this.config.timeBasedSwitching) {
      // Switch themes based on time of day
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
        this.setTheme('light');
      } else {
        this.setTheme('dark');
      }
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        this.setTheme(e.matches ? 'dark' : 'light');
      });
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get theme by name
   */
  getTheme(name: string): Theme | undefined {
    return this.themes.get(name);
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Set current theme
   */
  setTheme(name: string): boolean {
    // Validate input
    if (!name) {
      this.logger.warn('ThemeSystem', 'Cannot set theme with empty name');
      return false;
    }
    
    const theme = this.themes.get(name);
    if (!theme) {
      this.logger.warn('ThemeSystem', `Theme not found: ${name}`);
      return false;
    }

    try {
      const previousTheme = this.currentTheme;
      this.currentTheme = theme;

      // Apply theme transition
      this.applyThemeTransition(previousTheme, theme);

      // Notify callbacks
      this.themeChangeCallbacks.forEach(callback => {
        try {
          callback(theme);
        } catch (error) {
          this.logger.error('ThemeSystem', 'Error in theme change callback', error);
        }
      });

      return true;
    } catch (error) {
      this.logger.error('ThemeSystem', 'Failed to set theme', error);
      return false;
    }
  }

  /**
   * Apply theme transition
   */
  private applyThemeTransition(from: Theme, to: Theme): void {
    if (this.config.transitionDuration === 0) return;

    // Apply CSS transitions
    const root = document.documentElement;
    const duration = `${this.config.transitionDuration}ms`;

    // Set CSS custom properties
    Object.entries(to.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
      root.style.setProperty(`--theme-transition-duration`, duration);
    });

    // Apply material transitions
    this.applyMaterialTransitions(from.materials, to.materials);
  }

  /**
   * Apply material transitions
   */
  private applyMaterialTransitions(from: any, to: any): void {
    // This would be implemented based on your specific material handling
    // For now, we'll just ensure smooth color transitions
    Object.keys(to).forEach(materialType => {
      if (from[materialType] && to[materialType]) {
        // Interpolate material properties
        this.interpolateMaterialProperties(from[materialType], to[materialType]);
      }
    });
  }

  /**
   * Interpolate material properties
   */
  private interpolateMaterialProperties(from: any, to: any): void {
    // Simple color interpolation for now
    if (from.color !== undefined && to.color !== undefined) {
      const fromColor = new THREE.Color(from.color);
      const toColor = new THREE.Color(to.color);
      
      // This would be expanded based on your material system
      fromColor.lerp(toColor, 1);
    }
  }

  /**
   * Create custom theme
   */
  createCustomTheme(name: string, baseTheme: string, customizations: Partial<Theme>): Theme | null {
    // Validate inputs
    if (!name) {
      this.logger.warn('ThemeSystem', 'Cannot create theme with empty name');
      return null;
    }
    
    if (!baseTheme) {
      this.logger.warn('ThemeSystem', 'Cannot create theme without base theme');
      return null;
    }
    
    if (!this.config.allowCustomThemes) {
      this.logger.warn('ThemeSystem', 'Custom themes are not allowed');
      return null;
    }

    const base = this.themes.get(baseTheme);
    if (!base) {
      this.logger.warn('ThemeSystem', `Base theme not found: ${baseTheme}`);
      return null;
    }

    try {
      const customTheme: Theme = {
        ...base,
        name,
        colors: { ...base.colors, ...customizations.colors },
        materials: { ...base.materials, ...customizations.materials },
        effects: { ...base.effects, ...customizations.effects },
        typography: { ...base.typography, ...customizations.typography },
        spacing: { ...base.spacing, ...customizations.spacing }
      };

      this.themes.set(name, customTheme);
      return customTheme;
    } catch (error) {
      this.logger.error('ThemeSystem', 'Failed to create custom theme', error);
      return null;
    }
  }

  /**
   * Delete custom theme
   */
  deleteCustomTheme(name: string): boolean {
    if (!this.config.allowCustomThemes) return false;
    
    const theme = this.themes.get(name);
    if (!theme || this.isDefaultTheme(name)) return false;

    this.themes.delete(name);
    return true;
  }

  /**
   * Check if theme is a default theme
   */
  private isDefaultTheme(name: string): boolean {
    return ['dark', 'light', 'matrix', 'neon'].includes(name);
  }

  /**
   * Get color with opacity
   */
  getColorWithOpacity(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Get contrasting color
   */
  getContrastingColor(color: string): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  /**
   * Generate color palette from base color
   */
  generateColorPalette(baseColor: string): { primary: string; secondary: string; accent: string } {
    const base = new THREE.Color(baseColor);
    
    const primary = base.getHexString();
    const secondary = base.clone().offsetHSL(0.33, 0, 0).getHexString();
    const accent = base.clone().offsetHSL(0.66, 0, 0).getHexString();
    
    return {
      primary: `#${primary}`,
      secondary: `#${secondary}`,
      accent: `#${accent}`
    };
  }

  /**
   * Apply theme to Three.js material
   */
  applyThemeToMaterial(material: THREE.Material, materialType: keyof Theme['materials']): void {
    const theme = this.currentTheme;
    const materialParams = theme.materials[materialType];

    if (material instanceof THREE.MeshBasicMaterial) {
      if (materialParams.color !== undefined) (material as any).color.setHex(materialParams.color as number);
      if (materialParams.transparent !== undefined) (material as any).transparent = materialParams.transparent;
      if (materialParams.opacity !== undefined) (material as any).opacity = materialParams.opacity;
    } else if (material instanceof THREE.MeshStandardMaterial) {
      if (materialParams.color !== undefined) (material as any).color.setHex(materialParams.color as number);
      if (materialParams.emissive !== undefined) (material as any).emissive.setHex(materialParams.emissive as number);
      if (materialParams.emissiveIntensity !== undefined) (material as any).emissiveIntensity = materialParams.emissiveIntensity;
    }
  }

  /**
   * Get CSS variables for current theme
   */
  getCSSVariables(): Record<string, string> {
    const theme = this.currentTheme;
    const variables: Record<string, string> = {};

    Object.entries(theme.colors).forEach(([key, value]) => {
      variables[`--theme-${key}`] = value;
    });

    variables['--theme-font-family'] = theme.typography.fontFamily;
    variables['--theme-font-size'] = `${theme.typography.fontSize}px`;
    variables['--theme-font-weight'] = theme.typography.fontWeight.toString();
    variables['--theme-line-height'] = theme.typography.lineHeight.toString();
    variables['--theme-spacing-unit'] = `${theme.spacing.unit}px`;
    variables['--theme-glow-intensity'] = theme.effects.glowIntensity.toString();
    variables['--theme-animation-speed'] = theme.effects.animationSpeed.toString();

    return variables;
  }

  /**
   * Apply CSS variables to element
   */
  applyCSSToElement(element: HTMLElement): void {
    const variables = this.getCSSVariables();
    Object.entries(variables).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }

  /**
   * Add theme change callback
   */
  onThemeChange(callback: (theme: Theme) => void): void {
    this.themeChangeCallbacks.push(callback);
  }

  /**
   * Remove theme change callback
   */
  removeThemeChangeCallback(callback: (theme: Theme) => void): void {
    const index = this.themeChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.themeChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Export theme as JSON
   */
  exportTheme(name: string): string | null {
    const theme = this.themes.get(name);
    if (!theme) return null;

    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON
   */
  importTheme(json: string): Theme | null {
    // Validate input
    if (!json) {
      this.logger.warn('ThemeSystem', 'Cannot import empty theme JSON');
      return null;
    }
    
    try {
      const themeData = JSON.parse(json);
      const theme: Theme = {
        ...themeData,
        materials: this.validateMaterials(themeData.materials)
      };

      if (this.config.allowCustomThemes) {
        this.themes.set(theme.name, theme);
      }

      return theme;
    } catch (error) {
      this.logger.error('ThemeSystem', 'Failed to import theme', error);
      return null;
    }
  }

  /**
   * Validate material parameters
   */
  private validateMaterials(materials: any): Theme['materials'] {
    // Ensure all required material types are present
    const defaultMaterials = this.themes.get('dark')!.materials;
    
    return {
      node: { ...defaultMaterials.node, ...materials.node },
      edge: { ...defaultMaterials.edge, ...materials.edge },
      background: { ...defaultMaterials.background, ...materials.background },
      highlight: { ...defaultMaterials.highlight, ...materials.highlight },
      selected: { ...defaultMaterials.selected, ...materials.selected }
    };
  }

  /**
   * Get theme preview
   */
  getThemePreview(name: string): { colors: string[]; description: string } | null {
    const theme = this.themes.get(name);
    if (!theme) return null;

    const colors = [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.accent,
      theme.colors.background,
      theme.colors.surface
    ];

    const descriptions: Record<string, string> = {
      dark: 'Professional dark theme with blue accents',
      light: 'Clean light theme with subtle colors',
      matrix: 'Cyberpunk-inspired green matrix theme',
      neon: 'Vibrant neon theme with purple and cyan'
    };

    return {
      colors,
      description: descriptions[name] || 'Custom theme'
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    try {
      this.themes.clear();
      this.themeChangeCallbacks = [];
      this.customProperties.clear();
    } catch (error) {
      this.logger.error('ThemeSystem', 'Failed to dispose theme system', error);
    }
  }
}

export default ThemeSystem;