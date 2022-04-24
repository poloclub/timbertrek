import d3 from '../../utils/d3-import';
import { setsAreEqual } from '../../utils/utils';
import { config } from '../../config';
import type { Writable } from 'svelte/store';
import { SunburstAction } from '../../stores';
import type {
  SunburstStoreValue,
  TreeWindowStoreValue,
  PinnedTreeStoreValue,
  SearchStoreValue
} from '../../stores';
import {
  getSunburstStoreDefaultValue,
  getTreeWindowStoreDefaultValue,
  getPinnedTreeStoreDefaultValue,
  getSearchStoreDefaultValue
} from '../../stores';
import {
  textArc,
  doesTextFitArc,
  removeText,
  drawText,
  drawSecondaryText,
  drawCenterText
} from './SunburstText';
import {
  arcClicked,
  arcMouseenterHandler,
  arcMouseleaveHandler,
  leafArcMouseenterHandler,
  leafArcMouseleaveHandler,
  leafArcClickHandler,
  getTreeWindowPos,
  tempShowPinnedTree
} from './SunburstEvent';
import {
  syncAccuracyRange,
  syncMinSampleRange,
  syncHeightRange,
  syncDepthFeatures,
  syncAllFeatures,
  updateSunburst,
  updateSunburstWithAnimation
} from './SunburstFilter';
import { FeaturePosition, FeatureValuePairType } from '../TimberTypes';
import type {
  ArcDomain,
  ArcDomainData,
  ArcPartition,
  FeatureInfo,
  HierarchyJSON,
  HierarchyNode,
  Padding,
  RuleNode,
  TreeNode,
  SelectedTrees
} from '../TimberTypes';

const ZOOM_DURATION = 800;

/**
 * Sunburst class that represents a sunburst chart
 */
export class Sunburst {
  svg: d3.Selection<d3.BaseType, unknown, null, undefined>;
  sunburstStore: Writable<SunburstStoreValue>;
  sunburstStoreValue: SunburstStoreValue;

  treeWindowStore: Writable<TreeWindowStoreValue>;
  treeWindowStoreValue: TreeWindowStoreValue;

  pinnedTreeStore: Writable<PinnedTreeStoreValue>;
  pinnedTreeStoreValue: PinnedTreeStoreValue;

  searchStore: Writable<SearchStoreValue>;
  searchStoreValue: SearchStoreValue;

  sunburstUpdated: () => void;

  padding: Padding;
  width: number;
  height: number;

  maxRadius: number;
  xScale: d3.ScaleLinear<number, number, never>;
  yScale: d3.ScaleLinear<number, number, never>;
  textFontScale: d3.ScaleLinear<number, number, never>;

  data: RuleNode;
  dataRoot: d3.HierarchyNode<RuleNode>;
  treeMapMap: Map<number, [TreeNode, number, number]>;
  partition: HierarchyNode;

  totalPathNum: number;
  totalTreeNum: number;

  featureCount: Map<string, number>;
  featureValueCount: Map<string, Map<string, number>>;
  featureOrder: number[];

  arc: d3.Arc<unknown, d3.DefaultArcObject>;
  featureMap: Map<number, string[]>;
  colorScale: d3.ScaleOrdinal<string, string, never>;
  arcDomainStack: ArcDomainData[];
  curHeadNode: HierarchyNode;

  // Properties for tree filtering
  localAccuracyLow: number;
  localAccuracyHigh: number;
  localMinSampleLow: number;
  localMinSampleHigh: number;
  localHeightRange: Set<number>;
  localDepthFeatures: Map<number, Set<number>>;
  localAllFeatures: Set<number>;
  viewInitialized = false;
  selectedTrees: SelectedTrees;

  // ===== Methods implemented in another file ====
  /**
   * Initialize text arc
   */
  textArc = textArc;

  /**
   * Approximate if the text fits in the given arc
   */
  doesTextFitArc = doesTextFitArc;

  /**
   * Remove all text
   */
  removeText = removeText;

  /**
   * Draw feature names on the inner circles and the most inner ring
   */
  drawText = drawText;

  /**
   * Draw feature names that are not drawn on the first ring on the second ring
   */
  drawSecondaryText = drawSecondaryText;

  /**
   * Draw texts on the center circles
   */
  drawCenterText = drawCenterText;

  /**
   * Event handler for arc clicking.
   * @param e Event
   * @param d Datum of the hierarchy node. If it is null, return to the last
   *   state
   */
  arcClicked = arcClicked;

  /**
   * Handler for mouseenter event
   * @param this Sunburst
   * @param e Event
   * @param d Node data
   */
  arcMouseenterHandler = arcMouseenterHandler;

  /**
   * Handler for mouseenter event
   * @param this Sunburst
   * @param e Event
   * @param d Node data
   */
  arcMouseleaveHandler = arcMouseleaveHandler;

  /**
   * Handler for mouse click event
   * @param this Sunburst
   * @param e Event
   * @param d Node data
   */
  leafArcClickHandler = leafArcClickHandler;

  leafArcMouseenterHandler = leafArcMouseenterHandler;
  leafArcMouseleaveHandler = leafArcMouseleaveHandler;

  getTreeWindowPos = getTreeWindowPos;
  tempShowPinnedTree = tempShowPinnedTree;

  // ===== Methods implemented in SunburstFilter.ts ====
  syncAccuracyRange = syncAccuracyRange;
  syncMinSampleRange = syncMinSampleRange;
  updateSunburst = updateSunburst;
  updateSunburstWithAnimation = updateSunburstWithAnimation;
  syncHeightRange = syncHeightRange;
  syncDepthFeatures = syncDepthFeatures;
  syncAllFeatures = syncAllFeatures;

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
   * @param args.initDepthGap Initial depth gap
   * @param data Hierarchy data loaded from a JSON file
   * @param width SVG width
   * @param height SVG height
   */
  constructor({
    component,
    data,
    initDepthGap = 2,
    sunburstStore,
    treeWindowStore,
    pinnedTreeStore,
    searchStore,
    sunburstUpdated
  }: {
    component: HTMLElement;
    data: HierarchyJSON;
    initDepthGap: number;
    sunburstStore: Writable<SunburstStoreValue>;
    treeWindowStore: Writable<TreeWindowStoreValue>;
    pinnedTreeStore: Writable<PinnedTreeStoreValue>;
    searchStore: Writable<SearchStoreValue>;
    sunburstUpdated: () => void;
  }) {
    // Set up view box
    this.svg = d3
      .select(component)
      .select('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewbox', '0 0 650 650')
      .attr('preserveAspectRatio', 'none');

    // Configure the view size
    this.padding = {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    };

    const svgBBox = (this.svg.node() as HTMLElement).getBoundingClientRect();
    this.width = svgBBox.width - this.padding.left - this.padding.right;
    this.height = svgBBox.height - this.padding.top - this.padding.bottom;

    // this.width = width - this.padding.left - this.padding.right;
    // this.height = height - this.padding.top - this.padding.bottom;

    // Transform the data
    this.data = data.trie;

    // Convert treeMap into a real Map
    this.treeMapMap = new Map<number, [TreeNode, number, number]>();
    Object.keys(data.treeMap).forEach(k => {
      this.treeMapMap.set(+k, data.treeMap[+k] as [TreeNode, number, number]);
    });

    // Get the feature map
    this.featureMap = new Map<number, string[]>();
    for (const [k, v] of Object.entries(data.featureMap)) {
      this.featureMap.set(parseInt(k), v as string[]);
    }

    // Partition the data
    this.featureCount = new Map<string, number>();
    this.featureValueCount = new Map<string, Map<string, number>>();
    this.colorScale = d3.scaleOrdinal();

    this.featureOrder = [];

    this.dataRoot = d3
      .hierarchy(this.data, d => d.c)
      // Count the leaves (trees)
      .sum(d => (d.f === '_' ? 1 : 0));
    this.partition = this.#partitionData();

    // The initial head node is the root
    this.curHeadNode = this.partition;
    this.totalTreeNum = this.partition.treeNum;
    this.totalPathNum = this.partition.value!;

    // Figure out how many levels to show at the beginning
    // If `level` is not given, we show all the levels by default
    // Initialize the store
    this.sunburstStore = sunburstStore;
    this.sunburstStoreValue = getSunburstStoreDefaultValue();
    this.#initSunburstStore(initDepthGap);

    this.treeWindowStore = treeWindowStore;
    this.treeWindowStoreValue = getTreeWindowStoreDefaultValue();
    this.#initTreeWindowStore();

    this.pinnedTreeStore = pinnedTreeStore;
    this.pinnedTreeStoreValue = getPinnedTreeStoreDefaultValue();
    this.#initPinnedTreeStore();

    this.searchStore = searchStore;
    this.searchStoreValue = getSearchStoreDefaultValue();
    this.localAccuracyLow = this.searchStoreValue.curAccuracyLow;
    this.localAccuracyHigh = this.searchStoreValue.curAccuracyHigh;
    this.localMinSampleLow = this.searchStoreValue.curMinSampleLow;
    this.localMinSampleHigh = this.searchStoreValue.curMinSampleHigh;
    this.localHeightRange = new Set([...this.searchStoreValue.curHeightRange]);
    this.localDepthFeatures = deepCopyDepthFeatures(
      this.searchStoreValue.curDepthFeatures
    );
    this.localAllFeatures = new Set([...this.searchStoreValue.curAllFeatures]);
    this.selectedTrees = {
      accuracy: new Set(this.treeMapMap.keys()),
      minSample: new Set(this.treeMapMap.keys()),
      height: new Set(this.treeMapMap.keys()),
      depth: new Set(this.treeMapMap.keys()),
      allFeature: new Set(this.treeMapMap.keys())
    };
    this.#initSearchStore();

    this.sunburstUpdated = sunburstUpdated;

    // Create scales
    this.maxRadius = this.width / 2;
    this.xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, 2 * Math.PI])
      .clamp(true);

    this.yScale = d3.scaleLinear().domain([0, 1]).range([0, this.maxRadius]);

    this.textFontScale = d3
      .scaleLinear()
      .domain([1, this.sunburstStoreValue.depthMax - 1])
      .range([0.93, 0.7]);

    // Push the initial domain
    this.arcDomainStack = [];

    // Initialize the background arc path generator
    this.arc = d3
      .arc()
      .startAngle(d => this.xScale((d as ArcPartition).x0))
      .endAngle(d => {
        const da = d as ArcPartition;

        // Set minimal angle to avoid animation artifact
        let newX1 = da.x1;
        if (da.x0 === da.x1) {
          newX1 = da.x0 + 1e-6;
        }
        return this.xScale(newX1);
      })
      .padAngle(d => {
        const dn = d as unknown as HierarchyNode;
        const sectorWidth =
          this.xScale((d as ArcPartition).x1) -
          this.xScale((d as ArcPartition).x0);
        if (dn.data.f === '_') {
          if (sectorWidth < 0.001) {
            return 0;
          } else {
            return Math.min(sectorWidth / 2, 0.015);
          }
        } else {
          return 0;
        }
      })
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
    this.initView();
    this.viewInitialized = true;
    console.timeEnd('Draw sunburst');

    // if (this.pinnedTreeStoreValue.pinnedTrees.length < 1) {
    //   setTimeout(() => {
    //     this.tempShowPinnedTree();
    //   }, 500);
    // }
  }

  /**
   * Parse the feature name and value from feature's `f` field
   * @param f Feature's `f` field, it can be a number, '_', or 'root'
   * @returns featureInfo
   */
  protected getFeatureInfo(f: string): FeatureInfo {
    const featureInfo = {
      name: '',
      value: '',
      nameValue: '',
      short: '',
      shortValue: ''
    };
    const parsedInt = parseInt(f);
    if (!isNaN(parsedInt)) {
      const featureMapValue = this.featureMap.get(parsedInt);
      if (featureMapValue !== undefined) {
        featureInfo.name = featureMapValue[0];
        featureInfo.value = featureMapValue[1];
        featureInfo.short = featureMapValue[2];
        featureInfo.nameValue = `${featureInfo.name} ${featureInfo.value}`;
        featureInfo.shortValue = `${featureInfo.short} ${featureInfo.value}`;
      }
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
  protected getFeatureNameValue(
    rawFeatureString: string,
    order: FeaturePosition = FeaturePosition.First,
    returnValue: FeatureValuePairType = FeatureValuePairType.PairArray
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
      case FeatureValuePairType.PairArray:
        if (isNaN(stringID)) {
          return ['', ''];
        }
        return this.featureMap.get(stringID);
      case FeatureValuePairType.PairString: {
        if (isNaN(stringID)) {
          return '';
        }
        const tempArray = this.featureMap.get(stringID);
        if (tempArray !== undefined) {
          return `${tempArray[0]}:${tempArray[1]}`;
        } else {
          console.error(`Encounter unrecorded key ${stringID}`);
          return '';
        }
      }
    }
  }

  /**
   * Prepare the data for drawing.
   */
  #partitionData() {
    /**
     * Step 1: Initialize the `u` and `nid` properties
     *
     * `u` is only for leaf nodes (all true, as there is no filter at
     * the beginning.)
     *
     * `nid` is an unique ID for all nodes
     */
    let curID = 0;
    this.dataRoot.eachBefore(d => {
      if (d.data.f === '_') {
        d.data.u = true;
      }
      d.data.nid = curID++;
    });

    /**
     * Step 2: Figure out the feature order (based on first split frequency)
     */
    // Initialize the featureValueCount and featureCount map
    for (const [f, items] of this.featureMap) {
      if (this.featureValueCount.has(items[0])) {
        this.featureValueCount.get(items[0])!.set(items[1], 0);
      } else {
        const tempMap = new Map<string, number>();
        tempMap.set(items[1], 0);
        this.featureValueCount.set(items[0], tempMap);
      }

      if (!this.featureCount.has(items[0])) {
        this.featureCount.set(items[0], 0);
      }
    }

    this.dataRoot.children!.forEach(d => {
      const [featureName, featureValue] = this.getFeatureNameValue(
        d.data.f
      ) as string[];

      // Check if this feature name is created
      this.featureCount.set(
        featureName,
        this.featureCount.get(featureName)! + d.value!
      );

      // Update the value count
      this.featureValueCount
        .get(featureName)!
        .set(
          featureValue,
          this.featureValueCount.get(featureName)!.get(featureValue)! + d.value!
        );
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
    this.dataRoot = this.dataRoot.sort((a, b) => {
      const aName = this.getFeatureInfo(a.data.f).name;
      const bName = this.getFeatureInfo(b.data.f).name;
      const aFeatureCount = this.featureCount.get(aName);
      const bFeatureCount = this.featureCount.get(bName);

      const aLightness = d3.lch(this.getFeatureColor(a.data.f)).l;
      const bLightness = d3.lch(this.getFeatureColor(b.data.f)).l;

      if (aFeatureCount !== undefined && bFeatureCount !== undefined) {
        // (1) feature count
        // (2) if same feature count => name string
        // (3) same feature count, same name => value count
        return (
          bFeatureCount - aFeatureCount ||
          aName.localeCompare(bName) ||
          aLightness - bLightness
        );
      } else {
        console.warn(`Encountered unrecorded keys '${aName}', '${bName}'`);
        return 0;
      }
    });

    // Register the sorting order
    this.featureOrder = this.dataRoot.children!.map(d => parseInt(d.data.f));
    this.featureMap.forEach((v, k) => {
      if (!this.featureOrder.includes(k)) {
        const previousIndexes: number[] = [];
        this.featureMap.forEach((vi, ki) => {
          if (vi[0] === v[0] && this.featureOrder.indexOf(ki) !== -1) {
            previousIndexes.push(this.featureOrder.indexOf(ki));
          }
        });
        this.featureOrder.splice(Math.max(...previousIndexes) + 1, 0, k);
      }
    });

    /**
     * Step 3: Convert the hierarchy data into a partition
     * It gives [x0, y0, x1, y1] of each node
     */
    const partition = d3.partition()(this.dataRoot) as HierarchyNode;

    /**
     * Step 4: Store number of unique trees in descendants for each node
     */
    partition.eachAfter(d => {
      if (d.data.f === '_') {
        d.uniqueTreeIDs = new Set([d.data.t!]);
      } else {
        const curIDs = new Set<number>();
        d.children?.forEach(c => {
          c.uniqueTreeIDs?.forEach(id => {
            curIDs.add(id);
          });
        });
        d.uniqueTreeIDs = curIDs;
      }
    });

    // Transfer the ID set to its length at each node
    partition.each(d => {
      d.treeNum = d.uniqueTreeIDs?.size || 0;
      d.uniqueTreeIDs = null;
    });

    return partition;
  }

  /**
   * Get the color of the feature value pair
   * @param f Feature value pair string
   * @returns Color in string
   */
  getFeatureColor = (f: string) => {
    return this.colorScale(
      this.getFeatureNameValue(
        f,
        FeaturePosition.First,
        FeatureValuePairType.PairString
      ) as string
    );
  };

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
      d3.lch(52.777, 22.881, 53.64) // brown
      // d3.lch(75.303, 39.883, 16.269) // pink
    ];

    const colorChangedCountMap = new Map<number, [number, d3.HCLColor]>();
    for (const [i, color] of tableau9.entries()) {
      colorChangedCountMap.set(i, [0, color]);
    }

    // Sort the feature by (1) feature name; (2) feature value by # of trees use
    // them in the first split
    const sortedFeatureNames = Array.from(this.featureCount.keys())
      .filter(a => a !== '')
      .sort((a, b) => this.featureCount.get(b)! - this.featureCount.get(a)!);

    sortedFeatureNames.forEach((featureName, i) => {
      let curColor: d3.HCLColor;
      let curColorIndex: number;

      if (i > 7) {
        console.warn('Number of feature is greater than 8:', featureName);
        // Find the previous color with the fewest variants
        let minIndex = -1;
        let minCount = Infinity;
        for (let j = 0; j < tableau9.length; j++) {
          if (colorChangedCountMap.get(j)![0] < minCount) {
            minIndex = j;
            minCount = colorChangedCountMap.get(j)![0];
          }
        }
        curColor = colorChangedCountMap.get(minIndex)![1];
        curColorIndex = minIndex;
      } else {
        curColor = tableau9[i];
        curColorIndex = i;
      }

      // Get the number of values using this feature
      const sortedFeatureValues = Array.from(
        this.featureValueCount.get(featureName)!.keys()
      ).sort(
        (a, b) =>
          this.featureValueCount.get(featureName)!.get(b)! -
          this.featureValueCount.get(featureName)!.get(a)!
      );

      // Create different lightness based on the number of values
      const valueNum = sortedFeatureValues.length;

      // If there are not many values, we can just use the maxLGap to decrease L
      let newFeatureColor: d3.HCLColor = curColor;
      if (curColor.l + valueNum * maxLGap <= maxL) {
        sortedFeatureValues.forEach((value, j) => {
          const newFeatureString = `${featureName}:${value}`;
          newFeatureColor = d3.lch(
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
          newFeatureColor = d3.lch(
            curColor.l + j * curLGap,
            curColor.c,
            curColor.h
          );
          featureStrings.push(newFeatureString);
          featureColors.push(newFeatureColor.formatHsl());
        });
      }

      // Track the color count
      const nextLighterColor = d3.lch(
        newFeatureColor.l + 10,
        newFeatureColor.c,
        newFeatureColor.h
      );

      colorChangedCountMap.set(curColorIndex, [
        colorChangedCountMap.get(curColorIndex)![0] + valueNum,
        nextLighterColor
      ]);
    });

    const mainColorScale = d3
      .scaleOrdinal(featureColors)
      .domain(featureStrings);

    return mainColorScale;
  }

  /**
   * Initialize the sunburst store
   */
  #initSunburstStore(initDepthGap: number) {
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
          this.arcZoom(
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
    this.sunburstStoreValue.depthHigh =
      this.sunburstStoreValue.depthLow + initDepthGap;
    this.sunburstStoreValue.action = SunburstAction.None;

    // Initialize the depth colors with empty strings
    this.sunburstStoreValue.depthColors = new Array<string>(
      this.sunburstStoreValue.depthMax
    ).fill('');

    this.sunburstStore.set(this.sunburstStoreValue);
  }

  /**
   * Initialize the tree window store
   */
  #initTreeWindowStore() {
    this.treeWindowStore.subscribe(value => {
      this.treeWindowStoreValue = value;
    });

    // Pass the color scale to tree window store
    this.treeWindowStoreValue.getFeatureColor = this.getFeatureColor;
    this.treeWindowStore.set(this.treeWindowStoreValue);
  }

  /**
   * Initialize the pinned tree store
   */
  #initPinnedTreeStore() {
    this.pinnedTreeStore.subscribe(value => {
      this.pinnedTreeStoreValue = value;
    });

    // Pass the color scale to tree window store
    this.pinnedTreeStoreValue.getFeatureColor = this.getFeatureColor;
    this.pinnedTreeStoreValue.getFeatureInfo = (f: string) => {
      return this.getFeatureInfo(f);
    };
    this.pinnedTreeStore.set(this.pinnedTreeStoreValue);
  }

  /**
   * Initialize the search store
   */
  #initSearchStore() {
    this.searchStore.subscribe(value => {
      this.searchStoreValue = value;

      // (1) Need to update the view if user changes the accuracy range
      if (
        this.viewInitialized &&
        this.searchStoreValue.shown &&
        (this.searchStoreValue.curAccuracyHigh !== this.localAccuracyHigh ||
          this.searchStoreValue.curAccuracyLow !== this.localAccuracyLow)
      ) {
        this.localAccuracyHigh = this.searchStoreValue.curAccuracyHigh;
        this.localAccuracyLow = this.searchStoreValue.curAccuracyLow;
        this.syncAccuracyRange();
      } else {
        this.localAccuracyHigh = this.searchStoreValue.curAccuracyHigh;
        this.localAccuracyLow = this.searchStoreValue.curAccuracyLow;
      }

      // (1) Need to update the view if user changes the min sample range
      if (
        this.viewInitialized &&
        this.searchStoreValue.shown &&
        (this.searchStoreValue.curMinSampleHigh !== this.localMinSampleHigh ||
          this.searchStoreValue.curMinSampleLow !== this.localMinSampleLow)
      ) {
        this.localMinSampleHigh = this.searchStoreValue.curMinSampleHigh;
        this.localMinSampleLow = this.searchStoreValue.curMinSampleLow;
        this.syncMinSampleRange();
      } else {
        this.localMinSampleHigh = this.searchStoreValue.curMinSampleHigh;
        this.localMinSampleLow = this.searchStoreValue.curMinSampleLow;
      }

      // (3) Need to update the view if user changes the height range
      const heightRangeNotChanged =
        [...this.localHeightRange].every(d =>
          this.searchStoreValue.curHeightRange.has(d)
        ) &&
        this.localHeightRange.size ===
          this.searchStoreValue.curHeightRange.size;
      if (
        this.viewInitialized &&
        this.searchStoreValue.shown &&
        !heightRangeNotChanged
      ) {
        this.localHeightRange = new Set([
          ...this.searchStoreValue.curHeightRange
        ]);
        this.syncHeightRange();
      } else {
        this.localHeightRange = new Set([
          ...this.searchStoreValue.curHeightRange
        ]);
      }

      // (4) Need to update the view if user changes any depth features
      const depthFeaturesNotChanged = [
        ...this.searchStoreValue.curDepthFeatures.entries()
      ].every(pair => {
        if (!this.localDepthFeatures.has(pair[0])) {
          return false;
        } else {
          return setsAreEqual(this.localDepthFeatures.get(pair[0])!, pair[1]);
        }
      });
      if (
        this.viewInitialized &&
        this.searchStoreValue.shown &&
        !depthFeaturesNotChanged
      ) {
        this.localDepthFeatures = deepCopyDepthFeatures(
          this.searchStoreValue.curDepthFeatures
        );
        this.syncDepthFeatures();
      } else {
        this.localDepthFeatures = deepCopyDepthFeatures(
          this.searchStoreValue.curDepthFeatures
        );
      }

      // (5) Need to update the view if user changes features in the all depth row
      const allFeaturesNotChanged = setsAreEqual(
        this.localAllFeatures,
        this.searchStoreValue.curAllFeatures
      );

      if (
        this.viewInitialized &&
        this.searchStoreValue.shown &&
        !allFeaturesNotChanged
      ) {
        this.localAllFeatures = new Set([
          ...this.searchStoreValue.curAllFeatures
        ]);
        this.syncAllFeatures();
      } else {
        this.localAllFeatures = new Set([
          ...this.searchStoreValue.curAllFeatures
        ]);
      }
    });

    // Pass the color scale to search store
    this.searchStoreValue.getFeatureColor = this.getFeatureColor;
    this.searchStoreValue.featureMap = this.featureMap;
    this.searchStoreValue.featureOrder = this.featureOrder;

    // Also initialize the depth feature (use all features at each depth)
    // From 1 to height - 1 (to exclude the root and leaves)
    for (let i = 1; i < this.partition.height; i++) {
      const allFeatureIDs = new Set([...this.featureMap.keys()].map(k => k));
      this.searchStoreValue.curDepthFeatures.set(i, allFeatureIDs);
    }

    // Also initialize the all depth feature row
    const allFeatureIDs = new Set([...this.featureMap.keys()].map(k => k));
    this.searchStoreValue.curAllFeatures = allFeatureIDs;

    this.searchStore.set(this.searchStoreValue);
  }

  /**
   * Draw the initial view.
   */
  protected initView() {
    const content = this.svg
      .append('g')
      .attr('class', 'content-group')
      .attr(
        'transform',
        `translate(${this.padding.left + this.width / 2}, ${
          this.padding.top + this.height / 2
        })`
      );

    // Create middle circle group
    content.append('g').attr('class', 'mid-circle-group');

    // Draw the arcs
    const arcGroup = content.append('g').attr('class', 'arc-group');

    // Place holder for arc text (higher order)
    content.append('g').attr('class', 'text-group');

    const arcGroups = arcGroup
      .selectAll('g.arc')
      .data(
        this.partition.descendants().slice(1),
        d => (d as HierarchyNode).data.nid!
      )
      .join('g')
      .attr(
        'class',
        d =>
          `arc arc-${d.depth} ${
            d.data.f === '_' ? 'leaf leaf-'.concat(String(d.data.t!)) : ''
          }`
      )
      .classed('leaf', d => d.data.f === '_');

    // Draw the background paths
    const arcs = arcGroups
      .append('path')
      .attr('class', 'arc')
      .attr(
        'class',
        d =>
          `arc arc-${d.depth} ${
            d.data.f === '_' ? 'leaf leaf-'.concat(String(d.data.t!)) : ''
          }`
      )
      .attr('id', d => `arc-${d.data.nid}`)
      // @ts-ignore
      .attr('d', d => this.arc(d))
      .on('click', (e, d) => this.arcClicked(e as MouseEvent, d))
      .on('mouseenter', (e, d) => this.arcMouseenterHandler(e as MouseEvent, d))
      .on('mouseleave', (e, d) => this.arcMouseleaveHandler(e as MouseEvent, d))
      .style('fill', d => {
        // Let CSS handle the color for leaf nodes
        if (d.data.f === '_') {
          return 'null';
        }
        // Determine the color
        return this.getFeatureColor(d.data.f);
      })
      .style('display', d => {
        if (d.data.f === ';') {
          return 'none';
        } else if (d.depth > this.sunburstStoreValue.depthHigh + 1) {
          return 'none';
        } else {
          return 'initial';
        }
      });

    // Add hover event for leaf arcs
    arcs
      .filter(d => d.data.f === '_')
      .on('click', (e, d) => this.leafArcClickHandler(e as MouseEvent, d))
      .on('mouseenter', (e, d) =>
        this.leafArcMouseenterHandler(e as MouseEvent, d)
      )
      .on('mouseleave', (e, d) =>
        this.leafArcMouseleaveHandler(e as MouseEvent, d)
      );

    arcGroups
      .append('title')
      .text(d => this.getFeatureInfo(d.data.f).nameValue);

    // Zoom into the third level at the beginning
    const yGap = 1 / (this.sunburstStoreValue.depthMax + 1);
    this.arcZoom(
      {
        x0: this.xScale.domain()[0],
        x1: this.xScale.domain()[1],
        y0: 0,
        y1: (this.sunburstStoreValue.depthHigh + 1) * yGap
      },
      500
    );
  }

  /**
   * Zoom in or out of one sector with transitions
   * @param newDomain Target domain
   * @param duration Transition duration (ms)
   */
  protected arcZoom(newDomain: ArcDomain, duration = ZOOM_DURATION) {
    // Clean up the text
    this.removeText();
    this.#drawMidCircles(newDomain);

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
      })
      .on('end', () => {
        this.drawText();
        this.drawCenterText();
      });

    // Update the view
    // @ts-ignore
    transition
      .selectAll('.arc')
      .attrTween('d', d => () => this.arc(d as d3.DefaultArcObject))
      .style('fill-opacity', d =>
        (d as HierarchyNode).depth > this.sunburstStoreValue.depthHigh ? 0.2 : 1
      )
      .style('pointer-events', d =>
        (d as HierarchyNode).depth > this.sunburstStoreValue.depthHigh
          ? 'none'
          : 'initial'
      )
      .style('display', d => {
        const cd = d as HierarchyNode;
        if (cd.data.f === ';') {
          return 'none';
        } else if (cd.depth > this.sunburstStoreValue.depthHigh + 1) {
          return 'none';
        } else {
          return 'initial';
        }
      });
  }

  /**
   * Draw the circles for selected sectors (ancestors)
   * @param newDomain Target domain
   */
  #drawMidCircles(newDomain: ArcDomain) {
    // Check if the user is jumping depths; if so we need to animate the enter
    let skipDepth = false;
    if (this.arcDomainStack.length > 0) {
      skipDepth =
        this.curHeadNode.depth -
          this.arcDomainStack[this.arcDomainStack.length - 1].node.depth !==
        1;
    }

    const midCircleGroup = this.svg
      .select('g.content-group')
      .selectAll('g.mid-circle-group')
      .data([0])
      .join('g')
      .attr('class', 'mid-circle-group')
      .raise();

    // The data is the head node's ancestors
    const ancestors = this.curHeadNode.ancestors().filter(d => d.depth !== 0);

    /**
     * Very edgy case! Cannot use this.yScale() here because its domain is being
     * interpolated in the sector zooming function
     */
    const newYScale = d3
      .scaleLinear()
      .domain([newDomain.y0, newDomain.y1])
      .range([0, this.maxRadius]);

    const centerRadius =
      newYScale(this.curHeadNode.y1) - newYScale(this.curHeadNode.y0);

    const depths = ancestors.map(d => d.depth);

    const radiusScale = d3
      .scaleLinear()
      .domain([d3.min(depths)! - 1, d3.max(depths)!])
      .range([0, centerRadius]);

    const smallestR = radiusScale(1);

    midCircleGroup
      .selectAll('g.mid-circle')
      // Use the node count as key
      .data(ancestors, d => (d as HierarchyNode).value!)
      .join(
        enter => {
          const newEnter = enter
            .append('g')
            .attr('class', 'mid-circle')
            .on('click', e => this.arcClicked(e as MouseEvent, null));

          // Draw the circle
          newEnter
            .append('circle')
            .attr('r', 0)
            .style('fill', d => this.getFeatureColor(d.data.f))
            .call(enter =>
              enter
                .transition()
                .duration(skipDepth ? 0 : 0)
                .delay(skipDepth ? ZOOM_DURATION - 100 : ZOOM_DURATION + 100)
                .attr('r', d => radiusScale(d.depth))
            );

          // Draw text arcs on each circle
          newEnter
            .append('path')
            .attr('class', 'mid-circle-text-arc')
            .attr('id', d => `mid-circle-text-arc-${d.depth}`)
            .attr('d', d => {
              const angles = [Math.PI * 0.5, Math.PI * 2.5];
              const radius = smallestR * (d.depth - 0.5);
              const curPath = d3.path();
              curPath.arc(0, 0, radius, angles[0], angles[1], false);
              return curPath.toString();
            });

          // Add a title for hovering
          newEnter
            .append('title')
            .text(d => this.getFeatureInfo(d.data.f).nameValue);

          return newEnter;
        },
        update => {
          const newUpdate = update;

          // Update the circle radius
          newUpdate
            .select('circle')
            .transition('zoom')
            .duration(ZOOM_DURATION)
            .ease(d3.easeCubicInOut)
            .attr('r', d => {
              return radiusScale(d.depth);
            });

          // Update the circle text path arc
          newUpdate.select('path').attr('d', d => {
            const angles = [Math.PI * 0.5, Math.PI * 2.5];
            const radius = smallestR * (d.depth - 0.5);
            const curPath = d3.path();
            curPath.arc(0, 0, radius, angles[0], angles[1], false);
            return curPath.toString();
          });

          return newUpdate;
        }
      );
  }
}

/**
 * Deep copy the depthFeatures map
 * @param depthFeatures Map depth number to a set of feature IDs
 */
const deepCopyDepthFeatures = (
  depthFeatures: Map<number, Set<number>>
): Map<number, Set<number>> => {
  const newMap = new Map<number, Set<number>>();
  depthFeatures.forEach((v, k) => {
    newMap.set(k, new Set([...v]));
  });
  return newMap;
};
