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
 * Type of feature string encodings
 */
enum featureValuePairType {
  PairArray,
  PairString
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
  featureCount: Map<string, number>;
  featureValueCount: Map<string, Map<string, number>>;
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

    this.featureCount = new Map<string, number>();
    this.featureValueCount = new Map<string, Map<string, number>>();
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
      value: '',
      nameValue: ''
    };
    const parsedInt = parseInt(f);
    if (!isNaN(parsedInt)) {
      featureInfo.name = this.featureMap.get(parsedInt)[0];
      featureInfo.value = this.featureMap.get(parsedInt)[1];
      featureInfo.nameValue = `${featureInfo.name}:${featureInfo.value}`;
    }
    return featureInfo;
  }

  /**
   * Translate the raw feature label to feature name
   * @param rawFeatureString Feature label from the JSON file
   * @param order Order to parse the feature if there are two
   * @param returnValue Return [name, value] array or 'name:value' string
   * @returns Feature name and value
   */
  #getFeatureNameValue(
    rawFeatureString: string,
    order: FeaturePosition = FeaturePosition.First,
    returnValue: featureValuePairType = featureValuePairType.PairArray
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

    switch (returnValue) {
      case featureValuePairType.PairArray:
        return this.featureMap.get(stringID);
      case featureValuePairType.PairString: {
        const tempArray = this.featureMap.get(stringID);
        return `${tempArray[0]}:${tempArray[1]}`;
      }
    }
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
    root.children.forEach(d => {
      const [featureName, featureValue] = this.#getFeatureNameValue(d.data.f);

      // Check if this feature name is created
      if (this.featureCount.has(featureName)) {
        this.featureCount.set(
          featureName,
          this.featureCount.get(featureName) + d.value
        );

        // Check if this value is created
        if (this.featureValueCount.get(featureName).has(featureValue)) {
          this.featureValueCount
            .get(featureName)
            .set(
              featureValue,
              this.featureValueCount.get(featureName).get(featureValue) +
                d.value
            );
        } else {
          this.featureValueCount.get(featureName).set(featureValue, d.value);
        }
      } else {
        this.featureCount.set(featureName, d.value);
        const tempMap = new Map<string, number>();
        tempMap.set(featureValue, d.value);
        this.featureValueCount.set(featureName, tempMap);
      }
    });

    // Handle leaf node
    this.featureCount.set('', 0);

    /**
     * Sort by the feature name, then by the # of children
     * The feature name needs to be carefully compared by the # of children
     * fall in to the feature category
     */
    root = root.sort((a, b) => {
      const aName = this.#getFeatureInfo(a.data.f).name;
      const bName = this.#getFeatureInfo(b.data.f).name;
      const aFeatureCount = this.featureCount.get(aName);
      const bFeatureCount = this.featureCount.get(bName);
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
   * Construct the color scale for different features.
   * We create color scale by assigning a categorical color to each feature
   * group, then tune the lightness in the LCH space.
   */
  #getColorScale() {
    const featureStrings: string[] = [];
    const featureColors: string[] = [];
    // const minL = 20;
    const maxLGap = 20;
    const maxL = 92;

    const tableau9 = [
      d3.lch(49.184, 30.07, 260.445), // blue
      d3.lch(68.968, 73.064, 62.176), // orange
      d3.lch(56.278, 61.87, 27.615), // red
      d3.lch(60.11, 50.293, 135.863), // green
      d3.lch(82.442, 65.798, 87.008), // yellow
      d3.lch(69.948, 22.911, 191.071), // sky
      d3.lch(57.703, 28.677, 334.556), // purple
      d3.lch(52.777, 22.881, 53.64), // brown
      d3.lch(75.303, 39.883, 16.269) // pink
    ];

    // Sort the feature by (1) feature name; (2) feature value by # of trees use
    // them in the first split
    const sortedFeatureNames = Array.from(this.featureCount.keys())
      .filter(a => a !== '')
      .sort((a, b) => this.featureCount.get(b) - this.featureCount.get(a));

    sortedFeatureNames.forEach((featureName, i) => {
      if (i > 8) {
        console.error('Number of feature is greater than 9');
      }

      const curColor = d3.lch(d3.color(tableau9[i % 8]));

      // Get the number of values using this feature
      const sortedFeatureValues = Array.from(
        this.featureValueCount.get(featureName).keys()
      ).sort(
        (a, b) =>
          this.featureValueCount.get(featureName).get(b) -
          this.featureValueCount.get(featureName).get(a)
      );

      // Create different lightness based on the number of values
      const valueNum = sortedFeatureValues.length;

      // If there are not many values, we can just use the maxLGap to decrease L
      if (curColor.l + valueNum * maxLGap <= maxL) {
        sortedFeatureValues.forEach((value, j) => {
          const newFeatureString = `${featureName}:${value}`;
          const newFeatureColor = d3.lch(
            curColor.l + j * maxLGap,
            curColor.c,
            curColor.h
          );
          featureStrings.push(newFeatureString);
          featureColors.push(newFeatureColor.formatHsl());
        });
      } else {
        // If there are too many values, we equally divide the lightness
        const curLGap = (maxL - curColor.l) / valueNum;
        sortedFeatureValues.forEach((value, j) => {
          const newFeatureString = `${featureName}:${value}`;
          const newFeatureColor = d3.lch(
            curColor.l + j * curLGap,
            curColor.c,
            curColor.h
          );
          featureStrings.push(newFeatureString);
          featureColors.push(newFeatureColor.formatHsl());
        });
      }
    });

    const mainColorScale = d3
      .scaleOrdinal(featureColors)
      .domain(featureStrings);

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
          this.#getFeatureNameValue(
            d.data['f'] as string,
            FeaturePosition.First,
            featureValuePairType.PairString
          ) as string
        );
        return color;
      })
      // .style('fill-opacity', 0.5)
      // @ts-ignore
      .attr('d', d => this.arc(d.current));
  }
}
