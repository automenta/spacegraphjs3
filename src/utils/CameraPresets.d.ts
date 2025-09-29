import { SpaceGraph } from '../core/SpaceGraph';
import { CameraSpec } from '../types';
export interface CameraPreset {
    id: string;
    name: string;
    description?: string;
    cameraState: CameraSpec;
    thumbnail?: string;
    category?: string;
    tags?: string[];
    isBookmark?: boolean;
    createdAt: number;
    updatedAt: number;
}
export interface CameraPresetsCollection {
    version: string;
    presets: CameraPreset[];
    categories: string[];
}
export declare class CameraPresetsManager {
    private graph;
    private presets;
    private categories;
    private storageKey;
    constructor(graph: SpaceGraph, storageKey?: string);
    /**
     * Create a new camera preset from current camera state
     */
    createPreset(name: string, options?: {
        description?: string;
        category?: string;
        tags?: string[];
        generateThumbnail?: boolean;
        isBookmark?: boolean;
    }): Promise<CameraPreset>;
    /**
     * Apply a camera preset
     */
    applyPreset(presetId: string, animation?: boolean): Promise<void>;
    /**
     * Get all presets
     */
    getAllPresets(): CameraPreset[];
    /**
     * Get all bookmarks
     */
    getBookmarks(): CameraPreset[];
    /**
     * Create a bookmark from current camera state
     */
    createBookmark(name: string, options?: {
        description?: string;
        category?: string;
        tags?: string[];
        generateThumbnail?: boolean;
    }): Promise<CameraPreset>;
    /**
     * Generate a thumbnail for the current view
     */
    private generateThumbnail;
    /**
     * Get presets by category
     */
    getPresetsByCategory(category: string): CameraPreset[];
    /**
     * Search presets by name, description, or tags
     */
    searchPresets(query: string): CameraPreset[];
    /**
     * Export presets to JSON
     */
    exportPresets(): string;
    /**
     * Import presets from JSON
     */
    importPresets(jsonString: string): void;
    /**
     * Save presets to localStorage
     */
    private savePresets;
    /**
     * Load presets from localStorage
     */
    private loadPresets;
    private generateId;
}
