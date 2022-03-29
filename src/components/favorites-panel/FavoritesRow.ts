import d3 from '../../utils/d3-import';
import type {
  Padding,
  FavPinnedTree,
  TreeNode,
  Position
} from '../TimberTypes';
import type { Writable, Unsubscriber } from 'svelte/store';
import { tick } from 'svelte';
import type { FavoritesStoreValue, PinnedTreeStoreValue } from '../../stores';
import {
  getFavoritesStoreDefaultValue,
  getPinnedTreeStoreDefaultValue
} from '../../stores';

export class FavoritesRow {
  favTree: FavPinnedTree;
  textAreaNode: HTMLElement;

  favoritesStore: Writable<FavoritesStoreValue>;
  favoritesStoreValue: FavoritesStoreValue;
  favoritesStoreUnsubscriber: Unsubscriber;

  pinnedTreeStore: Writable<PinnedTreeStoreValue>;
  pinnedTreeStoreValue: PinnedTreeStoreValue;
  PinnedTreeStoreValueUnsubscriber: Unsubscriber;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  constructor({
    favTree,
    component,
    textAreaNode,
    favoritesStore,
    pinnedTreeStore
  }: {
    favTree: FavPinnedTree;
    component: HTMLElement;
    textAreaNode: HTMLElement;
    favoritesStore: Writable<FavoritesStoreValue>;
    pinnedTreeStore: Writable<PinnedTreeStoreValue>;
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

    this.pinnedTreeStore = pinnedTreeStore;
    this.pinnedTreeStoreValue = getPinnedTreeStoreDefaultValue();
    this.PinnedTreeStoreValueUnsubscriber = this.pinnedTreeStore.subscribe(
      value => {
        this.pinnedTreeStoreValue = value;
      }
    );

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
    const nodeR = 4;
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
      .attr('class', d => `link link-${d.source.data.f[0]}`)
      .attr('id', d => {
        const preSource =
          d.source.ancestors().length > 1
            ? d.source.ancestors()[1].data.f[0]
            : 'r';
        const source = d.source.data.f[0];
        const target = d.target.data.f[0];
        if (d.target.data.f[0] === '+') {
          return `link-${preSource}-${source}-p`;
        } else if (d.target.data.f[0] === '-') {
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
      .filter(d => !decisionSet.has(d.data.f[0]))
      .append('circle')
      .attr('r', nodeR)
      .style('fill', d => this.favTree.getFeatureColor(d.data.f[0]));

    // Draw decisions as a rectangle with a symbol
    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .append('rect')
      .attr('x', -rectR)
      .attr('y', -rectR)
      .attr('rx', 1)
      .attr('ry', 1)
      .attr('width', 2 * rectR)
      .attr('height', 2 * rectR);

    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .append('text')
      .attr('dy', 0.5)
      .text(d => d.data.f[0]);
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

  /**
   * Event handler for clicking the delete button
   * It removes this tree from the favorite list. If this tree is not pinned,
   * this function also removes it from the pinned tree array.
   * @param e Mouse event
   */
  deleteClicked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the current fav tree in the pinned tree window array
    let tid = -1;
    for (let i = 0; i < this.pinnedTreeStoreValue.pinnedTrees.length; i++) {
      const curPinnedTree = this.pinnedTreeStoreValue.pinnedTrees[i];
      if (curPinnedTree.treeID === this.favTree.pinnedTree.treeID) {
        tid = i;
        break;
      }
    }

    const curPinnedTree = this.pinnedTreeStoreValue.pinnedTrees[tid];

    // If it is pinned, just remove it from the fav list
    if (curPinnedTree.isPinned) {
      curPinnedTree.isFav = false;
    } else {
      // If it is not pinned, remove it from the array entirely
      this.pinnedTreeStoreValue.pinnedTrees.splice(tid, 1);
    }

    this.pinnedTreeStore.set(this.pinnedTreeStoreValue);

    // Remove this tree from the fav tree store
    const curFavTreeIDs = [
      ...this.favoritesStoreValue.favTrees.map(d => d.pinnedTree.treeID)
    ];
    const curIndex = curFavTreeIDs.indexOf(this.favTree.pinnedTree.treeID);
    if (curIndex > -1) {
      this.favoritesStoreValue.favTrees.splice(curIndex, 1);
    }
    this.favoritesStore.set(this.favoritesStoreValue);
  };

  /**
   * Event handler for clicking the tree thumbnail
   * It shows/highlights the clicked tree
   * @param e Mouse event
   */
  thumbnailClicked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the current fav tree in the pinned tree window array
    for (let i = 0; i < this.pinnedTreeStoreValue.pinnedTrees.length; i++) {
      const curPinnedTree = this.pinnedTreeStoreValue.pinnedTrees[i];
      if (curPinnedTree.treeID === this.favTree.pinnedTree.treeID) {
        // Highlight the window if it is already pinned
        if (curPinnedTree.isPinned) {
          curPinnedTree.jiggle();
        } else {
          // Update the start position so it moves from the fav panel
          const svgBBox = (
            this.svg.node() as HTMLElement
          ).getBoundingClientRect();

          const svgPosition: Position = {
            x: svgBBox.left,
            y: svgBBox.top,
            width: svgBBox.width,
            height: svgBBox.height
          };
          curPinnedTree.startPos = svgPosition;

          // Pin this window
          curPinnedTree.isPinned = true;
          this.pinnedTreeStore.set(this.pinnedTreeStoreValue);
        }

        break;
      }
    }
  };
}
