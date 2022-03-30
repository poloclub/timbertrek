/**
 * Implement Sunburst filtering
 */

import type { Sunburst } from './Sunburst';
import { TextArcMode } from '../TimberTypes';
import type { HierarchyNode } from '../TimberTypes';
import d3 from '../../utils/d3-import';
import { getLatoTextWidth } from '../../utils/text-width';
import { getContrastRatio } from '../../utils/utils';

let textUpdateTimer: number | null = null;

/**
 * Sync the sunburst chart with the selected accuracy range
 * @param this Sunburst
 */
export function syncAccuracyRange(this: Sunburst) {
  // Step 1: traverse the tree map to find which trees meet the criteria
  const selectedTreeIDs = new Set<number>();
  this.treeMapMap.forEach((v, k) => {
    if (v[2] >= this.localAccuracyLow && v[2] <= this.localAccuracyHigh) {
      selectedTreeIDs.add(k);
    }
  });

  // Step 2: Traverse the rule nodes to mark unused leaf
  this.dataRoot.eachBefore(d => {
    if (d.data.t !== undefined) {
      if (selectedTreeIDs.has(d.data.t)) {
        d.data.u = true;
      } else {
        d.data.u = false;
      }
    }
  });

  // Step 3: Update the node sum at each level (only count used leaves)
  this.dataRoot = this.dataRoot.sum(d => (d.u !== undefined && d.u ? 1 : 0));

  // Update the partition data
  const partition = d3.partition()(this.dataRoot) as HierarchyNode;

  // Update the tree count to filter out unselected trees
  partition.eachAfter(d => {
    if (d.data.u !== undefined && d.data.u) {
      d.uniqueTreeIDs = new Set([d.data.t!]);
    } else {
      const curIDs = new Set<number>();
      d.children?.forEach(c => {
        c.uniqueTreeIDs?.forEach(id => {
          curIDs.add(id);
        });
      });
      d.uniqueTreeIDs = curIDs;
    }
  });

  // Transfer the ID set to its length at each node
  partition.each(d => {
    d.treeNum = d.uniqueTreeIDs?.size || 0;
    d.uniqueTreeIDs = null;
  });

  this.partition = partition;
  this.updateSunburst();
}

export function updateSunburst(this: Sunburst) {
  const content = this.svg.select('.content-group');

  // Update the arcs, here we are sure there is no entry and exit
  this.removeText();

  // Need to handle the domain shift if the current head is not root
  this.arcDomainStack.forEach(d => {
    d.x0 = d.node.x0;
    d.x1 = d.node.x1;
  });
  this.xScale.domain([this.curHeadNode.x0, this.curHeadNode.x1]);

  content
    .select('.arc-group')
    .selectAll('g.arc')
    .data(
      this.partition.descendants().slice(1),
      d => (d as HierarchyNode).data.nid!
    )
    .select('path')
    // @ts-ignore
    .attr('d', d => this.arc(d))
    .style('display', d => {
      if (d.data.f === ';') {
        return 'none';
      } else if (d.depth > this.sunburstStoreValue.depthHigh + 1) {
        return 'none';
      } else if (d.value !== undefined && d.value === 0) {
        return 'none';
      } else {
        return 'initial';
      }
    });

  // Update the text after a delay
  if (textUpdateTimer !== null) {
    window.clearTimeout(textUpdateTimer);
    textUpdateTimer = null;
  }
  textUpdateTimer = window.setTimeout(() => {
    this.drawCenterText();
    this.drawText();
  }, 500);

  this.sunburstUpdated();
}
