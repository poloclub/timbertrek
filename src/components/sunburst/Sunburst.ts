import d3 from '../../utils/d3-import';
import { config } from '../../config';
import type { Writable } from 'svelte/store';
import type { SunburstStoreValue } from 'src/stores';

interface FeatureMap {
  [featureID: number]: string[];
}

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

  /**
   * Map feature ID to [feature name, feature value]
   */
  featureMap: FeatureMap;
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
 * This enum defines which feature to extract. The node can include two
 * features.
 */
enum FeaturePosition {
  First,
  Second,
  Both
}

/**
 * Sunburst class that represents a sunburst chart
 */
export class Sunburst {
  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  sunburstStore: Writable<SunburstStoreValue>;
  sunburstStoreValue: SunburstStoreValue;
  width: number;
  height: number;
  level: number;
  data: HierarchyData;
  partition: d3.HierarchyRectangularNode<unknown>;
  arc: d3.Arc<any, d3.DefaultArcObject>;
  padding: Padding;
  featureMap: Map<number, string[]>;
  colorScale: d3.ScaleOrdinal<string, string, never>;

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
   * @param args.sunburstStore sunburstStore
   * @param data Hierarchy data loaded from a JSON file
   * @param width SVG width
   * @param height SVG height
   * @param level Number of tree levels to show
   */
  constructor({
    component,
    data,
    sunburstStore,
    width = config.layout.sunburstWidth,
    height = config.layout.sunburstWidth,
    level = null
  }: {
    component: HTMLElement;
    data: object;
    sunburstStore: Writable<SunburstStoreValue>;
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

    // Get the feature map
    this.featureMap = new Map<number, string[]>();
    for (const [k, v] of Object.entries(this.data.featureMap)) {
      this.featureMap.set(parseInt(k), v as string[]);
    }

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
      .startAngle(d => (d as ArcPartition).x0)
      .endAngle(d => (d as ArcPartition).x1)
      .padAngle(d =>
        Math.min(((d as ArcPartition).x1 - (d as ArcPartition).x0) / 2, 0.005)
      )
      .padRadius(this.radius * 1.5)
      .innerRadius(d => (d as ArcPartition).y0 * this.radius)
      .outerRadius(d =>
        Math.max(
          (d as ArcPartition).y0 * this.radius,
          (d as ArcPartition).y1 * this.radius - 1
        )
      );

    // Parse the feature map as a map
    this.colorScale = this.#getColorScale();

    // Initialize the store
    this.sunburstStore = sunburstStore;
    this.sunburstStoreValue = null;
    this.#initStore();

    // Draw the initial view
    console.time('Draw sunburst');
    this.#initView();
    console.timeEnd('Draw sunburst');
  }

  /**
   * Parse the feature name and value from feature's `f` field
   * @param f Feature's `f` field, it can be a number, '_', or 'root'
   * @returns featureInfo
   */
  #getFeatureInfo(f: string) {
    const featureInfo = {
      name: '',
      value: ''
    };
    const parsedInt = parseInt(f);
    if (!isNaN(parsedInt)) {
      featureInfo.name = this.featureMap.get(parsedInt)[0];
      featureInfo.value = this.featureMap.get(parsedInt)[1];
    }
    return featureInfo;
  }

  /**
   * Prepare the data for drawing.
   */
  #partitionData() {
    /**
     * Step 1: Construct d3 hierarchy
     */
    let root = d3
      .hierarchy(this.data, d => d.c)
      // Count the leaves (trees)
      .sum(d => (d.f === '_' ? 1 : 0));

    /**
     * Step 2: Figure out the feature order (based on first split frequency)
     */
    const featureCount = new Map<string, number>();
    root.children.forEach(d => {
      const featureName = this.#getFeatureName(d.data.f);
      if (featureCount.has(featureName)) {
        featureCount.set(featureName, featureCount.get(featureName) + d.value);
      } else {
        featureCount.set(featureName, d.value);
      }
    });

    // Handle leaf node
    featureCount.set('', 0);

    /**
     * Sort by the feature name, then by the # of children
     * The feature name needs to be carefully compared by the # of children
     * fall in to the feature category
     */
    root = root.sort((a, b) => {
      const aName = this.#getFeatureInfo(a.data.f).name;
      const bName = this.#getFeatureInfo(b.data.f).name;
      const aFeatureCount = featureCount.get(aName);
      const bFeatureCount = featureCount.get(bName);
      return bFeatureCount - aFeatureCount || b.value - a.value;
    });

    /**
     * Step 3: Convert the hierarchy data into a partition
     * It gives [x0, y0, x1, y1] of each node
     */
    const partition = d3.partition().size([2 * Math.PI, root.height + 1])(root);

    return partition;
  }

  /**
   * Translate the raw feature label to feature name
   * @param rawFeatureString Feature label from the JSON file
   * @param order Order to parse the feature if there are two
   * @returns Feature name
   */
  #getFeatureName(
    rawFeatureString: string,
    order: FeaturePosition = FeaturePosition.First
  ) {
    let stringID = -1;
    if (rawFeatureString.includes(' ')) {
      switch (order) {
        case FeaturePosition.First:
          stringID = +rawFeatureString.replace(/(.*)\s.*/, '$1');
          break;
        case FeaturePosition.Second:
          stringID = +rawFeatureString.replace(/.*\s(.*)/, '$1');
          break;
        case FeaturePosition.Both:
          // TODO: Need to specially handle this case
          stringID = +rawFeatureString.replace(/(.*)\s.*/, '$1');
          break;
        default:
          console.error('Unknown cases');
      }
    } else {
      stringID = +rawFeatureString;
    }

    return this.featureMap.get(stringID)[0];
  }

  /**
   * Construct the color scale for different features.
   * We create color scale by assigning a categorical color to each feature
   * group, then tune the lightness in the LCH space.
   */
  #getColorScale() {
    const featureNameSet = new Set(
      Array.from(this.featureMap.values()).map(d => d[0])
    );

    // Get the hue from the less angry rainbow scale
    // const mainColorScale = d3.scaleOrdinal(
    //   d3.quantize(d3.interpolateRainbow, featureNameSet.size + 1)
    // );

    const mainColorScale = d3
      .scaleOrdinal(d3.schemeTableau10.slice(0, 9))
      .domain(featureNameSet);
    // console.log(d3.schemeTableau10);

    return mainColorScale;
  }

  /**
   * Initialize the sunburst store
   */
  #initStore() {
    this.sunburstStore.subscribe(value => {
      this.sunburstStoreValue = value;
    });

    // Figure out the height of the trie and initialize the depth
    this.sunburstStoreValue.depthMax = this.partition.height;
    this.sunburstStoreValue.depthLow = 1;
    this.sunburstStoreValue.depthLow = this.sunburstStoreValue.depthMax;

    this.sunburstStore.set(this.sunburstStoreValue);
  }

  /**
   * Draw the initial view.
   */
  #initView() {
    // Save a copy of initial state of each node for animation
    this.partition.each(d => {
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
      .attr('class', d => `arc feature-${d.data['f']}`)
      .classed('leaf', d => d.data['f'] === '_')
      .style('fill', d => {
        // Let CSS handle the color for leaf nodes
        if (d.data['f'] === '_') {
          return 'null';
        }

        // Determine the color
        const color = this.colorScale(
          this.#getFeatureName(d.data['f'] as string)
        );
        return color;
      })
      // .style('fill-opacity', 0.5)
      // @ts-ignore
      .attr('d', d => this.arc(d.current));
  }
}
