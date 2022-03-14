import d3 from '../../utils/d3-import';
import type { Writable } from 'svelte/store';
import type { TreeNode, Point, Padding } from '../sunburst/SunburstTypes';
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

    this.curTreeID = 335;
    this.curAncestorFs = ['11', '_'];
    this.treeWindowStoreValue.treeID = this.curTreeID;
    this.treeWindowStoreValue.ancestorFs = this.curAncestorFs;
    this.treeWindowStoreValue.show = true;
    this.treeWindowStore.set(this.treeWindowStoreValue);
    this.#drawCurTree();
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

    const treeRoot = d3.tree().size([this.width, this.height])(
      root
    ) as d3.HierarchyPointNode<TreeNode>;

    // Draw the links
    const linkGroup = content.append('g').attr('class', 'link-group');
    linkGroup
      .selectAll('path.link')
      .data(treeRoot.links())
      .join('path')
      .attr('class', d => `link link-${d.source.data.f}`)
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
          [d.source.x, d.source.y],
          [d.target.x, d.target.y]
        ]);
      });

    // Draw the nodes
    const nodeGroup = content.append('g').attr('class', 'node-group');
    const nodes = nodeGroup
      .selectAll('g')
      .data(treeRoot.descendants())
      .join('g')
      .attr('class', 'node')
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

    // Add true/false label on the first split point
    const firstPathData = linkGroup
      .selectAll(`.link-${this.curAncestorFs[0]}`)
      .data() as d3.HierarchyPointLink<TreeNode>[];

    // Here we can assume the order is left to right from the tree layout
    // Parse the mid point of each path
    const xGap = 5;
    const yGap = -1;

    const midpoints: Point[] = [
      {
        x: (firstPathData[0].source.x + firstPathData[0].target.x) / 2 - xGap,
        y: (firstPathData[0].source.y + firstPathData[0].target.y) / 2 + yGap
      },
      {
        x: (firstPathData[1].source.x + firstPathData[1].target.x) / 2 + xGap,
        y: (firstPathData[1].source.y + firstPathData[1].target.y) / 2 + yGap
      }
    ];

    const labelGroup = content.append('g').attr('class', 'label-group');
    labelGroup
      .selectAll('text.split-label')
      .data(midpoints)
      .join('text')
      .attr('class', 'split-label')
      .classed('split-label-left', (d, i) => i === 0)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .text((d, i) => (i === 0 ? 'true' : 'false'));
  }

  /**
   * Get the style string for the current tree window
   * @returns TreeWindow style string
   */
  getStyle = () => {
    return `left: ${this.treeWindowStoreValue.x}px;
      top: ${this.treeWindowStoreValue.y}px;`;
  };

  /**
   * Determine if we should show or hide the click to pin label
   */
  shouldHidePinLabel = (): boolean => {
    if (localStorage.getItem('treeWindowPinnedOnce') === null) {
      localStorage.setItem('treeWindowPinnedOnce', 'false');
      return false;
    } else {
      return localStorage.getItem('treeWindowPinnedOnce') === 'true';
    }
  };
}
