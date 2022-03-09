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
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    };

    this.width = width - this.padding.left - this.padding.right;
    this.height = height - this.padding.top - this.padding.bottom;

    // Initialize the tree layout
    this.#setTreeLayout();

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
   * Compute the lay out for the vertical tree
   */
  #setTreeLayout() {
    const treeData = d3.hierarchy(this.tree, d => d.c);

    console.log(treeData);
  }

  /**
   * Draw a vertical tree on the SVG.
   */
  #initView() {
    const content = this.svg.append('g').attr('class', 'content');

    content.append('circle').attr('cx', 100).attr('cy', 100).attr('r', 50);

    this.treeWindowStoreValue.show = true;
    this.treeWindowStoreValue.treeID = 332;
    this.treeWindowStore.set(this.treeWindowStoreValue);
  }
}
