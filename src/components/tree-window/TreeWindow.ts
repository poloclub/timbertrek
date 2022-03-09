import d3 from '../../utils/d3-import';
import type { TreeNode, TreeMap, Padding } from '../sunburst/SunburstTypes';

/**
 * Class for a tree window object.
 */
export class TreeWindow {
  tree: TreeNode;
  treeID: number;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  /**
   * Initialize a TreeWindow object
   * @param args Named parameters
   * @param args.component Sunburst component
   * @param args.tree Hierarchy data for a tree
   * @param args.treeID Tree id
   * @param args.width SVG width
   * @param args.height SVG height
   */
  constructor({
    component,
    tree,
    treeID,
    width = 200,
    height = 200
  }: {
    component: HTMLElement;
    tree: TreeNode;
    treeID: number;
    width?: number;
    height?: number;
  }) {
    this.tree = tree;
    this.treeID = treeID;
    console.log(tree);

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
  }
}
