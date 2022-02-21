import d3 from '../../utils/d3-import';

interface HierarchyData {
  /**
   * Feature name
   */
  f: string;

  /**
   * Array of children
   */
  c: HierarchyData[];

  /**
   * Array that specifies the split positions
   * (-1: negative, 0: split, 1: positive)
   * Only leaf node has this property
   */
  d: number[] | undefined;

  /**
   * Metric score of this tree
   * Only leaf node has this property
   */
  s: number | undefined;
}

// Define the arc path generator
interface ArcPartition extends d3.DefaultArcObject {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface HierarchyNode extends d3.HierarchyRectangularNode<unknown> {
  current?: d3.HierarchyRectangularNode<unknown>;
}

interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Sunburst class that represents a sunburst chart
 */
export class Sunburst {
  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  width: number;
  height: number;
  level: number;
  data: HierarchyData;
  partition: d3.HierarchyRectangularNode<unknown>;
  arc: d3.Arc<any, d3.DefaultArcObject>;
  padding: Padding;

  /**
   * The radius is determined by the number of levels to show.
   */
  get radius(): number {
    return this.width / (2 * (this.level + 1));
  }

  /**
   * Initialize a sunburst object
   * @param args Named parameters
   * @param args.component Sunburst component
   * @param data Hierarchy data loaded from a JSON file
   * @param width SVG width
   * @param height SVG height
   * @param level Number of tree levels to show
   */
  constructor({
    component,
    data,
    width = 600,
    height = 600,
    level = null
  }: {
    component: HTMLElement;
    data: object;
    width?: number;
    height?: number;
    level?: number | null;
  }) {
    console.log('Init sunburst');
    console.log(data);

    // Set up view box
    this.svg = d3
      .select(component)
      .select('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewbox', '0 0 600 600')
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

    // Transform the data
    this.data = data as HierarchyData;
    this.partition = this.#partitionData();

    // Figure out how many levels to show at the beginning
    // If `level` is not given, we show all the levels by default
    if (level === null) {
      this.level = this.partition.height;
    } else {
      this.level = level;
    }

    // Set up the arc generator
    this.arc = d3
      .arc()
      .startAngle((d) => (d as ArcPartition).x0)
      .endAngle((d) => (d as ArcPartition).x1)
      .padAngle((d) =>
        Math.min(((d as ArcPartition).x1 - (d as ArcPartition).x0) / 2, 0.005)
      )
      .padRadius(this.radius * 1.5)
      .innerRadius((d) => (d as ArcPartition).y0 * this.radius)
      .outerRadius((d) =>
        Math.max(
          (d as ArcPartition).y0 * this.radius,
          (d as ArcPartition).y1 * this.radius - 1
        )
      );

    // Draw the initial view
    console.time('Draw sunburst');
    this.#initView();
    console.timeEnd('Draw sunburst');
  }

  /**
   * Prepare the data for drawing.
   */
  #partitionData() {
    // Parse the feature names

    // Construct d3 hierarchy
    const root = d3
      .hierarchy(this.data, (d) => d.c)
      // Count the leaves (trees)
      .sum((d) => (d.d === undefined ? 0 : 1))
      // Sort by the feature name
      .sort((a, b) => a.data.f.localeCompare(b.data.f));

    // Convert the hierarchy data into a partition
    // It gives [x0, y0, x1, y1] of each node
    const partition = d3.partition().size([2 * Math.PI, root.height + 1])(root);

    return partition;
  }

  /**
   * Draw the initial view.
   */
  #initView() {
    // Save a copy of initial state of each node for animation
    this.partition.each((d) => {
      (d as HierarchyNode).current = d;
    });

    const content = this.svg
      .append('g')
      .attr('class', 'content-group')
      .attr(
        'transform',
        `translate(${this.padding.left + this.width / 2}, ${
          this.padding.top + this.height / 2
        })`
      );

    // Draw the arcs
    const arcGroup = content.append('g').attr('class', 'arc-group');

    arcGroup
      .selectAll('path.arc')
      .data(this.partition.descendants().slice(1) as HierarchyNode[])
      .join('path')
      .attr('class', (d) => `arc feature-${d.data['f']}`)
      .classed('leaf', (d) => d.data['f'] === '_')
      .style('fill', (d) => (d.data['f'] === '_' ? 'null' : 'skyblue'))
      // .style('fill-opacity', 0.5)
      // @ts-ignore
      .attr('d', (d) => this.arc(d.current));
  }
}
