import d3 from '../../utils/d3-import';
import type { Writable } from 'svelte/store';
import type { TreeNode, TreeMap, Padding } from '../sunburst/SunburstTypes';
import type { TreeWindowStoreValue } from '../../stores';
import { getTreeWindowStoreDefaultValue } from '../../stores';

/**
 * Class for a tree window object.
 */
export class TreeWindow {
  treeMap: Map<number, [TreeNode, number]>;
  curTreeID: number;
  curAncestorFs: string[];

  treeWindowStore: Writable<TreeWindowStoreValue>;
  treeWindowStoreValue: TreeWindowStoreValue;

  treeWindowUpdated: () => void;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  get tree(): TreeNode | null {
    const mapValue = this.treeMap.get(this.curTreeID);
    if (mapValue !== undefined) {
      return mapValue[0];
    } else {
      console.warn(`No such tree on the record ${this.curTreeID}`);
      return null;
    }
  }

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
    treeMapMap,
    featureMap,
    treeWindowStore,
    treeWindowUpdated,
    width = 150,
    height = 150
  }: {
    component: HTMLElement;
    treeMapMap: Map<number, [TreeNode, number]>;
    featureMap: Map<number, string[]>;
    treeWindowStore: Writable<TreeWindowStoreValue>;
    treeWindowUpdated: () => void;
    width?: number;
    height?: number;
  }) {
    this.treeMap = treeMapMap;
    this.curTreeID = 0;
    this.curAncestorFs = [];
    this.treeWindowUpdated = treeWindowUpdated;

    // Initialize the store
    this.treeWindowStore = treeWindowStore;
    this.treeWindowStoreValue = getTreeWindowStoreDefaultValue();
    this.#initStore(featureMap);

    // Initialize the svg
    this.svg = d3
      .select(component)
      .select('svg')
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
   * Initialize the store.
   */
  #initStore(featureMap: Map<number, string[]>) {
    this.treeWindowStore.subscribe(value => {
      this.treeWindowStoreValue = value;

      // Show the tree window with the selected tree
      if (this.svg !== undefined) {
        // We redraw if (1) new tree id, or (2) same tree, new decision path
        if (
          this.treeWindowStoreValue.treeID !== this.curTreeID ||
          this.treeWindowStoreValue.ancestorFs.length !==
            this.curAncestorFs.length ||
          !this.treeWindowStoreValue.ancestorFs.every(
            (d, i) => d === this.curAncestorFs[i]
          )
        ) {
          const newTreeTuple = this.treeMap.get(
            this.treeWindowStoreValue.treeID
          );

          if (newTreeTuple) {
            this.curTreeID = this.treeWindowStoreValue.treeID;
            this.curAncestorFs = [...this.treeWindowStoreValue.ancestorFs];
            this.#redraw();
          }
        }
      }

      this.treeWindowUpdated();
    });

    // Set up the initial store value
    this.treeWindowStoreValue.featureMap = featureMap;
    this.treeWindowStore.set(this.treeWindowStoreValue);
  }

  #redraw() {
    this.svg.selectAll('g.content').remove();
    this.#drawCurTree();
  }

  /**
   * Draw the tree with this.curTreeID
   */
  #drawCurTree() {
    if (this.tree === null) {
      console.warn('Trying to draw a tree that does not exist');
      return;
    }

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
      .attr('id', d => {
        if (d.target.data.f === '+') {
          return `link-${d.source.data.f}-p`;
        } else if (d.target.data.f === '-') {
          return `link-${d.source.data.f}-n`;
        } else {
          return `link-${d.source.data.f}-${d.target.data.f}`;
        }
      })
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
        if (this.treeWindowStoreValue.getFeatureColor) {
          return this.treeWindowStoreValue.getFeatureColor(d.data.f);
        } else {
          return 'var(--md-gray-500)';
        }
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

    // Highlight the current decision path
    for (let i = 0; i < this.curAncestorFs.length - 1; i++) {
      if (this.curAncestorFs[i + 1] === '_') {
        linkGroup
          .select(`#link-${this.curAncestorFs[i]}-p`)
          .classed('highlighted', true);
        linkGroup
          .select(`#link-${this.curAncestorFs[i]}-n`)
          .classed('highlighted', true);
      } else {
        linkGroup
          .select(`#link-${this.curAncestorFs[i]}-${this.curAncestorFs[i + 1]}`)
          .classed('highlighted', true);
      }
    }
  }

  /**
   * Get the style string for the current tree window
   * @returns TreeWindow style string
   */
  getStyle = () => {
    return `left: ${this.treeWindowStoreValue.x}px;
      top: ${this.treeWindowStoreValue.y}px;`;
  };
}
