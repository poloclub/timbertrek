/**
 * Custom types for TimberTrek
 */

export interface DragRegion {
  minLeft: number;
  maxLeft: number;
  minTop: number;
  maxTop: number;
}

/**
 * Where to put the label next to the node
 */
export enum LabelPos {
  left,
  middle,
  right
}

/**
 * Custom event for notebook message events
 */
export interface LabelPosition {
  x: number;
  y: number;
  pos: LabelPos;
  featureName: string;
  width: number;
  text: string;
  textLong: string;
  frontTextColor: string;
  backTextColor: string;
  index: number;
}

/**
 * Custom event for notebook message events
 */
export interface NotebookEvent extends Event {
  data: HierarchyJSON;
  width: number;
}

/**
 * Sets of selected tree IDs under three different filters
 */
export interface SelectedTrees {
  accuracy: Set<number>;
  minSample: Set<number>;
  height: Set<number>;
  depth: Set<number>;
  allFeature: Set<number>;
}

/**
 * Position of an object
 */
export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A workaround to enable bi-directional communication.
 */
export interface FavPinnedTree {
  pinnedTree: PinnedTree;
  pinnedTreeUpdated: () => void;
  getFeatureColor: (f: string) => string;
}

export interface PinnedTree {
  tree: TreeNode;
  treeMetric: number;
  treeID: number;
  x: number;
  y: number;
  startPos: Position;
  isFav: boolean;
  isPinned: boolean;
  note: string;
  jiggle: () => void;
}

export interface FeatureMap {
  [featureID: number]: string[];
}

export interface TreeNode {
  /**
   * Feature name, number of samples, number of correctly classified samples
   * If it is a non-leaf node, the number of correctly classified samples is -1
   */
  f: [string, number, number];

  /**
   * Array of children
   */
  c: TreeNode[];
}

export interface SankeyHierarchyPointNode
  extends d3.HierarchyPointNode<TreeNode> {
  width: number;
}

/**
 * A map from tree ID to the tree's hierarchy dict, objective, and accuracy
 */
export interface TreeMap {
  [treeID: number]: [TreeNode, number, number];
}

export interface HierarchyJSON {
  trie: RuleNode;

  /**
   * Map feature ID to [feature name, feature value]
   */
  featureMap: FeatureMap;

  treeMap: TreeMap;
}

export interface RuleNode {
  /**
   * Feature name
   */
  f: string;

  /**
   * Array of children
   */
  c: RuleNode[];

  /**
   * Unique id for each node
   *
   * This property does not come from the JSON file, need to be initialized
   */
  nid?: number;

  /**
   * Tree ID
   * Only leaf node has this property
   */
  t?: number;

  /**
   * If this leaf node is used. It is false if the corresponding tree is out of
   * user's selected range
   *
   * This property does not come from the JSON file, need to be initialized
   * when initializing the sunburst chart
   *
   * Only leaf node has this property
   */
  u?: boolean;
}

// Define the arc path generator
export interface ArcPartition extends d3.DefaultArcObject {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface ArcData {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  data: RuleNode;
}

export interface HierarchyNode extends d3.HierarchyRectangularNode<unknown> {
  previous?: ArcData;
  /** Number of unique trees in the descendants */
  treeNum: number;
  /** Temporary data of tree ides in the descendants, will be all null */
  uniqueTreeIDs: Set<number> | null;
  data: RuleNode;
}

export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ArcDomain {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface ArcDomainData extends ArcDomain {
  node: HierarchyNode;
  depthGap: number;
}

export interface FeatureInfo {
  name: string;
  value: string;
  nameValue: string;
  short: string;
  shortValue: string;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * This enum defines which feature to extract. The node can include two
 * features.
 */
export enum FeaturePosition {
  First,
  Second,
  Both
}

/**
 * Type of feature string encodings
 */
export enum FeatureValuePairType {
  PairArray,
  PairString
}

/**
 * Different layouts for drawing the text on an arc
 */
export enum TextArcMode {
  SectorArc,
  MidLine
}
