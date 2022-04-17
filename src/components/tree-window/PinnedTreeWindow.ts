import { tick } from 'svelte';
import d3 from '../../utils/d3-import';
import { getLatoTextWidth } from '../../utils/text-width';
import { config } from '../../config';
import type { Writable, Unsubscriber } from 'svelte/store';
import type {
  TreeNode,
  Point,
  Padding,
  PinnedTree,
  Position,
  SankeyHierarchyPointNode,
  LabelPosition
} from '../TimberTypes';
import type { PinnedTreeStoreValue, FavoritesStoreValue } from '../../stores';
import {
  getPinnedTreeStoreDefaultValue,
  getFavoritesStoreDefaultValue
} from '../../stores';

export class PinnedTreeWindow {
  pinnedTree: PinnedTree;
  pinnedTreeWindowUpdated: () => void;

  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  padding: Padding;
  width: number;
  height: number;

  pinnedTreeStore: Writable<PinnedTreeStoreValue>;
  pinnedTreeStoreValue: PinnedTreeStoreValue;
  pinnedTreeStoreUnsubscriber: Unsubscriber;

  favoritesStore: Writable<FavoritesStoreValue>;
  favoritesStoreValue: FavoritesStoreValue;
  favoritesStoreUnsubscriber: Unsubscriber;

  sankey = false;

  // FLIP animation
  hidden = true;
  endPos: Position;
  node: HTMLElement;

  constructor({
    component,
    pinnedTree,
    pinnedTreeStore,
    favoritesStore,
    pinnedTreeWindowUpdated,
    width = 200,
    height = 200
  }: {
    component: HTMLElement;
    pinnedTree: PinnedTree;
    pinnedTreeStore: Writable<PinnedTreeStoreValue>;
    favoritesStore: Writable<FavoritesStoreValue>;
    pinnedTreeWindowUpdated: () => void;
    width?: number;
    height?: number;
  }) {
    this.pinnedTree = pinnedTree;
    this.pinnedTreeWindowUpdated = pinnedTreeWindowUpdated;
    this.width = width;
    this.height = height;
    this.node = component;

    /**
     * When the user tries to pin a tree that is already pinned, jiggle to
     * highlight this window.
     */
    this.pinnedTree.jiggle = () => {
      this.#bringWindowToTop();
      this.node.classList.add('jiggle');
      this.node.onanimationend = () => {
        this.node.classList.remove('jiggle');
      };
    };

    // Init the stores
    this.pinnedTreeStore = pinnedTreeStore;
    this.pinnedTreeStoreValue = getPinnedTreeStoreDefaultValue();
    this.pinnedTreeStoreUnsubscriber = this.pinnedTreeStore.subscribe(value => {
      this.pinnedTreeStoreValue = value;
    });

    this.favoritesStore = favoritesStore;
    this.favoritesStoreValue = getFavoritesStoreDefaultValue();
    this.favoritesStoreUnsubscriber = this.favoritesStore.subscribe(value => {
      this.favoritesStoreValue = value;
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
    // this.#drawCurSankeyTree();

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

    // Also mark this window as the current active window
    this.pinnedTreeStoreValue.lastActiveTreeID = this.pinnedTree.treeID;
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
        fill: 'none'
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
      .attr('class', d => `link link-${d.source.data.f[0]}`)
      .attr('id', d => {
        if (d.target.data.f[0] === '+') {
          return `link-${d.source.data.f[0]}-p`;
        } else if (d.target.data.f[0] === '-') {
          return `link-${d.source.data.f[0]}-n`;
        } else {
          return `link-${d.source.data.f[0]}-${d.target.data.f[0]}`;
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
      .append('rect')
      .attr('class', 'node-rect')
      .attr('x', -rectR)
      .attr('y', -rectR)
      .attr('rx', nodeR)
      .attr('ry', nodeR)
      .attr('width', 2 * rectR)
      .attr('height', 2 * rectR)
      .style('fill', d => {
        if (this.pinnedTreeStoreValue.getFeatureColor) {
          return this.pinnedTreeStoreValue.getFeatureColor(d.data.f[0]);
        } else {
          return config.colors['gray-500'];
        }
      });

    nodes
      .filter(d => !decisionSet.has(d.data.f[0]))
      .append('title')
      .text(d => {
        if (this.pinnedTreeStoreValue.getFeatureInfo) {
          return this.pinnedTreeStoreValue.getFeatureInfo(d.data.f[0])
            .nameValue;
        } else {
          return '';
        }
      });

    // Draw decisions as a rectangle with a symbol
    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .append('rect')
      .attr('class', 'leaf-rect')
      .attr('x', -rectR)
      .attr('y', -rectR)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('width', 2 * rectR)
      .attr('height', 2 * rectR);

    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .append('text')
      .attr('dy', 0.5)
      .text(d => d.data.f[0]);

    // Add true/false label on the first split point
    const firstPathData = linkGroup
      .selectAll(`.link-${this.pinnedTree.tree.f[0]}`)
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

    const edgeLabelGroup = content
      .append('g')
      .attr('class', 'edge-label-group');
    edgeLabelGroup
      .selectAll('text.split-label')
      .data(midpoints)
      .join('text')
      .attr('class', 'split-label')
      .classed('split-label-left', (d, i) => i === 0)
      .attr('x', d => d.x)
      .attr('y', d => d.y + 3)
      .text((d, i) => (i === 0 ? 'true' : 'false'));

    // Add node text
    // Compute the label positions
    const labelPositions = this.#computeLabelLayout(treeRoot, nodeR);

    const nodeLabelGroup = content
      .append('g')
      .attr('class', 'node-label-group');

    const nodeLabels = nodeLabelGroup
      .selectAll('g.node-label')
      .data(labelPositions)
      .join('g')
      .attr('class', 'node-label')
      .classed('node-label-left', d => d.onLeft)
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    const nodeLabelTexts = nodeLabels
      .append('text')
      .text(d => d.text)
      .style('fill', d => {
        if (this.pinnedTreeStoreValue.getFeatureColor) {
          return this.pinnedTreeStoreValue.getFeatureColor(d.featureName);
        } else {
          return config.colors['gray-500'];
        }
      });

    nodeLabels.append('title').text(d => d.textLong);

    // Truncate text to fit width
    nodeLabelTexts.each((d, i, g) => {
      const element = g[i];
      const label = d3.select(element);
      let text = d.text;
      let curWidth = element.getBoundingClientRect().width;

      while (curWidth > d.width) {
        text = text.replace('...', '');
        text = text.slice(0, text.length - 1);
        text = `${text}...`;
        curWidth = getLatoTextWidth(text, 16 * 0.8);
      }

      label.text(text);
    });
  }

  /**
   * Use a greedy method to compute the label layout
   * @param treeRoot Tree root node
   * @param nodeR Radius of each node
   * @returns Array of label positions
   */
  #computeLabelLayout(
    treeRoot: d3.HierarchyPointNode<TreeNode>,
    nodeR: number
  ) {
    // Step 1: BFS and determine the label position and space
    const labelPositions: LabelPosition[] = [];

    // Update left and right pointers for a greedy search of space
    const internalHPadding = 12;
    let leftX = internalHPadding;
    let rightX = this.width - internalHPadding;
    const labelGap = 5;

    const treeNodes = treeRoot.descendants();

    for (const [i, node] of treeNodes.entries()) {
      console.log(i, node);
      let hasRightSibling = false;

      const labelText =
        this.pinnedTreeStoreValue.getFeatureInfo === null
          ? ''
          : this.pinnedTreeStoreValue.getFeatureInfo(node.data.f[0]).shortValue;

      const labelTextLong =
        this.pinnedTreeStoreValue.getFeatureInfo === null
          ? ''
          : this.pinnedTreeStoreValue.getFeatureInfo(node.data.f[0]).nameValue;

      // Update the initial pointer based on next sibling
      if (i + 1 < treeNodes.length && node.depth === treeNodes[i + 1].depth) {
        hasRightSibling = true;
        rightX = treeNodes[i + 1].x - nodeR - labelGap;
      }

      // Compute the left and right available space
      const leftWidth = node.x - nodeR - leftX - labelGap;
      const rightWidth = hasRightSibling
        ? (rightX - node.x - nodeR) / 2 - labelGap
        : rightX - node.x - nodeR - labelGap;

      // Choose the larger available space (greedy search)
      let curPosition: LabelPosition;
      if (leftWidth > rightWidth) {
        curPosition = {
          x: node.x - nodeR - labelGap,
          y: node.y,
          onLeft: true,
          featureName: node.data.f[0],
          width: leftWidth,
          text: labelText,
          textLong: labelTextLong
        };

        leftX = node.x + nodeR;
        rightX = this.width - internalHPadding;
      } else {
        // Put label on the right
        curPosition = {
          x: node.x + nodeR + labelGap,
          y: node.y,
          onLeft: false,
          featureName: node.data.f[0],
          width: rightWidth,
          text: labelText,
          textLong: labelTextLong
        };

        leftX = node.x + nodeR + labelGap + rightWidth;
        rightX = this.width - internalHPadding;
      }

      // Only add label for non-leaf nodes
      if (node.data.f[0] !== '+' && node.data.f[0] !== '-') {
        labelPositions.push(curPosition);
      }

      // Reset the leftX and rightX if the next node is in a new depth
      if (i + 1 < treeNodes.length && node.depth !== treeNodes[i + 1].depth) {
        leftX = internalHPadding;
        rightX = this.width - internalHPadding;
      }
    }

    return labelPositions;
  }

  /**
   * Draw the tree with this.curTreeID in the sankey tree style
   */
  #drawCurSankeyTree() {
    const content = this.svg
      .append('g')
      .attr('class', 'content')
      .attr(
        'transform',
        `translate(${this.padding.left}, ${this.padding.top})`
      );

    // Step 1: Set up the tree layout
    const root = d3.hierarchy(this.pinnedTree.tree, d => d.c);
    const nodeR = 7;
    const rectR = nodeR * 1;

    const treeRoot = d3.tree().size([this.width, this.height])(
      root
    ) as d3.HierarchyPointNode<TreeNode>;

    const linkGroup = content.append('g').attr('class', 'link-group');

    // Step 2: Draw the nodes
    const nodeGroup = content.append('g').attr('class', 'node-group');

    // Configure the width scale for nodes
    const localPadding = {
      top: this.padding.top,
      bottom: this.padding.bottom,
      left: 20,
      right: 20
    };

    const totalSampleNum = treeRoot.data.f[1];
    const nodeWidthScale = d3
      .scaleLinear()
      .domain([0, totalSampleNum])
      .range([
        0,
        this.width +
          this.padding.left +
          this.padding.right -
          localPadding.left -
          localPadding.right
      ]);

    // Calculate the x and width for each node
    const sankeyNodes: SankeyHierarchyPointNode[] = [];

    let nextStartX = 0;
    let curDepth = -1;

    // This is a BFS
    treeRoot.descendants().forEach(d => {
      const curNode = Object.assign(d) as SankeyHierarchyPointNode;

      if (curNode.depth !== curDepth) {
        nextStartX =
          curNode.parent === null ? localPadding.left : curNode.parent.x;
        curDepth = curNode.depth;
      }

      curNode.x = nextStartX;
      curNode.width = nodeWidthScale(curNode.data.f[1]);
      nextStartX += curNode.width;

      sankeyNodes.push(curNode);
    });

    const nodes = nodeGroup
      .selectAll('g')
      .data(sankeyNodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Draw decision points as a circle
    const decisionSet = new Set(['-', '+']);
    nodes
      .filter(d => !decisionSet.has(d.data.f[0]))
      .append('rect')
      .attr('class', 'node-rect sankey')
      .attr('x', 0)
      .attr('y', -rectR)
      .attr('width', d => d.width)
      .attr('height', 2 * rectR)
      .attr('rx', d => (d.width < 16 ? 1 : 2))
      .attr('ry', d => (d.width < 16 ? 1 : 2))
      .style('fill', d => {
        if (this.pinnedTreeStoreValue.getFeatureColor) {
          return this.pinnedTreeStoreValue.getFeatureColor(d.data.f[0]);
        } else {
          return config.colors['gray-500'];
        }
      });

    // Draw decisions as a rectangle with a symbol
    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .append('rect')
      .attr('class', 'leaf-rect')
      .attr('x', 0)
      .attr('y', -rectR)
      .attr('rx', d => (d.width < 16 ? 1 : 2))
      .attr('ry', d => (d.width < 16 ? 1 : 2))
      .attr('width', d => d.width)
      .attr('height', 2 * rectR);

    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .append('text')
      .attr('x', d => d.width / 2)
      .attr('dy', 0.5)
      .text(d => d.data.f[0])
      .style('opacity', d => (d.width < 16 ? 0 : 1));

    // Step 3: Draw the links
    linkGroup
      .selectAll('path.link')
      .data(treeRoot.links())
      .join('path')
      .attr('class', d => `link link-${d.source.data.f[0]}`)
      .attr('id', d => {
        if (d.target.data.f[0] === '+') {
          return `link-${d.source.data.f[0]}-p`;
        } else if (d.target.data.f[0] === '-') {
          return `link-${d.source.data.f[0]}-n`;
        } else {
          return `link-${d.source.data.f[0]}-${d.target.data.f[0]}`;
        }
      })
      .attr('d', d => {
        const source = d.source as SankeyHierarchyPointNode;
        const target = d.target as SankeyHierarchyPointNode;

        return d3.line()([
          [source.x + source.width / 2, source.y],
          [target.x + target.width / 2, target.y - rectR]
        ]);
      });
  }

  /**
   * Update the tree with this.curTreeID
   */
  #changeSankeyToStandard() {
    const content = this.svg.select('g.content');

    const root = d3.hierarchy(this.pinnedTree.tree, d => d.c);
    const nodeR = 7;
    const rectR = nodeR * 1;

    const treeRoot = d3.tree().size([this.width, this.height])(
      root
    ) as d3.HierarchyPointNode<TreeNode>;

    const trans = d3
      .transition()
      .duration(400)
      .ease(d3.easeCubicInOut) as unknown as d3.Transition<
      d3.BaseType,
      unknown,
      d3.BaseType,
      unknown
    >;

    // Update the links
    const linkGroup = content.select('.link-group');
    linkGroup
      .selectAll('path.link')
      .data(treeRoot.links())
      .join('path')
      .transition(trans)
      .attr('d', d => {
        return d3.line()([
          [d.source.x, d.source.y],
          [d.target.x, d.target.y]
        ]);
      });

    // Update the nodes
    const nodeGroup = content.select('.node-group');
    const nodes = nodeGroup
      .selectAll('g.node')
      .data(treeRoot.descendants())
      .join('g');

    nodes.transition(trans).attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Update decision points as a circle
    const decisionSet = new Set(['-', '+']);
    nodes
      .filter(d => !decisionSet.has(d.data.f[0]))
      .select('rect.node-rect')
      .classed('sankey', false)
      .transition(trans)
      .attr('x', -rectR)
      .attr('y', -rectR)
      .attr('rx', nodeR)
      .attr('ry', nodeR)
      .attr('width', 2 * rectR)
      .attr('height', 2 * rectR);

    // Update decisions as a rectangle with a symbol
    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .select('rect.leaf-rect')
      .attr('class', 'leaf-rect')
      .transition(trans)
      .attr('x', -rectR)
      .attr('y', -rectR)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('width', 2 * rectR)
      .attr('height', 2 * rectR);

    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .select('text')
      .transition(trans)
      .attr('x', 0)
      .attr('dy', 0.5)
      .style('opacity', 1);

    // Add true/false label on the first split point
    content
      .select('.label-group')
      .style('display', 'unset')
      .style('opacity', 0)
      .transition(trans)
      .style('opacity', 1);
  }

  /**
   * Update the tree with this.curTreeID in the sankey tree style
   */
  #changeStandardToSankey() {
    const content = this.svg.select('.content');

    // Step 1: Set up the tree layout
    const root = d3.hierarchy(this.pinnedTree.tree, d => d.c);
    const nodeR = 7;
    const rectR = nodeR * 1;

    const treeRoot = d3.tree().size([this.width, this.height])(
      root
    ) as d3.HierarchyPointNode<TreeNode>;

    const linkGroup = content.select('.link-group');

    // Step 2: Update the nodes
    const nodeGroup = content.select('.node-group');

    // Configure the width scale for nodes
    const localPadding = {
      top: this.padding.top,
      bottom: this.padding.bottom,
      left: 20,
      right: 20
    };

    const totalSampleNum = treeRoot.data.f[1];
    const nodeWidthScale = d3
      .scaleLinear()
      .domain([0, totalSampleNum])
      .range([
        0,
        this.width +
          this.padding.left +
          this.padding.right -
          localPadding.left -
          localPadding.right
      ]);

    // Calculate the x and width for each node
    const sankeyNodes: SankeyHierarchyPointNode[] = [];

    let nextStartX = 0;
    let curDepth = -1;

    // This is a BFS
    treeRoot.descendants().forEach(d => {
      const curNode = Object.assign(d) as SankeyHierarchyPointNode;

      if (curNode.depth !== curDepth) {
        nextStartX =
          curNode.parent === null ? localPadding.left : curNode.parent.x;
        curDepth = curNode.depth;
      }

      curNode.x = nextStartX;
      curNode.width = nodeWidthScale(curNode.data.f[1]);
      nextStartX += curNode.width;

      sankeyNodes.push(curNode);
    });

    const trans = d3
      .transition()
      .duration(400)
      .ease(d3.easeCubicInOut) as unknown as d3.Transition<
      d3.BaseType,
      unknown,
      d3.BaseType,
      unknown
    >;

    const nodes = nodeGroup.selectAll('g.node').data(sankeyNodes).join('g');
    nodes.transition(trans).attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Update decision points as a circle
    const decisionSet = new Set(['-', '+']);
    nodes
      .filter(d => !decisionSet.has(d.data.f[0]))
      .select('rect.node-rect')
      .classed('sankey', true)
      .transition(trans)
      .attr('x', 0)
      .attr('y', -rectR)
      .attr('width', d => d.width)
      .attr('height', 2 * rectR)
      .attr('rx', d => (d.width < 16 ? 1 : 2))
      .attr('ry', d => (d.width < 16 ? 1 : 2));

    // Update decisions as a rectangle with a symbol
    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .select('rect.leaf-rect')
      .transition(trans)
      .attr('x', 0)
      .attr('y', -rectR)
      .attr('rx', d => (d.width < 16 ? 1 : 2))
      .attr('ry', d => (d.width < 16 ? 1 : 2))
      .attr('width', d => d.width)
      .attr('height', 2 * rectR);

    nodes
      .filter(d => decisionSet.has(d.data.f[0]))
      .select('text')
      .transition(trans)
      .attr('x', d => d.width / 2)
      .attr('dy', 0.5)
      .text(d => d.data.f[0])
      .style('opacity', d => (d.width < 16 ? 0 : 1));

    // Update 3: Update the links
    linkGroup
      .selectAll('path.link')
      .data(treeRoot.links())
      .join('path')
      .transition(trans)
      .attr('d', d => {
        const source = d.source as SankeyHierarchyPointNode;
        const target = d.target as SankeyHierarchyPointNode;

        return d3.line()([
          [source.x + source.width / 2, source.y],
          [target.x + target.width / 2, target.y - rectR]
        ]);
      });

    content.select('.label-group').transition(trans).style('opacity', 0);
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
   * Alternate the tree layout
   */
  alterLayout = () => {
    if (this.sankey) {
      this.#changeSankeyToStandard();
      this.sankey = false;
    } else {
      this.#changeStandardToSankey();
      this.sankey = true;
    }
  };

  /**
   * Handler for heart icon clicking event
   * @param e Mouse event
   */
  heartClicked = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.#bringWindowToTop();

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

      // Add the tree to the fav list
      const curFavTreeIDs = new Set(
        this.favoritesStoreValue.favTrees.map(d => d.pinnedTree.treeID)
      );
      if (!curFavTreeIDs.has(this.pinnedTree.treeID)) {
        this.favoritesStoreValue.favTrees.push({
          pinnedTree: this.pinnedTree,
          pinnedTreeUpdated: () => {
            this.pinnedTreeWindowUpdated();
          },
          getFeatureColor:
            this.pinnedTreeStoreValue.getFeatureColor === null
              ? f => config.colors['gray-500']
              : this.pinnedTreeStoreValue.getFeatureColor
        });
      }
    } else {
      // Remove the tree from the fav list
      const curFavTreeIDs = [
        ...this.favoritesStoreValue.favTrees.map(d => d.pinnedTree.treeID)
      ];
      const curIndex = curFavTreeIDs.indexOf(this.pinnedTree.treeID);
      if (curIndex > -1) {
        this.favoritesStoreValue.favTrees.splice(curIndex, 1);
      }
    }

    this.favoritesStore.set(this.favoritesStoreValue);
    this.pinnedTreeStore.set(this.pinnedTreeStoreValue);
  };

  /**
   * Handler for note icon clicking event
   * @param e Mouse event
   */
  noteClicked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.#bringWindowToTop();

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

    let curTreeIsActive = false;
    if (this.pinnedTreeStoreValue.lastActiveTreeID !== null) {
      curTreeIsActive =
        this.pinnedTreeStoreValue.lastActiveTreeID === this.pinnedTree.treeID;
    }

    /**
     * Check if this tree is liked first.
     * (1) True: just set isPinned to false, and keep the tree in the array
     * (2) False: remove the tree from the array
     */

    if (this.pinnedTree.isFav) {
      this.pinnedTree.isPinned = false;
    } else {
      // Remove the pinned tree window from the store array
      const curTreeIndex = this.pinnedTreeStoreValue.pinnedTrees.indexOf(
        this.pinnedTree
      );
      if (curTreeIndex > -1) {
        this.pinnedTreeStoreValue.pinnedTrees.splice(curTreeIndex, 1);
      } else {
        console.warn('Trying to delete a tree that does not exist!');
      }
    }

    // If this tree happens to be the active tree, change the active index
    // to the last pinned item
    if (curTreeIsActive) {
      let activeChanged = false;
      for (
        let i = this.pinnedTreeStoreValue.pinnedTrees.length - 1;
        i >= 0;
        i--
      ) {
        if (this.pinnedTreeStoreValue.pinnedTrees[i].isPinned) {
          this.pinnedTreeStoreValue.lastActiveTreeID =
            this.pinnedTreeStoreValue.pinnedTrees[i].treeID;
          activeChanged = true;
          break;
        }
      }

      if (!activeChanged) {
        this.pinnedTreeStoreValue.lastActiveTreeID = null;
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

  /**
   * Handler for the clicking event on the bottom toggle switch
   * @param e Mouse event
   */
  switchToggled = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const switchSelect = d3.select(e.currentTarget as HTMLElement);
    switchSelect.attr(
      'aria-checked',
      switchSelect.attr('aria-checked') === 'true' ? 'false' : true
    );

    this.alterLayout();
  };
}
