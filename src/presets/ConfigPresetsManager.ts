import { SpaceGraph } from '../core/SpaceGraph';
import { ConfigPreset, ConfigPresetsCollection, DeepPartial, Spec } from '../types';
import { deepMerge } from '../utils/deepMerge';

export class ConfigPresetsManager {
  private graph: SpaceGraph;
  private presets: Map<string, ConfigPreset> = new Map();
  private categories: Set<string> = new Set();
  private storageKey: string;

  constructor(graph: SpaceGraph, storageKey = 'spacegraph-config-presets') {
    this.graph = graph;
    this.storageKey = storageKey;
    this.loadPresets();
    this.initializeBuiltInPresets();
  }

  /**
   * Initialize built-in presets
   */
  private initializeBuiltInPresets(): void {
    const builtInPresets: ConfigPreset[] = [
      this.createNetworkPreset(),
      this.createMindmapPreset(),
      this.createFlowchartPreset(),
      this.createMinimalPreset(),
      this.createPerformancePreset(),
    ];

    for (const preset of builtInPresets) {
      if (!this.presets.has(preset.id)) {
        this.presets.set(preset.id, preset);
        this.categories.add(preset.category);
      }
    }

    this.savePresets();
  }

  /**
   * Create network preset (dark theme, force-directed layout)
   */
  private createNetworkPreset(): ConfigPreset {
    return {
      id: 'network',
      name: 'Network Graph',
      description: 'Dark theme with force-directed layout for network visualizations',
      category: 'network',
      spec: {
        style: {
          'node:hover': {
            color: '#00ffff',
            glow: { color: '#00ffff', strength: 0.8 },
          },
          'node:selected': {
            color: '#ff6b6b',
            glow: { color: '#ff6b6b', strength: 1.0 },
          },
          'edge:hover': {
            color: '#ffa726',
            width: 3,
            glow: { color: '#ffa726', strength: 0.5 },
          },
          'edge:selected': {
            color: '#ab47bc',
            width: 4,
            glow: { color: '#ab47bc', strength: 0.7 },
          },
        },
        layout: {
          type: 'force-directed',
          charge: -400,
          linkDistance: 80,
          linkStrength: 0.1,
        },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 3,
          theta: Math.PI / 4,
          distance: 100,
        },
        performance: {
          instancingThreshold: 200,
          enableLOD: true,
          enableCulling: true,
          enableMemoryManagement: true,
        },
      },
      tags: ['dark', 'force-directed', 'network'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Create mindmap preset (organic layout, hierarchical styling)
   */
  private createMindmapPreset(): ConfigPreset {
    return {
      id: 'mindmap',
      name: 'Mind Map',
      description: 'Organic layout with hierarchical styling for mind maps',
      category: 'mindmap',
      spec: {
        style: {
          'node:hover': {
            color: '#4ecdc4',
            glow: { color: '#4ecdc4', strength: 0.6 },
          },
          'node:selected': {
            color: '#45b7d1',
            glow: { color: '#45b7d1', strength: 0.8 },
          },
          'edge:hover': {
            color: '#96ceb4',
            width: 2,
            opacity: 0.8,
          },
          'edge:selected': {
            color: '#ffeaa7',
            width: 3,
            opacity: 1.0,
          },
        },
        layout: {
          type: 'circle',
          radius: 25,
          dimensions: 2,
        },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 80,
        },
        performance: {
          instancingThreshold: 150,
          enableLOD: true,
          enableCulling: false,
          enableMemoryManagement: true,
        },
      },
      tags: ['organic', 'hierarchical', 'mindmap'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Create flowchart preset (grid layout, directional edges)
   */
  private createFlowchartPreset(): ConfigPreset {
    return {
      id: 'flowchart',
      name: 'Flowchart',
      description: 'Grid layout with directional edges for flowcharts',
      category: 'flowchart',
      spec: {
        style: {
          'node:hover': {
            color: '#74b9ff',
            glow: { color: '#74b9ff', strength: 0.5 },
          },
          'node:selected': {
            color: '#0984e3',
            glow: { color: '#0984e3', strength: 0.7 },
          },
          'edge:hover': {
            color: '#00b894',
            width: 4,
            opacity: 0.9,
          },
          'edge:selected': {
            color: '#00cec9',
            width: 5,
            opacity: 1.0,
          },
          'edge:source-selected': {
            color: '#fdcb6e',
            width: 3,
          },
          'edge:target-selected': {
            color: '#e17055',
            width: 3,
          },
        },
        layout: {
          type: 'grid',
          dimensions: 2,
          spacing: 3,
          columns: 4,
        },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 4,
          theta: Math.PI / 6,
          distance: 60,
        },
        performance: {
          instancingThreshold: 100,
          enableLOD: false,
          enableCulling: false,
          enableMemoryManagement: true,
        },
      },
      tags: ['grid', 'directional', 'flowchart'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Create minimal preset for basic graphs
   */
  private createMinimalPreset(): ConfigPreset {
    return {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean, minimal styling for basic graph visualizations',
      category: 'minimal',
      spec: {
        style: {
          'node:hover': {
            color: '#636e72',
            glow: { color: '#636e72', strength: 0.3 },
          },
          'node:selected': {
            color: '#2d3436',
            glow: { color: '#2d3436', strength: 0.5 },
          },
          'edge:hover': {
            color: '#b2bec3',
            width: 2,
          },
          'edge:selected': {
            color: '#636e72',
            width: 3,
          },
        },
        layout: {
          type: 'circle',
          radius: 15,
          dimensions: 2,
        },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 2,
          theta: 0,
          distance: 40,
        },
        performance: {
          instancingThreshold: 50,
          enableLOD: false,
          enableCulling: false,
          enableMemoryManagement: false,
        },
      },
      tags: ['clean', 'minimal', 'basic'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Create performance preset for large datasets
   */
  private createPerformancePreset(): ConfigPreset {
    return {
      id: 'performance',
      name: 'High Performance',
      description: 'Optimized settings for large datasets with performance enhancements',
      category: 'performance',
      spec: {
        style: {
          'node:hover': {
            color: '#a29bfe',
            glow: { color: '#a29bfe', strength: 0.2 },
          },
          'node:selected': {
            color: '#6c5ce7',
            glow: { color: '#6c5ce7', strength: 0.4 },
          },
          'edge:hover': {
            color: '#fd79a8',
            width: 2,
            opacity: 0.6,
          },
          'edge:selected': {
            color: '#e84393',
            width: 3,
            opacity: 0.8,
          },
        },
        layout: {
          type: 'column',
          spacing: 1,
          columns: 8,
        },
        camera: {
          target: { x: 0, y: 0, z: 0 },
          phi: Math.PI / 3,
          theta: Math.PI / 4,
          distance: 200,
        },
        performance: {
          instancingThreshold: 500,
          enableLOD: true,
          enableCulling: true,
          enableMemoryManagement: true,
          useBasicRenderer: true,
        },
      },
      tags: ['performance', 'large-dataset', 'optimized'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Apply a configuration preset
   */
  public applyPreset(presetId: string): void {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Configuration preset with ID ${presetId} not found`);
    }

    // Merge the preset spec with current state
    const mergedSpec = deepMerge(this.graph.state, preset.spec);
    this.graph.updateStateWithProducer(() => mergedSpec);
  }

  /**
   * Create a custom preset from current configuration
   */
  public createPreset(
    name: string,
    category: ConfigPreset['category'],
    options: {
      description?: string;
      tags?: string[];
      generateThumbnail?: boolean;
    } = {}
  ): ConfigPreset {
    const currentState = this.graph.state;
    const thumbnail = options.generateThumbnail
      ? this.generateThumbnail()
      : undefined;

    const preset: ConfigPreset = {
      id: this.generateId(),
      name,
      description: options.description || `Custom preset: ${name}`,
      category,
      spec: {
        style: currentState.style,
        layout: currentState.layout,
        camera: currentState.camera,
        controls: currentState.controls,
        performance: currentState.performance,
      },
      thumbnail,
      tags: options.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.presets.set(preset.id, preset);
    if (category !== 'custom') {
      this.categories.add(category);
    }

    this.savePresets();
    return preset;
  }

  /**
   * Get all presets
   */
  public getAllPresets(): ConfigPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get presets by category
   */
  public getPresetsByCategory(category: string): ConfigPreset[] {
    return Array.from(this.presets.values())
      .filter((preset) => preset.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get built-in presets only
   */
  public getBuiltInPresets(): ConfigPreset[] {
    const builtInIds = ['network', 'mindmap', 'flowchart', 'minimal', 'performance'];
    return builtInIds
      .map(id => this.presets.get(id))
      .filter((preset): preset is ConfigPreset => preset !== undefined);
  }

  /**
   * Search presets by name, description, or tags
   */
  public searchPresets(query: string): ConfigPreset[] {
    const lowercaseQuery = query.toLowerCase();

    return Array.from(this.presets.values())
      .filter(
        (preset) =>
          preset.name.toLowerCase().includes(lowercaseQuery) ||
          preset.description.toLowerCase().includes(lowercaseQuery) ||
          preset.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Export presets to JSON
   */
  public exportPresets(): string {
    const collection: ConfigPresetsCollection = {
      version: '1.0',
      presets: Array.from(this.presets.values()),
      categories: Array.from(this.categories),
    };

    return JSON.stringify(collection, null, 2);
  }

  /**
   * Import presets from JSON
   */
  public importPresets(jsonString: string): void {
    try {
      const collection: ConfigPresetsCollection = JSON.parse(jsonString);

      if (collection.presets) {
        for (const preset of collection.presets) {
          // Skip built-in presets to avoid overwriting
          if (!['network', 'mindmap', 'flowchart', 'minimal', 'performance'].includes(preset.id)) {
            this.presets.set(preset.id, preset);

            if (preset.category !== 'custom') {
              this.categories.add(preset.category);
            }
          }
        }
      }

      this.savePresets();
    } catch (error) {
      throw new Error(
        `Failed to import configuration presets: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate a thumbnail for the current view
   */
  private generateThumbnail(): string {
    try {
      const renderer = this.graph.render.getRenderer();
      const canvas = renderer.domElement;

      // Create thumbnail at reduced resolution
      const thumbnailCanvas = document.createElement('canvas');
      thumbnailCanvas.width = 200;
      thumbnailCanvas.height = 150;

      const ctx = thumbnailCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

      return thumbnailCanvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
      return '';
    }
  }

  /**
   * Save presets to localStorage
   */
  private savePresets(): void {
    try {
      const collection: ConfigPresetsCollection = {
        version: '1.0',
        presets: Array.from(this.presets.values()),
        categories: Array.from(this.categories),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(collection));
    } catch (error) {
      console.warn('Failed to save configuration presets:', error);
    }
  }

  /**
   * Load presets from localStorage
   */
  private loadPresets(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const collection: ConfigPresetsCollection = JSON.parse(stored);

      if (collection.presets) {
        for (const preset of collection.presets) {
          // Only load custom presets from storage, built-ins are created fresh
          if (!['network', 'mindmap', 'flowchart', 'minimal', 'performance'].includes(preset.id)) {
            this.presets.set(preset.id, preset);

            if (preset.category !== 'custom') {
              this.categories.add(preset.category);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load configuration presets:', error);
    }
  }

  private generateId(): string {
    return `config-preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}