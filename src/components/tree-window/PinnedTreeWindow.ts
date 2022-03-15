import { TreeWindow } from './TreeWindow';
import d3 from '../../utils/d3-import';
import { round } from '../../utils/utils';
import type { Writable } from 'svelte/store';
import type { TreeNode, Point, Padding, PinnedTree } from '../ForagerTypes';
import type { TreeWindowStoreValue } from '../../stores';
import { getTreeWindowStoreDefaultValue } from '../../stores';

export class PinnedTreeWindow {
  pinnedTree: PinnedTree;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  constructor({
    component,
    pinnedTree,
    width = 150,
    height = 150
  }: {
    component: HTMLElement;
    pinnedTree: PinnedTree;
    width?: number;
    height?: number;
  }) {
    this.pinnedTree = pinnedTree;
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
}
