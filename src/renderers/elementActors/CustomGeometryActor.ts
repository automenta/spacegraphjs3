import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { NodeSpec, Spec, CustomGeometryNodeSpec } from '../../types';
import { BaseGeometryActor } from './BaseGeometryActor';

// Import loaders for different geometry formats
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

/**
 * An ElementActor for rendering nodes with custom geometries loaded from external files.
 * Supports multiple formats: glTF/GLB, OBJ, FBX, PLY, STL
 */
export class CustomGeometryActor extends BaseGeometryActor {
  private static gltfLoader: GLTFLoader = new GLTFLoader();
  private static objLoader: OBJLoader = new OBJLoader();
  private static fbxLoader: FBXLoader = new FBXLoader();
  private static plyLoader: PLYLoader = new PLYLoader();
  private static stlLoader: STLLoader = new STLLoader();
  
  private loadedGeometry: THREE.BufferGeometry | null = null;
  private loadingPromise: Promise<THREE.BufferGeometry> | null = null;

  constructor(
    scene: THREE.Scene,
    elementState: Store<NodeSpec>,
    graphState: Store<Spec>
  ) {
    super(scene, elementState, graphState);
  }

  /**
   * Create geometry by loading from external file
   * @returns BufferGeometry loaded from external file
   */
  protected createGeometry(): THREE.BufferGeometry {
    // Create a default geometry (icosahedron) while loading
    return new THREE.IcosahedronGeometry(0.5, 0);
  }

  /**
   * Create glow geometry by loading from external file
   * @returns BufferGeometry loaded from external file
   */
  protected createGlowGeometry(): THREE.BufferGeometry {
    // For glow, we clone the main geometry
    return this.createGeometry().clone();
  }

  /**
   * Initialize the actor and start loading the geometry
   */
  public async init(): Promise<void> {
    super.init();
    await this.loadGeometry();
  }

  /**
   * Load geometry from external file based on format
   * @returns Promise resolving to loaded geometry
   */
  private async loadGeometry(): Promise<THREE.BufferGeometry> {
    const customSpec = this.elementState as CustomGeometryNodeSpec;
    
    // Validate required properties
    if (!customSpec.url) {
      console.error('CustomGeometryActor: Missing URL for geometry loading');
      return new THREE.IcosahedronGeometry(0.5, 0);
    }

    // Return existing promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Create new loading promise
    this.loadingPromise = this.loadGeometryFromFile(customSpec.url, customSpec.format || 'gltf')
      .then(geometry => {
        this.loadedGeometry = geometry;
        // Update the mesh with the loaded geometry
        if (this.mainMesh) {
          this.updateMainGeometry(geometry);
          // Update material if specified
          this.updateMaterial(customSpec.material);
        }
        if (this.glowMesh) {
          // Dispose of the old glow geometry
          const oldGlowGeometry = this.glowMesh.geometry;
          if (oldGlowGeometry) {
            if (oldGlowGeometry.disposeBoundsTree) {
              oldGlowGeometry.disposeBoundsTree();
            }
            oldGlowGeometry.dispose();
          }
          // Set the new glow geometry
          this.glowMesh.geometry = geometry.clone();
          if (this.glowMesh.geometry.computeBoundsTree) {
            this.glowMesh.geometry.computeBoundsTree();
          }
        }
        return geometry;
      })
      .catch(error => {
        console.error('CustomGeometryActor: Failed to load geometry:', error);
        // Fallback to default geometry
        const fallbackGeometry = new THREE.IcosahedronGeometry(0.5, 0);
        this.loadedGeometry = fallbackGeometry;
        return fallbackGeometry;
      });

    return this.loadingPromise;
  }

  /**
   * Update the material of the main mesh based on material parameters
   * @param materialParams - Material parameters to apply
   */
  private updateMaterial(materialParams?: THREE.MaterialParameters): void {
    if (!this.mainMesh || !materialParams) return;

    // Create a new material based on the parameters
    // For simplicity, we'll use MeshBasicMaterial which is what the base class uses
    const newMaterial = new THREE.MeshBasicMaterial(materialParams);

    // Dispose of the old material
    const oldMaterial = this.mainMesh.material;
    if (oldMaterial && oldMaterial !== newMaterial) {
      if (Array.isArray(oldMaterial)) {
        oldMaterial.forEach(mat => mat.dispose());
      } else {
        oldMaterial.dispose();
      }
    }

    // Apply the new material
    this.mainMesh.material = newMaterial;
  }

  /**
   * Load geometry from file based on format
   * @param url - URL to load geometry from
   * @param format - Format of the geometry file
   * @returns Promise resolving to loaded geometry
   */
  private loadGeometryFromFile(url: string, format: string): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      try {
        switch (format.toLowerCase()) {
          case 'gltf':
          case 'glb':
            CustomGeometryActor.gltfLoader.load(
              url,
              (gltf) => {
                // Extract geometry from GLTF scene
                const geometry = this.extractGeometryFromObject(gltf.scene);
                if (geometry) {
                  resolve(geometry);
                } else {
                  reject(new Error('No geometry found in GLTF file'));
                }
              },
              undefined,
              (error) => reject(error)
            );
            break;

          case 'obj':
            CustomGeometryActor.objLoader.load(
              url,
              (object) => {
                // Extract geometry from OBJ object
                const geometry = this.extractGeometryFromObject(object);
                if (geometry) {
                  resolve(geometry);
                } else {
                  reject(new Error('No geometry found in OBJ file'));
                }
              },
              undefined,
              (error) => reject(error)
            );
            break;

          case 'fbx':
            CustomGeometryActor.fbxLoader.load(
              url,
              (object) => {
                // Extract geometry from FBX object
                const geometry = this.extractGeometryFromObject(object);
                if (geometry) {
                  resolve(geometry);
                } else {
                  reject(new Error('No geometry found in FBX file'));
                }
              },
              undefined,
              (error) => reject(error)
            );
            break;

          case 'ply':
            CustomGeometryActor.plyLoader.load(
              url,
              (geometry) => {
                resolve(geometry);
              },
              undefined,
              (error) => reject(error)
            );
            break;

          case 'stl':
            CustomGeometryActor.stlLoader.load(
              url,
              (geometry) => {
                resolve(geometry);
              },
              undefined,
              (error) => reject(error)
            );
            break;

          default:
            reject(new Error(`Unsupported geometry format: ${format}`));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract geometry from a Three.js object
   * @param object - Three.js object to extract geometry from
   * @returns BufferGeometry or null if none found
   */
  private extractGeometryFromObject(object: THREE.Object3D): THREE.BufferGeometry | null {
    let geometry: THREE.BufferGeometry | null = null;
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // Clone the geometry to avoid sharing between objects
        geometry = child.geometry.clone();
        // Apply any transformations to the geometry
        if (child.matrixWorld && geometry) {
          geometry.applyMatrix4(child.matrixWorld);
        }
        // We found a geometry, stop traversing
        return;
      }
    });
    
    return geometry;
  }

  /**
   * Dispose of loaded geometry and clean up resources
   */
  public dispose(): void {
    if (this.loadedGeometry) {
      this.loadedGeometry.dispose();
      this.loadedGeometry = null;
    }
    
    // Clear loading promise
    this.loadingPromise = null;
    
    super.dispose();
  }
}