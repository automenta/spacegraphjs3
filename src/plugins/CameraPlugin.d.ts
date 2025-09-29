import * as THREE from 'three';
import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
import { SpecUpdate, RotationConstraints } from '../types';
import { CameraPresetsManager, CameraPreset } from '../utils/CameraPresets';
// AnimationCurve and AnimationCurves are used in the implementation but not directly in the type definitions
import { AnimationCurves } from '../utils/AnimationUtils';
/**
 * A plugin that manages the camera and provides camera control methods.
 * It synchronizes the Three.js camera with the reactive state.
 */
export declare class CameraPlugin implements ISpaceGraphPlugin {
    private graph;
    private threeCamera;
    private activeKeys;
    private boundOnKeyDown;
    private boundOnKeyUp;
    private presetsManager;
    private rotationConstraints;
    private rotationPivot;
    init(graph: SpaceGraph): void;
    /**
     * Set up REPL commands for camera presets
     */
    private setupPresetCommands;
    /**
     * Watch for selection changes and auto-frame
     */
    private setupAutoFrameWatcher;
    update(): void;
    /**
     * Animates the camera state to a new target.
     * @param targetState - The target camera state.
     * @param options - Animation options.
     */
    flyTo(targetState: Partial<SpecUpdate['camera']>, options?: {
        duration: number;
        easing?: (t: number) => number | string;
        onUpdate?: (progress: number) => void;
        onComplete?: () => void;
    }): void;
    /**
     * Frames the given elements in the camera view.
     * @param elements - The elements to frame.
     * @param options - Animation options.
     */
    frame(elements: {
        position: THREE.Vector3;
    }[], options?: {
        duration: number;
        easing?: (t: number) => number;
    }): void;
    /**
     * Sets rotation constraints for the camera
     * @param constraints - The rotation constraints to apply
     */
    setRotationConstraints(constraints: RotationConstraints): void;
    /**
     * Sets the rotation pivot point for the camera
     * @param pivot - The pivot point as a Vector3
     */
    setRotationPivot(pivot: THREE.Vector3): void;
    /**
     * Automatically zooms to fit all nodes in the scene
     * @param options - Animation options
     */
    autoZoom(options?: {
        duration: number;
        padding?: number;
        easing?: (t: number) => number;
        includeEdges?: boolean;
    }): void;
    /**
     * Automatically frame all selected elements
     * @param options - Framing options
     */
    frameSelected(options?: {
        duration: number;
        padding?: number;
        easing?: (t: number) => number;
        strategy?: 'tight' | 'loose' | 'optimal';
    }): Promise<void>;
    /**
     * Get elements by their IDs
     * @param ids - Array of element IDs
     * @returns Array of elements with position vectors
     */
    private getElementsByIds;
    /**
     * Enhanced framing with configurable padding and aspect ratios
     * @param elements - The elements to frame
     * @param options - Framing options
     */
    enhancedFrame(elements: {
        position: THREE.Vector3;
    }[], options?: {
        duration: number;
        padding?: number;
        aspectRatio?: number;
        easing?: (t: number) => number | string;
        strategy?: 'tight' | 'loose' | 'optimal';
    }): void;
    /**
     * Gets the presets manager instance
     * @returns The CameraPresetsManager instance
     */
    getPresetsManager(): CameraPresetsManager;
    /**
     * Get all bookmarks
     * @returns Array of bookmark presets
     */
    getBookmarks(): CameraPreset[];
    /**
     * Create a bookmark from current camera state
     * @param name - Name of the bookmark
     * @param options - Bookmark options
     * @returns The created bookmark
     */
    createBookmark(name: string, options?: {
        description?: string;
        category?: string;
        tags?: string[];
        generateThumbnail?: boolean;
    }): Promise<CameraPreset>;
    /**
     * Quick access to standard camera views
     * @param view - The view to switch to
     * @param options - Animation options
     */
    setView(view: 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'isometric' | 'auto' | 'diagonal' | 'perspective', options?: {
        duration: number;
        easing?: (t: number) => number;
    }): void;
    dispose(): void;
    private initKeyboardControls;
    private onKeyDown;
    private onKeyUp;
    /**
     * Sets up a reactive effect to keep the Three.js camera in sync with the state.
     */
    private syncCameraToState;
}
