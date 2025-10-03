import { SpaceGraph } from '../core/SpaceGraph';
import { CameraSpec } from '../types';

export interface CameraPreset {
  id: string;
  name: string;
  description?: string;
  cameraState: CameraSpec;
  thumbnail?: string; // Base64 encoded thumbnail
  category?: string;
  tags?: string[];
  isBookmark?: boolean; // Flag to identify bookmarks
  createdAt: number;
  updatedAt: number;
}

export interface CameraPresetsCollection {
  version: string;
  presets: CameraPreset[];
  categories: string[];
}

export class CameraPresetsManager {
  private graph: SpaceGraph;
  private presets: Map<string, CameraPreset> = new Map();
  private categories: Set<string> = new Set();
  private storageKey: string;

  constructor(graph: SpaceGraph, storageKey = 'spacegraph-camera-presets') {
    this.graph = graph;
    this.storageKey = storageKey;
    this.loadPresets();
  }

  /**
   * Create a new camera preset from current camera state
   */
  public async createPreset(
    name: string,
    options: {
      description?: string;
      category?: string;
      tags?: string[];
      generateThumbnail?: boolean;
      isBookmark?: boolean;
    } = {}
  ): Promise<CameraPreset> {
    const currentState = this.graph.state.camera;
    const thumbnail = options.generateThumbnail
      ? await this.generateThumbnail()
      : undefined;

    const preset: CameraPreset = {
      id: this.generateId(),
      name,
      description: options.description,
      cameraState: { ...currentState },
      thumbnail,
      category: options.category,
      tags: options.tags,
      isBookmark: options.isBookmark || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.presets.set(preset.id, preset);

    if (preset.category) {
      this.categories.add(preset.category);
    }

    this.savePresets();
    return preset;
  }

  /**
   * Apply a camera preset
   */
  public async applyPreset(
    presetId: string,
    animation: boolean = true
  ): Promise<void> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Camera preset with ID ${presetId} not found`);
    }

    if (animation) {
      await this.graph.cameraPlugin?.flyTo(preset.cameraState, {
        duration: 1000,
      });
    } else {
      this.graph.update({ camera: preset.cameraState });
    }
  }

  /**
   * Get all presets
   */
  public getAllPresets(): CameraPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get all bookmarks
   */
  public getBookmarks(): CameraPreset[] {
    return Array.from(this.presets.values()).filter(
      (preset) => preset.isBookmark
    );
  }

  /**
   * Create a bookmark from current camera state
   */
  public async createBookmark(
    name: string,
    options: {
      description?: string;
      category?: string;
      tags?: string[];
      generateThumbnail?: boolean;
    } = {}
  ): Promise<CameraPreset> {
    return this.createPreset(name, {
      ...options,
      isBookmark: true,
    });
  }

  /**
   * Generate a thumbnail for the current view
   */
  private async generateThumbnail(): Promise<string> {
    // Render current scene to canvas
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
  }

  /**
   * Get presets by category
   */
  public getPresetsByCategory(category: string): CameraPreset[] {
    return Array.from(this.presets.values())
      .filter((preset) => preset.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search presets by name, description, or tags
   */
  public searchPresets(query: string): CameraPreset[] {
    const lowercaseQuery = query.toLowerCase();

    return Array.from(this.presets.values())
      .filter(
        (preset) =>
          preset.name.toLowerCase().includes(lowercaseQuery) ||
          preset.description?.toLowerCase().includes(lowercaseQuery) ||
          preset.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Export presets to JSON
   */
  public exportPresets(): string {
    const collection: CameraPresetsCollection = {
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
      const collection: CameraPresetsCollection = JSON.parse(jsonString);

      if (collection.presets) {
        for (const preset of collection.presets) {
          this.presets.set(preset.id, preset);

          if (preset.category) {
            this.categories.add(preset.category);
          }
        }
      }

      if (collection.categories) {
        for (const category of collection.categories) {
          this.categories.add(category);
        }
      }

      this.savePresets();
    } catch (error) {
      throw new Error(
        `Failed to import camera presets: ${(error as Error).message}`
      );
    }
  }

  /**
   * Save presets to localStorage
   */
  private savePresets(): void {
    try {
      const collection: CameraPresetsCollection = {
        version: '1.0',
        presets: Array.from(this.presets.values()),
        categories: Array.from(this.categories),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(collection));
    } catch (error) {
      console.warn('Failed to save camera presets:', error);
    }
  }

  /**
   * Load presets from localStorage
   */
  private loadPresets(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const collection: CameraPresetsCollection = JSON.parse(stored);

      if (collection.presets) {
        for (const preset of collection.presets) {
          this.presets.set(preset.id, preset);

          if (preset.category) {
            this.categories.add(preset.category);
          }
        }
      }

      if (collection.categories) {
        for (const category of collection.categories) {
          this.categories.add(category);
        }
      }
    } catch (error) {
      console.warn('Failed to load camera presets:', error);
    }
  }

  private generateId(): string {
    return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
