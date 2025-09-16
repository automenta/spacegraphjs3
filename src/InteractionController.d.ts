import * as THREE from 'three';
import { Store } from 'solid-js/store';
import { Spec, GraphElement, SpecUpdate } from './types';
import { IRenderer } from './IRenderer';
export declare class InteractionController {
  private rendererEl;
  private state;
  private updateState;
  private threeCamera;
  private nodeRenderer;
  private emit;
  private getElement;
  private gesture;
  private raycaster;
  private pointer;
  private lastHoveredId;
  private draggedElementId;
  private dragPlane;
  constructor({
    rendererEl,
    state,
    updateState,
    threeCamera,
    nodeRenderer,
    emit,
    getElement,
  }: {
    rendererEl: HTMLElement;
    state: Store<Spec>;
    updateState: (spec: SpecUpdate) => void;
    threeCamera: THREE.PerspectiveCamera;
    nodeRenderer: IRenderer;
    emit: (eventName: string, ...args: any[]) => void;
    getElement: (id: string) => GraphElement | undefined;
  });
  private initInteraction;
  private _getHoveredElementId;
  dispose(): void;
}
