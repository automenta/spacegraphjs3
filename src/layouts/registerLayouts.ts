import { SpaceGraph } from '../core/SpaceGraph';
import { CircleLayout } from './CircleLayout';
import { ColumnLayout } from './ColumnLayout';
import { RowLayout } from './RowLayout';

/**
 * Register additional layout engines with SpaceGraph
 */
export function registerLayouts() {
  SpaceGraph.registerLayout('circle', CircleLayout);
  SpaceGraph.registerLayout('column', ColumnLayout);
  SpaceGraph.registerLayout('row', RowLayout);
}