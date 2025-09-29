import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
/**
 * A plugin that handles user interactions with the graph, such as clicking, dragging, and hovering.
 */
export declare class InteractionPlugin implements ISpaceGraphPlugin {
    private graph;
    private gesture;
    private dragPlane;
    private draggedElementId;
    private hoveredEdgeId;
    private selectedEdgeIds;
    private boundOnClick;
    private rendererEl;
    init(graph: SpaceGraph): void;
    dispose(): void;
    private getIntersectedElement;
    private onDrag;
    private onWheel;
    private onHover;
    private onClick;
    private handleEdgeClick;
    private selectEdge;
    private toggleEdgeSelection;
    private deselectEdge;
    private clearAllEdgeSelections;
}
