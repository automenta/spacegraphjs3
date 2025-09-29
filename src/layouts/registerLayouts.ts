import { SpaceGraph } from '../core/SpaceGraph';
import { CircleLayout } from './CircleLayout';
import { ColumnLayout } from './ColumnLayout';
import { D3ForceLayout } from './D3ForceLayout';
import { GridLayout } from './GridLayout';
import { RandomLayout } from './RandomLayout';
import { RowLayout } from './RowLayout';

/**
 * Register all layout engines with SpaceGraph
 */
export function registerLayouts() {
  SpaceGraph.registerLayout('circle', CircleLayout);
  SpaceGraph.registerLayout('column', ColumnLayout);
  SpaceGraph.registerLayout('force-directed', D3ForceLayout);
  SpaceGraph.registerLayout('grid', GridLayout);
  SpaceGraph.registerLayout('random', RandomLayout);
  SpaceGraph.registerLayout('row', RowLayout);
}