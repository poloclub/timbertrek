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

/**
 * Sunburst class that represents a sunburst chart
 */
export class Sunburst {
  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  width: number;
  height: number;
  radius: number;
  data: HierarchyData;
  partition: object;
  arc: object;

  /**
   * Initialize a sunburst object
   * @param args Named parameters
   * @param args.component Sunburst component
   * @param data Hierarchy data loaded from a JSON file
   * @param width SVG width
   * @param height SVG height
   */
  constructor({
    component,
    data,
    width = 600,
    height = 600
  }: {
    component: HTMLElement;
    data: object;
    width?: number;
    height?: number;
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

    this.width = width;
    this.height = height;
    this.radius = this.width / 6;

    // Transform the data
    this.data = data as HierarchyData;
    this.partition = this._partition_data();

    // Define the arc path generator
    interface ArcPartition extends d3.DefaultArcObject {
      x0: number;
      x1: number;
      y0: number;
      y1: number;
    }

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
    this._initView();
  }

  /**
   * Prepare the data for drawing.
   */
  private _partition_data = () => {
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
  };

  /**
   * Draw the initial view.
   */
  private _initView = () => {
    this.svg
      .append('circle')
      .attr('cx', 300)
      .attr('cy', 300)
      .attr('r', 100)
      .style('fill', 'navy');
  };
}
