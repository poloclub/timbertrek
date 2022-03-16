import { TreeWindow } from './TreeWindow';
import { tick } from 'svelte';
import d3 from '../../utils/d3-import';
import { round } from '../../utils/utils';
import type { Writable } from 'svelte/store';
import type {
  TreeNode,
  Point,
  Padding,
  PinnedTree,
  Position
} from '../ForagerTypes';
import type { PinnedTreeStoreValue } from '../../stores';
import { getPinnedTreeStoreDefaultValue } from '../../stores';

export class PinnedTreeWindow {
  pinnedTree: PinnedTree;
  pinnedTreeWindowUpdated: () => void;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  pinnedTreeStore: Writable<PinnedTreeStoreValue>;
  pinnedTreeStoreValue: PinnedTreeStoreValue;

  // FLIP animation
  hidden = true;
  endPos: Position;
  node: HTMLElement;

  constructor({
    component,
    pinnedTree,
    pinnedTreeStore,
    pinnedTreeWindowUpdated,
    width = 200,
    height = 200
  }: {
    component: HTMLElement;
    pinnedTree: PinnedTree;
    pinnedTreeStore: Writable<PinnedTreeStoreValue>;
    pinnedTreeWindowUpdated: () => void;
    width?: number;
    height?: number;
  }) {
    this.pinnedTree = pinnedTree;
    this.pinnedTreeWindowUpdated = pinnedTreeWindowUpdated;
    this.width = width;
    this.height = height;
    this.node = component;

    this.pinnedTreeStore = pinnedTreeStore;
    this.pinnedTreeStoreValue = getPinnedTreeStoreDefaultValue();
    this.pinnedTreeStore.subscribe(value => {
      this.pinnedTreeStoreValue = value;
    });

    this.#bringWindowToTop();

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

    // Draw the tree
    this.#drawCurTree();

    // FLIP animation to show the window
    // Step 1: Register the end position (we know start position)
    const bbox = d3.select(component).node()!.getBoundingClientRect();
    this.endPos = {
      x: this.pinnedTree.x,
      y: this.pinnedTree.y,
      width: bbox.width,
      height: bbox.height
    };

    // Step 2: Show the element and play the animation
    this.hidden = false;
    this.pinnedTreeWindowUpdated();
    this.playLaunchingAnimation();
  }

  /**
   * Helper function to bring this pinned tree window to top
   */
  #bringWindowToTop() {
    const wrapperNode = this.node.parentNode;
    wrapperNode?.parentNode?.appendChild(wrapperNode);
  }

  /**
   * Animate the launching process of the pinned tree window
   */
  playLaunchingAnimation = () => {
    // Compute the transformation from end to the start
    const widthScale = this.pinnedTree.startPos.width / this.endPos.width;
    const heightScale = this.pinnedTree.startPos.height / this.endPos.height;
    const xTranslate = this.pinnedTree.startPos.x - this.endPos.x;
    const yTranslate = this.pinnedTree.startPos.y - this.endPos.y;

    // Apply the transform
    this.node.animate(
      [
        {
          transformOrigin: 'top left',
          opacity: 0,
          transform: `
            translate(${xTranslate}px, ${yTranslate}px)
            scale(${widthScale}, ${heightScale})
          `
        },
        {
          transformOrigin: 'top left',
          opacity: 1,
          transform: 'none'
        }
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'both'
      }
    );
  };

  /**
   * Draw the tree with this.curTreeID
   */
  #drawCurTree() {
    const content = this.svg
      .append('g')
      .attr('class', 'content')
      .attr(
        'transform',
        `translate(${this.padding.left}, ${this.padding.top})`
      );

    const root = d3.hierarchy(this.pinnedTree.tree, d => d.c);
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
        if (this.pinnedTreeStoreValue.getFeatureColor) {
          return this.pinnedTreeStoreValue.getFeatureColor(d.data.f);
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

    // Add true/false label on the first split point
    const firstPathData = linkGroup
      .selectAll(`.link-${this.pinnedTree.tree.f}`)
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
   * Get the current style string
   */
  getStyle = () => {
    return `
      left: ${this.pinnedTree.x}px;\
      top: ${this.pinnedTree.y}px;`;
  };

  /**
   * Handler for heart icon clicking event
   * @param e Mouse event
   */
  heartClicked = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    this.pinnedTree.isFav = !this.pinnedTree.isFav;
    this.pinnedTreeWindowUpdated();

    if (this.pinnedTree.isFav) {
      // Trigger animation of the heart icon on the pinned window
      await tick();

      // Trigger animation on the tool bar if the user likes this tree
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
          }, 1500);
        });

      const iconHeart = d3
        .select(this.node)
        .select('.icon-heart')
        .classed('play-animation', true)
        .on('animationend', () => {
          iconHeart.classed('play-animation', false);
        });
    }
  };

  /**
   * Handler for note icon clicking event
   * @param e Mouse event
   */
  noteClicked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const window = d3.select(this.node).select('.note-window');

    window.classed('show', !window.classed('show'));
  };

  /**
   * Handler for close icon clicking event
   * @param e Mouse event
   */
  closeClicked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove the pinned tree window from the store array
    for (
      let i = this.pinnedTreeStoreValue.pinnedTrees.length - 1;
      i >= 0;
      i--
    ) {
      if (
        this.pinnedTreeStoreValue.pinnedTrees[i].treeID ===
        this.pinnedTree.treeID
      ) {
        this.pinnedTreeStoreValue.pinnedTrees.splice(i, 1);
        break;
      }
    }

    this.pinnedTreeStore.set(this.pinnedTreeStoreValue);
  };

  /**
   * Cancel the event
   * @param e Mouse event
   */
  cancelEvent = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handler for mousedown event on the window header
   * @param e Mouse event
   */
  headerMousedownHandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Raise the clicked window
    this.#bringWindowToTop();

    // Register the offset from the initial click position to the div location
    const lastMousePoint: Point = {
      x: e.pageX,
      y: e.pageY
    };

    // Handling dragging mouse move
    const mousemoveHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newX = this.node.offsetLeft + e.pageX - lastMousePoint.x;
      const newY = this.node.offsetTop + e.pageY - lastMousePoint.y;

      lastMousePoint.x = e.pageX;
      lastMousePoint.y = e.pageY;

      this.node.style.left = `${newX}px`;
      this.node.style.top = `${newY}px`;
    };

    // Cancel the dragging when mouse is up
    const mouseupHandler = () => {
      document.removeEventListener('mousemove', mousemoveHandler, true);
      document.removeEventListener('mouseup', mouseupHandler, true);
      document.body.style.cursor = 'default';

      // Record the last left and top to the object
      this.pinnedTree.x = parseFloat(this.node.style.left);
      this.pinnedTree.y = parseFloat(this.node.style.top);
    };

    // Bind the mouse event listener to the document so we can track the
    // movement if outside the header region
    document.addEventListener('mousemove', mousemoveHandler, true);
    document.addEventListener('mouseup', mouseupHandler, true);
    document.body.style.cursor = 'move';
  };

  /**
   * Handler for mousedown event on the content element
   * @param e Mouse event
   */
  contentMousedownHandler = (e: MouseEvent) => {
    this.#bringWindowToTop();
  };
}
