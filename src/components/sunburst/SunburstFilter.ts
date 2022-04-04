/**
 * Implement Sunburst filtering
 */

import type { Sunburst } from './Sunburst';
import type { HierarchyNode, ArcData } from '../TimberTypes';
import d3 from '../../utils/d3-import';

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

/**
 * Sync the sunburst chart with the selected height range
 * @param this Sunburst
 */
export function syncHeightRange(this: Sunburst) {
  if (this.searchStoreValue.treeHeightMap === null) return;

  // Step 1: traverse the tree map to find which trees meet the criteria
  const selectedTreeIDs = new Set<number>();
  this.searchStoreValue.treeHeightMap.forEach((h, t) => {
    if (this.localHeightRange.has(h)) {
      selectedTreeIDs.add(t);
    }
  });

  // Step 2: Traverse the rule nodes to mark unused leaf
  this.dataRoot.eachBefore(d => {
    // Store the current (x0, x1) before any changes
    const dh = d as HierarchyNode;
    dh.previous = { x0: dh.x0, x1: dh.x1, y0: dh.y0, y1: dh.y1, data: dh.data };

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

  this.updateSunburstWithAnimation();
}

/**
 * Sync the sunburst chart with the selected depth features
 * @param this Sunburst
 */
export function syncDepthFeatures(this: Sunburst) {
  if (this.searchStoreValue.treeDepthFeaturesMap === null) return;

  // // Step 1: traverse the tree map to find which trees meet the criteria
  // const selectedTreeIDs = new Set<number>();
  // this.searchStoreValue.treeHeightMap.forEach((h, t) => {
  //   if (this.localHeightRange.has(h)) {
  //     selectedTreeIDs.add(t);
  //   }
  // });

  // // Step 2: Traverse the rule nodes to mark unused leaf
  // this.dataRoot.eachBefore(d => {
  //   // Store the current (x0, x1) before any changes
  //   const dh = d as HierarchyNode;
  //   dh.previous = { x0: dh.x0, x1: dh.x1, y0: dh.y0, y1: dh.y1, data: dh.data };

  //   if (d.data.t !== undefined) {
  //     if (selectedTreeIDs.has(d.data.t)) {
  //       d.data.u = true;
  //     } else {
  //       d.data.u = false;
  //     }
  //   }
  // });

  // // Step 3: Update the node sum at each level (only count used leaves)
  // this.dataRoot = this.dataRoot.sum(d => (d.u !== undefined && d.u ? 1 : 0));

  // // Update the partition data
  // const partition = d3.partition()(this.dataRoot) as HierarchyNode;

  // // Update the tree count to filter out unselected trees
  // partition.eachAfter(d => {
  //   if (d.data.u !== undefined && d.data.u) {
  //     d.uniqueTreeIDs = new Set([d.data.t!]);
  //   } else {
  //     const curIDs = new Set<number>();
  //     d.children?.forEach(c => {
  //       c.uniqueTreeIDs?.forEach(id => {
  //         curIDs.add(id);
  //       });
  //     });
  //     d.uniqueTreeIDs = curIDs;
  //   }
  // });

  // // Transfer the ID set to its length at each node
  // partition.each(d => {
  //   d.treeNum = d.uniqueTreeIDs?.size || 0;
  //   d.uniqueTreeIDs = null;
  // });

  // this.partition = partition;

  // this.updateSunburstWithAnimation();
}

export function updateSunburstWithAnimation(this: Sunburst) {
  const content = this.svg.select('.content-group');

  const trans = d3
    .transition()
    .duration(500)
    .ease(d3.easeLinear) as unknown as d3.Transition<
    d3.BaseType,
    unknown,
    d3.BaseType,
    unknown
  >;

  // Update the arcs, here we are sure there is no entry and exit
  this.removeText();

  // Need to handle the domain shift if the current head is not root
  this.arcDomainStack.forEach(d => {
    d.x0 = d.node.x0;
    d.x1 = d.node.x1;
  });
  this.xScale.domain([this.curHeadNode.x0, this.curHeadNode.x1]);

  const paths = content
    .select('.arc-group')
    .selectAll('g.arc')
    .data(
      this.partition.descendants().slice(1),
      d => (d as HierarchyNode).data.nid!
    )
    .select('path');

  paths
    .transition(trans)
    .tween('data', d => {
      // Interpolate from the old (x0, x1) to the new (x0, x1)
      const target: ArcData = {
        x0: d.x0,
        x1: d.x1,
        y0: d.y0,
        y1: d.y1,
        data: d.data
      };
      const i = d3.interpolate(d.previous!, target);
      return t => (d.previous = i(t));
    })
    .style('display', d => {
      if (d.data.f === ';') {
        return 'none';
      } else if (d.depth > this.sunburstStoreValue.depthHigh + 1) {
        return 'none';
      } else if (d.value !== undefined && d.value === 0) {
        return 'initial';
      } else {
        return 'initial';
      }
    })
    // @ts-ignore
    .attrTween('d', d => () => this.arc(d.previous!))
    .on('end', (d, i, g) => {
      const curPath = d3.select(g[i]);
      let newStyle = 'initial';
      if (d.data.f === ';') {
        newStyle = 'none';
      } else if (d.depth > this.sunburstStoreValue.depthHigh + 1) {
        newStyle = 'none';
      } else if (d.value !== undefined && d.value === 0) {
        newStyle = 'none';
      } else {
        newStyle = 'initial';
      }
      curPath.style('display', newStyle);
    });

  // Update the text after a delay
  if (textUpdateTimer !== null) {
    window.clearTimeout(textUpdateTimer);
    textUpdateTimer = null;
  }
  textUpdateTimer = window.setTimeout(() => {
    this.drawCenterText();
    this.drawText();
  }, 700);

  this.sunburstUpdated();
}

export function updateSunburst(this: Sunburst) {
  const content = this.svg.select('.content-group');

  const trans = d3
    .transition()
    .duration(500)
    .ease(d3.easeLinear) as unknown as d3.Transition<
    d3.BaseType,
    unknown,
    d3.BaseType,
    unknown
  >;

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
    .transition(trans)
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
