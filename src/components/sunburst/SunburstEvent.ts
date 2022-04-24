/**
 * Implement Sunburst event handlers
 */

import { config } from '../../config';
import type { Sunburst } from './Sunburst';
import type { Point } from '../TimberTypes';
import type {
  HierarchyNode,
  ArcDomain,
  ArcDomainData,
  PinnedTree,
  Position
} from '../TimberTypes';
import { round } from '../../utils/utils';
import d3 from '../../utils/d3-import';

interface OuterCenter {
  x: number;
  y: number;
  quad: number;
}

let mouseenterTimeoutID: number | null = null;
let mouseleaveTimeoutID: number | null = null;
let lastLeafMouseenterTime = new Date().getTime();

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
  this.sunburstUpdated();
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
    const curPath = this.svg.select(`path#arc-${node.data.nid}`);
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
    this.svg.select(`path#arc-${node.data.nid}`).classed('highlighted', false);
  });
}

/**
 * Handler for mouseenter event on leaf arcs
 * @param this Sunburst
 * @param e Event
 * @param d Node data
 */
export function leafArcMouseenterHandler(
  this: Sunburst,
  e: MouseEvent,
  d: HierarchyNode
) {
  e.preventDefault();
  e.stopPropagation();

  // Highlight the ancestors
  this.arcMouseenterHandler(e, d);

  if (mouseleaveTimeoutID !== null) {
    window.clearTimeout(mouseleaveTimeoutID);
    mouseleaveTimeoutID = null;
  }

  const showTreeWindow = () => {
    if (d.data.t === undefined) return;
    const treeID = d.data.t;
    this.treeWindowStoreValue.treeID = +treeID;

    // Trace the ancestors for this leaf
    const ancestorFs = d
      .ancestors()
      .filter(d => d.depth !== 0)
      .map(d => d.data.f)
      .reverse();
    this.treeWindowStoreValue.ancestorFs = ancestorFs;

    // Figure out the coordinate to put the tree window
    const curTPPoint = this.getTreeWindowPos(d);
    this.treeWindowStoreValue.x = curTPPoint.x;
    this.treeWindowStoreValue.y = curTPPoint.y;
    this.treeWindowStoreValue.show = true;

    this.treeWindowStore.set(this.treeWindowStoreValue);

    // Also highlight other leaf nodes linking to the same tree
    if (this.curHeadNode.value && this.curHeadNode.value < 300) {
      const arcGroup = this.svg.select('.arc-group');
      arcGroup
        .selectAll(`path.arc.leaf-${treeID}`)
        .filter(o => (o as HierarchyNode).data.nid !== d.data.nid)
        .classed('same-leaf-highlight', true);
    }

    mouseenterTimeoutID = null;
  };

  /**
   * Decide the delay
   * If users have hovered over in the past 500ms, no delay
   * Else: delay x ms
   */
  if (
    this.treeWindowStoreValue.show ||
    new Date().getTime() - lastLeafMouseenterTime < 500
  ) {
    showTreeWindow();
  } else {
    mouseenterTimeoutID = window.setTimeout(
      showTreeWindow,
      config.time.mouseenterDelay
    );
  }
}

/**
 * Handler for mouseleave event on leaf arcs
 * @param this Sunburst
 * @param e Event
 * @param d Node data
 */
export function leafArcMouseleaveHandler(
  this: Sunburst,
  e: MouseEvent,
  d: HierarchyNode
) {
  if (d.data.t === undefined) return;

  e.preventDefault();
  e.stopPropagation();

  // Dehighlight the ancestors
  this.arcMouseleaveHandler(e, d);

  // De-highlight leaves with the same tree
  if (this.curHeadNode.value && this.curHeadNode.value < 300) {
    const arcGroup = this.svg.select('.arc-group');
    arcGroup
      .selectAll(`path.arc.leaf-${d.data.t}`)
      .classed('same-leaf-highlight', false);
  }

  if (mouseenterTimeoutID !== null) {
    window.clearTimeout(mouseenterTimeoutID);
    mouseenterTimeoutID = null;
  }

  mouseleaveTimeoutID = window.setTimeout(() => {
    this.treeWindowStoreValue.show = false;
    this.treeWindowStore.set(this.treeWindowStoreValue);
    lastLeafMouseenterTime = new Date().getTime();
  }, 100);
}

export function getTreeWindowPos(this: Sunburst, d: HierarchyNode): Point {
  let outerCenterAngle =
    (this.xScale(d.x0) + this.xScale(d.x1)) / 2 - Math.PI / 2;

  const outerCenterR = this.yScale(d.y1) + 8;

  // Get the outer center point on the sector
  const outerCenter: OuterCenter = {
    x: Math.cos(outerCenterAngle) * outerCenterR,
    y: Math.sin(outerCenterAngle) * outerCenterR,
    /**
     * Clockwise from 12 o'clock : 1 => 2 => 3 => 4
     */
    quad: Math.floor(outerCenterAngle / (Math.PI / 2)) + 2
  };

  // Special case: if the node is a full ring, we put the hover window on the
  // second quad
  if (d.x0 === this.xScale.domain()[0] && d.x1 === this.xScale.domain()[1]) {
    outerCenter.x = Math.cos(-Math.PI / 4) * outerCenterR;
    outerCenter.y = Math.sin(-Math.PI / 4) * outerCenterR;
    outerCenter.quad = 1;
  }

  const getTLPoint = (outerCenter: OuterCenter): Point => {
    const curPoint = { x: 0, y: 0 };

    switch (outerCenter.quad) {
      case 1: {
        curPoint.x = outerCenter.x;
        curPoint.y = outerCenter.y - config.layout.treeWindowHeight;
        break;
      }
      case 2: {
        curPoint.x = outerCenter.x;
        curPoint.y = outerCenter.y;
        break;
      }
      case 3: {
        curPoint.x = outerCenter.x - config.layout.treeWindowWidth;
        curPoint.y = outerCenter.y;
        break;
      }
      case 4: {
        curPoint.x = outerCenter.x - config.layout.treeWindowWidth;
        curPoint.y = outerCenter.y - config.layout.treeWindowHeight;
        break;
      }
      default: {
        console.warn('Unknown quad!');
      }
    }

    return curPoint;
  };

  let containerHeight = window.innerHeight;
  if (d3.select('.timbertrek-page').size() > 0) {
    containerHeight = (
      d3.select('.timbertrek-page').node() as HTMLElement
    ).getBoundingClientRect().height;
  }

  const borderPadding = 5;
  const ringBBox = (this.svg.node() as HTMLElement).getBoundingClientRect();
  const ringCenter = {
    x: ringBBox.x + ringBBox.width / 2,
    y: ringBBox.y + ringBBox.height / 2
  };

  // Get the initial position
  let curTLPoint = getTLPoint(outerCenter);

  // Change curTLPoint if it is overflow on y (top)
  if (curTLPoint.y + ringCenter.y < borderPadding) {
    const extremeHeight =
      ringCenter.y - config.layout.treeWindowHeight - borderPadding;
    const extremeY = -extremeHeight;
    outerCenterAngle = Math.asin(extremeY / outerCenterR);

    if (outerCenter.quad === 4) {
      outerCenterAngle = Math.PI - outerCenterAngle;
    }

    outerCenter.x = Math.cos(outerCenterAngle) * outerCenterR;
    outerCenter.y = Math.sin(outerCenterAngle) * outerCenterR;
    outerCenter.quad = Math.floor(outerCenterAngle / (Math.PI / 2)) + 2;
    curTLPoint = getTLPoint(outerCenter);
  }

  // Change curTLPoint if it is overflow on y (bottom)
  if (
    curTLPoint.y + ringCenter.y + config.layout.treeWindowHeight >
    containerHeight - borderPadding
  ) {
    const extremeY =
      containerHeight -
      borderPadding -
      ringCenter.y -
      config.layout.treeWindowHeight;

    outerCenterAngle = Math.asin(extremeY / outerCenterR);
    if (outerCenter.quad === 3) {
      outerCenterAngle = Math.PI - outerCenterAngle;
    }

    outerCenter.x = Math.cos(outerCenterAngle) * outerCenterR;
    outerCenter.y = Math.sin(outerCenterAngle) * outerCenterR;
    outerCenter.quad = Math.floor(outerCenterAngle / (Math.PI / 2)) + 2;
    curTLPoint = getTLPoint(outerCenter);
  }

  // Translate from the local coordinate to world coordinate
  curTLPoint.x = ringCenter.x + curTLPoint.x;
  curTLPoint.y = ringCenter.y + curTLPoint.y;

  return curTLPoint;
}

/**
 * Handler for clicking even on the leaf arc
 * @param e Mouse event
 * @param d HierarchyNode data
 */
export function leafArcClickHandler(
  this: Sunburst,
  e: MouseEvent,
  d: HierarchyNode
) {
  e.preventDefault();
  e.stopPropagation();

  // If this is the first time that the user pins a tree, update localStorage
  if (localStorage.getItem('treeWindowPinnedOnce') !== 'true') {
    localStorage.setItem('treeWindowPinnedOnce', 'true');
  }

  // Pass the selected tree information to PinnedTreeStore
  if (d.data.t === undefined) return;
  const treeID = d.data.t;
  const treeTuple = this.treeWindowStoreValue.treeMap.get(treeID);

  if (treeTuple === undefined) return;

  // Get the current small window position for FLIP animation
  const startPoint = this.getTreeWindowPos(d);
  const startPos: Position = {
    x: startPoint.x,
    y: startPoint.y,
    width: config.layout.treeWindowWidth,
    height: config.layout.treeWindowHeight
  };

  // Find where to put this new window
  // Simple heuristic => put it next to the last active window
  const endPoint = { x: 20, y: 20 };
  if (this.pinnedTreeStoreValue.lastActiveTreeID !== null) {
    const lastActiveTree = this.pinnedTreeStoreValue.pinnedTrees.filter(
      d => d.treeID === this.pinnedTreeStoreValue.lastActiveTreeID
    )[0];
    endPoint.x = lastActiveTree.x + 20;
    endPoint.y = lastActiveTree.y + 30;
  }

  // Check if this tree is stored in the pinnedTreeStore. Note that favorite
  // trees are also stored in the array but their isPinned is false
  if (
    !this.pinnedTreeStoreValue.pinnedTrees.map(d => d.treeID).includes(treeID)
  ) {
    const pinnedTree: PinnedTree = {
      tree: treeTuple[0],
      treeMetric: round(treeTuple[2], 4),
      treeID: treeID,
      x: endPoint.x,
      y: endPoint.y,
      startPos,
      isFav: false,
      isPinned: true,
      note: '',
      jiggle: () => {}
    };

    this.pinnedTreeStoreValue.pinnedTrees.push(pinnedTree);
    this.pinnedTreeStore.set(this.pinnedTreeStoreValue);
  } else {
    /**
     * This tree is in the pinnedTreeStore
     * Need to check if it is pinned:
     * (1) true => jiggle to highlight the window
     * (2) false => pin it at the right location
     */
    let pinnedTreeIndex = -1;
    for (let i = 0; i < this.pinnedTreeStoreValue.pinnedTrees.length; i++) {
      if (this.pinnedTreeStoreValue.pinnedTrees[i].treeID === treeID) {
        pinnedTreeIndex = i;
        break;
      }
    }
    if (pinnedTreeIndex === -1) {
      console.warn('Could not find the clicked tree in the pinnedTrees array!');
      return;
    }

    const pinnedTree = this.pinnedTreeStoreValue.pinnedTrees[pinnedTreeIndex];

    if (pinnedTree.isPinned) {
      // This tree is already pinned, jiggle to highlight the window
      pinnedTree.jiggle();
    } else {
      // This tree is not pinned (it is in the array because it is liked)
      pinnedTree.isPinned = true;
      pinnedTree.startPos = startPos;
      pinnedTree.x = endPoint.x;
      pinnedTree.y = endPoint.y;
    }

    this.pinnedTreeStore.set(this.pinnedTreeStoreValue);
  }
}

// TODO: Remove this function
export function tempShowPinnedTree(this: Sunburst) {
  const treeID = 412;
  const treeTuple = this.treeWindowStoreValue.treeMap.get(treeID);

  if (treeTuple !== undefined) {
    const endPoint = { x: 70, y: 150 };
    if (this.pinnedTreeStoreValue.lastActiveTreeID !== null) {
      const lastActiveTree = this.pinnedTreeStoreValue.pinnedTrees.filter(
        d => d.treeID === this.pinnedTreeStoreValue.lastActiveTreeID
      )[0];
      endPoint.x = lastActiveTree.x + 20;
      endPoint.y = lastActiveTree.y + 30;
    }

    const pinnedTree: PinnedTree = {
      tree: treeTuple[0],
      treeMetric: round(treeTuple[2], 4),
      treeID: treeID,
      x: endPoint.x,
      y: endPoint.y,
      startPos: { x: 0, y: 0, width: 0, height: 0 },
      isFav: false,
      isPinned: true,
      note: '',
      jiggle: () => {}
    };

    this.pinnedTreeStoreValue.pinnedTrees.push(pinnedTree);
    this.pinnedTreeStore.set(this.pinnedTreeStoreValue);
  }
}
