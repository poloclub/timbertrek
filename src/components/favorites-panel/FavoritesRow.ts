import d3 from '../../utils/d3-import';
import type { Padding, FavPinnedTree, TreeNode } from '../ForagerTypes';
import type { Writable, Unsubscriber } from 'svelte/store';
import { tick } from 'svelte';
import type { FavoritesStoreValue } from '../../stores';
import { getFavoritesStoreDefaultValue } from '../../stores';

export class FavoritesRow {
  favTree: FavPinnedTree;
  textAreaNode: HTMLElement;
  favoritesStore: Writable<FavoritesStoreValue>;
  favoritesStoreValue: FavoritesStoreValue;
  favoritesStoreUnsubscriber: Unsubscriber;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  constructor({
    favTree,
    component,
    textAreaNode,
    favoritesStore
  }: {
    favTree: FavPinnedTree;
    component: HTMLElement;
    textAreaNode: HTMLElement;
    favoritesStore: Writable<FavoritesStoreValue>;
  }) {
    this.favTree = favTree;
    this.textAreaNode = textAreaNode;

    // Init the store
    this.favoritesStore = favoritesStore;
    this.favoritesStoreValue = getFavoritesStoreDefaultValue();
    this.favoritesStoreUnsubscriber = this.favoritesStore.subscribe(value => {
      this.favoritesStoreValue = value;
      if (this.favoritesStoreValue.shown) {
        this.adjustTextAreaHeight();
      }
    });

    // Initialize the svg
    const width = 70;
    const height = 70;

    this.svg = d3
      .select(component)
      .select('svg.tree-svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewbox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none');

    // Configure the view size
    this.padding = {
      top: 10,
      bottom: 10,
      left: 0,
      right: 0
    };

    this.width = width - this.padding.left - this.padding.right;
    this.height = height - this.padding.top - this.padding.bottom;

    // Init the view
    this.#initView();
  }

  /**
   * Draw the thumbnail tree
   */
  #initView() {
    const content = this.svg
      .append('g')
      .attr('class', 'content')
      .attr(
        'transform',
        `translate(${this.padding.left}, ${this.padding.top})`
      );

    const root = d3.hierarchy(this.favTree.pinnedTree.tree, d => d.c);
    const nodeR = 5;
    const rectR = 4;

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
        const preSource =
          d.source.ancestors().length > 1
            ? d.source.ancestors()[1].data.f
            : 'r';
        const source = d.source.data.f;
        const target = d.target.data.f;
        if (d.target.data.f === '+') {
          return `link-${preSource}-${source}-p`;
        } else if (d.target.data.f === '-') {
          return `link-${preSource}-${source}-n`;
        } else {
          return `link-${preSource}-${source}-${target}`;
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
      .style('fill', d => this.favTree.getFeatureColor(d.data.f));

    // Draw decisions as a rectangle with a symbol
    nodes
      .filter(d => decisionSet.has(d.data.f))
      .append('rect')
      .attr('x', -rectR)
      .attr('y', -rectR)
      .attr('rx', 1)
      .attr('ry', 1)
      .attr('width', 2 * rectR)
      .attr('height', 2 * rectR);

    nodes
      .filter(d => decisionSet.has(d.data.f))
      .append('text')
      .attr('dy', 0.5)
      .text(d => d.data.f);
  }

  /**
   * Adjust the height when content grows
   */
  adjustTextAreaHeight = async () => {
    await tick();
    this.textAreaNode.style.removeProperty('height');
    this.textAreaNode.style.height = `${this.textAreaNode.scrollHeight}px`;
  };

  /**
   * Triggers update in the pinned tree window view
   * @param e Event
   */
  noteChanged = (e: Event) => {
    e.stopPropagation();
    this.favTree.pinnedTreeUpdated();

    // Adjust the height when content grows
    this.adjustTextAreaHeight();
  };
}
