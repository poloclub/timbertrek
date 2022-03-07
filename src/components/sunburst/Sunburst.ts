import d3 from '../../utils/d3-import';
import { config } from '../../config';
import type { Writable } from 'svelte/store';
import { SunburstStoreValue, SunburstAction } from '../../stores';

interface FeatureMap {
  [featureID: number]: string[];
}

interface TreeNode {
  /**
   * Feature name
   */
  f: string;

  /**
   * Array of children
   */
  c: [TreeNode, number];
}

interface TreeMap {
  /**
   * Number of trees
   */
  count: number;

  /**
   * A map from tree ID to the tree's hierarchy dict
   */
  [treeID: number]: TreeNode[];
}

interface HierarchyJSON {
  trie: RuleNode;

  /**
   * Map feature ID to [feature name, feature value]
   */
  featureMap: FeatureMap;

  treeMap: TreeMap;
}

interface RuleNode {
  /**
   * Feature name
   */
  f: string;

  /**
   * Array of children
   */
  c: RuleNode[];

  /**
   * Tree ID
   * Only leaf node has this property
   */
  t?: number;
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

interface ArcDomain {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface ArcDomainData extends ArcDomain {
  node: HierarchyNode;
  depthGap: number;
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
  sunburstStoreValue: SunburstStoreValue | null;

  padding: Padding;
  width: number;
  height: number;

  maxRadius: number;
  xScale: d3.ScaleLinear<number, number, never>;
  yScale: d3.ScaleLinear<number, number, never>;

  data: RuleNode;
  partition: d3.HierarchyRectangularNode<unknown>;

  featureCount: Map<string, number>;
  featureValueCount: Map<string, Map<string, number>>;

  arc: d3.Arc<any, d3.DefaultArcObject>;
  featureMap: Map<number, string[]>;
  colorScale: d3.ScaleOrdinal<string, string, never>;
  arcDomainStack: ArcDomainData[];
  curHeadNode: HierarchyNode;

  /**
   * The radius is determined by the number of levels to show.
   */
  get radius(): number {
    return (
      this.width /
      (2 *
        (this.sunburstStoreValue.depthMax -
          this.sunburstStoreValue.depthLow +
          1))
    );
  }

  /**
   * Initialize a sunburst object
   * @param args Named parameters
   * @param args.component Sunburst component
   * @param args.sunburstStore sunburstStore
   * @param data Hierarchy data loaded from a JSON file
   * @param width SVG width
   * @param height SVG height
   */
  constructor({
    component,
    data,
    sunburstStore,
    width = config.layout.sunburstWidth,
    height = config.layout.sunburstWidth
  }: {
    component: HTMLElement;
    data: HierarchyJSON;
    sunburstStore: Writable<SunburstStoreValue>;
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
      .attr('viewbox', '0 0 650 650')
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
    this.data = data.trie;

    // Get the feature map
    this.featureMap = new Map<number, string[]>();
    for (const [k, v] of Object.entries(data.featureMap)) {
      this.featureMap.set(parseInt(k), v as string[]);
    }

    // Partition the data
    this.featureCount = new Map<string, number>();
    this.featureValueCount = new Map<string, Map<string, number>>();
    this.partition = this.#partitionData();

    // Figure out how many levels to show at the beginning
    // If `level` is not given, we show all the levels by default
    // Initialize the store
    this.sunburstStore = sunburstStore;
    this.sunburstStoreValue = null;
    this.#initStore();

    // Create scales
    this.maxRadius = this.width / 2;
    this.xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, 2 * Math.PI])
      .clamp(true);

    this.yScale = d3.scaleLinear().domain([0, 1]).range([0, this.maxRadius]);

    // Push the initial domain
    this.arcDomainStack = [];

    // Set up the arc generator
    this.arc = d3
      .arc()
      .startAngle(d => this.xScale((d as ArcPartition).x0))
      .endAngle(d => this.xScale((d as ArcPartition).x1))
      .padAngle(d =>
        Math.min(
          ((this.xScale((d as ArcPartition).x1) -
            this.xScale((d as ArcPartition).x0)) /
            2,
          0.00001)
        )
      )
      .padRadius(this.radius * 1.5)
      .innerRadius(d => Math.max(0, this.yScale((d as ArcPartition).y0)))
      .outerRadius(d =>
        Math.max(
          this.yScale((d as ArcPartition).y0),
          this.yScale((d as ArcPartition).y1) - 1
        )
      );

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
        if (isNaN(stringID)) {
          return ['', ''];
        }
        return this.featureMap.get(stringID);
      case featureValuePairType.PairString: {
        if (isNaN(stringID)) {
          return '';
        }
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

    this.colorScale = this.#getColorScale();

    /**
     * Sort by the feature name, then by the # of children
     * The feature name needs to be carefully compared by the # of children
     * fall in to the feature category
     * One hack is to sort the sectors by the color's lightness, because we have
     * already sorted the lightness mapping in #getColorScale()
     */
    root = root.sort((a, b) => {
      const aName = this.#getFeatureInfo(a.data.f).name;
      const bName = this.#getFeatureInfo(b.data.f).name;
      const aFeatureCount = this.featureCount.get(aName);
      const bFeatureCount = this.featureCount.get(bName);

      const aLightness = d3.lch(
        this.colorScale(
          this.#getFeatureNameValue(
            a.data.f,
            FeaturePosition.First,
            featureValuePairType.PairString
          ) as string
        )
      ).l;

      const bLightness = d3.lch(
        this.colorScale(
          this.#getFeatureNameValue(
            b.data.f,
            FeaturePosition.First,
            featureValuePairType.PairString
          ) as string
        )
      ).l;

      return bFeatureCount - aFeatureCount || aLightness - bLightness;
    });

    /**
     * Step 3: Convert the hierarchy data into a partition
     * It gives [x0, y0, x1, y1] of each node
     */
    const partition = d3.partition()(root);

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

      // Handle actions
      switch (this.sunburstStoreValue.action) {
        case SunburstAction.DepthChanged: {
          // Zoom into different # of depths
          this.sunburstStoreValue.action = SunburstAction.None;
          const yGap = 1 / (this.sunburstStoreValue.depthMax + 1);

          // Need to specially handle case where the user has selected a sector
          const y0 =
            this.arcDomainStack.length > 0 ? this.yScale.domain()[0] : 0;
          this.#arcZoom(
            {
              x0: this.xScale.domain()[0],
              x1: this.xScale.domain()[1],
              y0: y0,
              y1: (this.sunburstStoreValue.depthHigh + 1) * yGap
            },
            500
          );

          this.sunburstStore.set(this.sunburstStoreValue);
          break;
        }
        case SunburstAction.None: {
          break;
        }
        default: {
          console.error('Unknown case in sunburstStore action');
        }
      }
    });

    // Figure out the height of the trie and initialize the depth
    this.sunburstStoreValue.depthMax = this.partition.height;
    this.sunburstStoreValue.depthLow = 1;
    this.sunburstStoreValue.depthHigh = this.sunburstStoreValue.depthMax - 3;
    this.sunburstStoreValue.action = SunburstAction.None;

    // Initialize the depth colors with empty strings
    this.sunburstStoreValue.depthColors = new Array<string>(
      this.sunburstStoreValue.depthMax
    ).fill('');

    this.sunburstStore.set(this.sunburstStoreValue);
  }

  /**
   * Draw the initial view.
   */
  #initView() {
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
      // @ts-ignore
      .attr('d', d => this.arc(d))
      .on('click', (e, d) => this.#arcClicked(e as MouseEvent, d))
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
      .style('display', d => {
        if (this.xScale(d.x1) - this.xScale(d.x0) < 0.002) {
          return 'none';
        }
      });

    const yGap = 1 / (this.sunburstStoreValue.depthMax + 1);
    this.#arcZoom(
      {
        x0: this.xScale.domain()[0],
        x1: this.xScale.domain()[1],
        y0: 0,
        y1: (this.sunburstStoreValue.depthHigh + 1) * yGap
      },
      500
    );

    // The initial head node is the root
    this.curHeadNode = this.partition;
  }

  /**
   * Zoom in or out of one sector with transitions
   * @param newDomain Target domain
   * @param duration Transition duration (ms)
   */
  #arcZoom(newDomain: ArcDomain, duration = 800) {
    // Customize an interpolator for the transition
    // We animate the domains of x and y scales
    const transition = this.svg
      .select('.arc-group')
      .transition()
      .duration(duration)
      .ease(d3.easeCubicInOut)
      .tween('zoom', () => {
        const xInterpolator = d3.interpolate(this.xScale.domain(), [
          newDomain.x0,
          newDomain.x1
        ]);

        const yInterpolator = d3.interpolate(this.yScale.domain(), [
          newDomain.y0,
          newDomain.y1
        ]);

        // At each frame, overwrite the x and y scale domains
        return (t: number) => {
          this.xScale.domain(xInterpolator(t));
          this.yScale.domain(yInterpolator(t));
        };
      });

    // Update the view
    transition
      .selectAll('.arc')
      .attrTween('d', d => () => this.arc(d as d3.DefaultArcObject))
      // @ts-ignore
      .style('fill-opacity', d => (d.y0 >= newDomain.y1 ? 0.2 : 1));
  }

  /**
   * Event handler for arc clicking.
   * @param e Event
   * @param d Datum
   */
  #arcClicked(e: MouseEvent, d: HierarchyNode) {
    e.stopPropagation();
    e.preventDefault();

    let targetDomain: ArcDomain = { x0: 0, x1: 1, y0: 0, y1: 1 };
    let newHead = d;

    // Detect if the user clicks the center
    const curXDomain = this.xScale.domain();
    const curYDomain = this.yScale.domain();

    // We keep the current depth gap for the transition
    const curDepthGap =
      this.sunburstStoreValue.depthHigh - this.sunburstStoreValue.depthLow;

    if (d.x0 == curXDomain[0] && d.x1 == curXDomain[1]) {
      // Case 1: Transition to the last domain in the domain stack
      const lastDomainData = this.arcDomainStack.pop();
      newHead = lastDomainData.node;
      targetDomain = lastDomainData;

      // Update the low and high pointer
      this.sunburstStoreValue.depthLow =
        newHead.depth === 0 ? 1 : newHead.depth;
      this.sunburstStoreValue.depthHigh = Math.min(
        this.sunburstStoreValue.depthLow + lastDomainData.depthGap,
        this.sunburstStoreValue.depthMax
      );
    } else {
      // Case 2: Transition to the clicked arc
      const yGap = 1 / (this.sunburstStoreValue.depthMax + 1);

      // Update the low and high pointers
      this.sunburstStoreValue.depthLow = d.depth;
      this.sunburstStoreValue.depthHigh = Math.min(
        d.depth + curDepthGap,
        this.sunburstStoreValue.depthMax
      );

      targetDomain = {
        x0: d.x0,
        x1: d.x1,
        y0: d.y0,
        y1:
          d.y0 +
          yGap *
            (this.sunburstStoreValue.depthHigh -
              this.sunburstStoreValue.depthLow +
              1)
      };

      // Save the current domain in the stack
      const curDomainData: ArcDomainData = {
        x0: curXDomain[0],
        x1: curXDomain[1],
        y0: curYDomain[0],
        y1: curYDomain[1],
        node: this.curHeadNode,
        depthGap: curDepthGap
      };
      this.arcDomainStack.push(curDomainData);
    }

    // Update the depth box color based on the clicked arc
    const depthColors = new Array<string>(
      this.sunburstStoreValue.depthMax
    ).fill('');

    const ancestors = newHead.ancestors();
    ancestors.forEach(a => {
      if (a.depth > 0) {
        const curColor = this.colorScale(
          this.#getFeatureNameValue(
            a.data['f'] as string,
            FeaturePosition.First,
            featureValuePairType.PairString
          ) as string
        );
        depthColors[a.depth - 1] = curColor;
      }
    });

    // Update the store
    this.sunburstStoreValue.depthColors = depthColors;
    this.sunburstStore.set(this.sunburstStoreValue);

    // Update the new head
    this.curHeadNode = newHead;
    this.#arcZoom(targetDomain);
  }
}
