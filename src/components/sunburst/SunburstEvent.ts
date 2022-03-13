/**
 * Implement Sunburst event handlers
 */

import type { Sunburst } from './Sunburst';
import { TextArcMode } from './SunburstTypes';
import type { HierarchyNode, ArcDomain, ArcDomainData } from './SunburstTypes';
import d3 from '../../utils/d3-import';

/**
 * Event handler for arc clicking.
 * @param e Event
 * @param d Datum of the hierarchy node. If it is null, return to the last
 *   state
 */
export function arcClicked(
  this: Sunburst,
  e: MouseEvent,
  d: HierarchyNode | null
) {
  e.stopPropagation();
  e.preventDefault();

  // No interaction if users clicks a leaf node
  if (d !== null && d.data.f === '_') {
    return;
  }

  let targetDomain: ArcDomain = { x0: 0, x1: 1, y0: 0, y1: 1 };
  let newHead = d;

  // Detect if the user clicks the center
  const curXDomain = this.xScale.domain();
  const curYDomain = this.yScale.domain();

  // We keep the current depth gap for the transition
  const curDepthGap =
    this.sunburstStoreValue.depthHigh - this.sunburstStoreValue.depthLow;

  if (d === null || (d.x0 == curXDomain[0] && d.x1 == curXDomain[1])) {
    // Case 1: Transition to the last domain in the domain stack
    const lastDomainData = this.arcDomainStack.pop();

    if (lastDomainData !== undefined) {
      newHead = lastDomainData.node;
      targetDomain = lastDomainData;

      // Update the low and high pointer
      this.sunburstStoreValue.depthLow =
        newHead.depth === 0 ? 1 : newHead.depth;
      this.sunburstStoreValue.depthHigh = Math.min(
        this.sunburstStoreValue.depthLow + lastDomainData.depthGap,
        this.sunburstStoreValue.depthMax
      );
    } else {
      console.error('No more arc domain from the stack to pop!');
    }
  } else {
    // Case 2: Transition to the clicked arc
    const yGap = 1 / (this.sunburstStoreValue.depthMax + 1);

    // Update the low and high pointers
    this.sunburstStoreValue.depthLow = d.depth;
    this.sunburstStoreValue.depthHigh = Math.min(
      d.depth + curDepthGap,
      this.sunburstStoreValue.depthMax
    );

    targetDomain = {
      x0: d.x0,
      x1: d.x1,
      y0: d.y0,
      y1:
        d.y0 +
        yGap *
          (this.sunburstStoreValue.depthHigh -
            this.sunburstStoreValue.depthLow +
            1)
    };

    // Save the current domain in the stack
    const curDomainData: ArcDomainData = {
      x0: curXDomain[0],
      x1: curXDomain[1],
      y0: curYDomain[0],
      y1: curYDomain[1],
      node: this.curHeadNode,
      depthGap: curDepthGap
    };
    this.arcDomainStack.push(curDomainData);
  }

  // Update the depth box color based on the clicked arc
  const depthColors = new Array<string>(this.sunburstStoreValue.depthMax).fill(
    ''
  );

  const ancestors = newHead!.ancestors();
  ancestors.forEach(a => {
    if (a.depth > 0) {
      const curColor = this.getFeatureColor(a.data.f);
      depthColors[a.depth - 1] = curColor;
    }
  });

  // Update the store
  this.sunburstStoreValue.depthColors = depthColors;
  this.sunburstStore.set(this.sunburstStoreValue);

  // Update the new head
  this.curHeadNode = newHead!;
  this.arcZoom(targetDomain);
}

/**
 * Handler for mouseenter event
 * @param this Sunburst
 * @param e Event
 * @param d Node data
 */
export function arcMouseenterHandler(
  this: Sunburst,
  e: MouseEvent,
  d: HierarchyNode
) {
  if (e.currentTarget === null) return;

  // Highlight all this node's ancestors
  const ancestors = d.ancestors().filter(d => d.depth > 0);
  ancestors.forEach(node => {
    const curPath = this.svg.select(`path#arc-${node.nid}`);
    d3.select((curPath.node() as HTMLElement).parentElement).raise();
    curPath.classed('highlighted', true);
  });
}

/**
 * Handler for mouseleave event
 * @param this Sunburst
 * @param e Event
 * @param d Node data
 */
export function arcMouseleaveHandler(
  this: Sunburst,
  e: MouseEvent,
  d: HierarchyNode
) {
  if (e.currentTarget === null) return;

  // Dehighlight all this node's ancestors
  const ancestors = d.ancestors().filter(d => d.depth > 0);
  ancestors.forEach(node => {
    this.svg.select(`path#arc-${node.nid}`).classed('highlighted', false);
  });
}
