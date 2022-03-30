/**
 * Implement Sunburst filtering
 */

import type { Sunburst } from './Sunburst';
import { TextArcMode } from '../TimberTypes';
import type { HierarchyNode } from '../TimberTypes';
import d3 from '../../utils/d3-import';
import { getLatoTextWidth } from '../../utils/text-width';
import { getContrastRatio } from '../../utils/utils';

/**
 * Sync the sunburst chart with the selected accuracy range
 * @param this Sunburst
 */
export function syncAccuracyRange(this: Sunburst) {
  console.log('Syncing accuracy');
}
