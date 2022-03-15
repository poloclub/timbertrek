import { TreeWindow } from './TreeWindow';
import d3 from '../../utils/d3-import';
import { round } from '../../utils/utils';
import type { Writable } from 'svelte/store';
import type { TreeNode, Point, Padding, PinnedTree } from '../ForagerTypes';
import type { TreeWindowStoreValue } from '../../stores';
import { getTreeWindowStoreDefaultValue } from '../../stores';

export class PinnedTreeWindow {
  pinnedTree: PinnedTree;
  pinnedTreeWindowUpdated: () => void;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  constructor({
    component,
    pinnedTree,
    pinnedTreeWindowUpdated,
    width = 200,
    height = 200
  }: {
    component: HTMLElement;
    pinnedTree: PinnedTree;
    pinnedTreeWindowUpdated: () => void;
    width?: number;
    height?: number;
  }) {
    this.pinnedTree = pinnedTree;
    this.pinnedTreeWindowUpdated = pinnedTreeWindowUpdated;
    this.width = width;
    this.height = height;

    // Initialize the svg
    this.svg = d3
      .select(component)
      .select('svg.tree-svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewbox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none');

    console.log(this.svg);

    // Configure the view size
    this.padding = {
      top: 20,
      bottom: 20,
      left: 0,
      right: 0
    };

    this.width = width - this.padding.left - this.padding.right;
    this.height = height - this.padding.top - this.padding.bottom;
  }

  /**
   * Get the current style string
   */
  getStyle = () => {
    return `
      left: ${this.pinnedTree.x}px;\
      top: ${this.pinnedTree.y}px;\
      z-index: ${this.pinnedTree.z};
    `;
  };

  heartClicked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    this.pinnedTree.isFav = !this.pinnedTree.isFav;

    // Trigger animation on the tool bar if the user likes this tree
    if (this.pinnedTree.isFav) {
      const hiddenHeart = d3.select('.hidden-heart');
      hiddenHeart
        .transition()
        .duration(400)
        .ease(d3.easeCubicInOut)
        .style('transform', 'scale(1)')
        .style('opacity', 1)
        .on('end', () => {
          hiddenHeart.classed('pulse', true);
          setTimeout(() => {
            hiddenHeart
              .classed('pulse', false)
              .transition()
              .duration(400)
              .style('transform', 'scale(0)')
              .style('opacity', 0);
          }, 1400);
        });
    }

    this.pinnedTreeWindowUpdated();
  };
}
