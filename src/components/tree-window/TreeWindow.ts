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
    const content = this.svg
      .append('g')
      .attr('class', 'content')
      .attr(
        'transform',
        `translate(${this.padding.left}, ${this.padding.top})`
      );

    const root = d3.hierarchy(this.tree, d => d.c);
    const nodeR = 7;
    const rectR = nodeR * 1;
    d3.tree().size([this.width, this.height])(root);

    // Draw the links
    const linkGroup = content.append('g').attr('class', 'link-group');
    linkGroup
      .selectAll('path.link')
      .data(root.links())
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
    const nodes = nodeGroup
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      // @ts-ignore
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Draw decision points as a circle
    const decisionSet = new Set(['-', '+']);
    nodes
      .filter(d => !decisionSet.has(d.data.f))
      .append('circle')
      .attr('r', nodeR)
      .style('fill', d => {
        return this.treeWindowStoreValue.getFeatureColor(d.data.f);
      });

    // Draw decisions as a rectangle with a symbol
    nodes
      .filter(d => decisionSet.has(d.data.f))
      .append('rect')
      .attr('x', -rectR)
      .attr('y', -rectR)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('width', 2 * rectR)
      .attr('height', 2 * rectR);

    nodes
      .filter(d => decisionSet.has(d.data.f))
      .append('text')
      .attr('dy', 0.5)
      .text(d => d.data.f);

    this.treeWindowStoreValue.show = true;
    this.treeWindowStoreValue.treeID = 332;
    this.treeWindowStore.set(this.treeWindowStoreValue);
  }
}
