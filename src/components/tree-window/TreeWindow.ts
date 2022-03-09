import d3 from '../../utils/d3-import';
import type { Writable } from 'svelte/store';
import type { TreeNode, TreeMap, Padding } from '../sunburst/SunburstTypes';
import type { TreeWindowStoreValue } from 'src/stores';

/**
 * Class for a tree window object.
 */
export class TreeWindow {
  tree: TreeNode;

  treeWindowStore: Writable<TreeWindowStoreValue>;
  treeWindowStoreValue: TreeWindowStoreValue;

  treeWindowUpdated: () => void;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  /**
   * Initialize a TreeWindow object
   * @param args Named parameters
   * @param args.component Sunburst component
   * @param args.tree Hierarchy data for a tree
   * @param args.width SVG width
   * @param args.height SVG height
   */
  constructor({
    component,
    tree,
    featureMap,
    treeWindowStore,
    treeWindowUpdated,
    width = 200,
    height = 200
  }: {
    component: HTMLElement;
    tree: TreeNode;
    featureMap: Map<number, string[]>;
    treeWindowStore: Writable<TreeWindowStoreValue>;
    treeWindowUpdated: () => void;
    width?: number;
    height?: number;
  }) {
    this.tree = tree;
    this.treeWindowUpdated = treeWindowUpdated;
    console.log(tree);

    // Initialize the store
    this.treeWindowStore = treeWindowStore;
    this.#initStore(featureMap);

    // Initialize the svg
    this.svg = d3
      .select(component)
      .select('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewbox', '0 0 200 200')
      .attr('preserveAspectRatio', 'none');

    // Configure the view size
    this.padding = {
      top: 20,
      bottom: 20,
      left: 10,
      right: 10
    };

    this.width = width - this.padding.left - this.padding.right;
    this.height = height - this.padding.top - this.padding.bottom;

    // Draw the tree
    this.#initView();
  }

  /**
   * Initialize the store.
   */
  #initStore(featureMap: Map<number, string[]>) {
    this.treeWindowStore.subscribe(value => {
      this.treeWindowStoreValue = value;
      this.treeWindowUpdated();
    });

    // Set up the initial store value
    this.treeWindowStoreValue.featureMap = featureMap;
    this.treeWindowStore.set(this.treeWindowStoreValue);
  }

  /**
   * Draw a vertical tree on the SVG.
   */
  #initView() {
    const content = this.svg.append('g').attr('class', 'content');

    const root = d3.hierarchy(this.tree, d => d.c);
    const nodeR = 5;
    const treeNodes = d3.tree().size([this.width, this.height])(root);

    // Find the most left/right/top/bottom points
    // const corners = {
    //   x0: Infinity,
    //   x1: -Infinity,
    //   y0: Infinity,
    //   y1: -Infinity
    // };

    // treeNodes.each(d => {
    //   if (d.x > corners.x1) corners.x1 = d.x;
    //   if (d.x < corners.x0) corners.x0 = d.x;
    //   if (d.y > corners.y1) corners.y1 = d.y;
    //   if (d.y < corners.y0) corners.y0 = d.y;
    // });

    // content.attr(
    //   'transform',
    //   `translate(${
    //     this.padding.left -
    //     corners.x0 +
    //     (this.width - (corners.x1 - corners.x0)) / 2
    //   }, ${this.padding.top})`
    // );

    content.attr(
      'transform',
      `translate(${this.padding.left}, ${this.padding.top})`
    );

    // Draw the links
    const linkGroup = content.append('g').attr('class', 'link-group');
    linkGroup
      .selectAll('path.link')
      .data(treeNodes.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d => {
        return d3.line()([
          // @ts-ignore
          [d.source.x, d.source.y],
          // @ts-ignore
          [d.target.x, d.target.y]
        ]);
      });

    // Draw the nodes
    const nodeGroup = content.append('g').attr('class', 'node-group');
    nodeGroup
      .selectAll('g')
      .data(treeNodes.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .append('circle')
      .attr('r', nodeR);

    this.treeWindowStoreValue.show = true;
    this.treeWindowStoreValue.treeID = 332;
    this.treeWindowStore.set(this.treeWindowStoreValue);
  }
}
