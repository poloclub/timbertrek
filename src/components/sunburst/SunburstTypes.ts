export interface FeatureMap {
  [featureID: number]: string[];
}

export interface TreeNode {
  /**
   * Feature name
   */
  f: string;

  /**
   * Array of children
   */
  c: TreeNode[];
}

export interface TreeMap {
  /**
   * Number of trees
   */
  count: number;

  /**
   * A map from tree ID to the tree's hierarchy dict and accuracy
   */
  map: { [treeID: number]: [TreeNode, number] };
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
   * Tree ID
   * Only leaf node has this property
   */
  t?: number;
}

// Define the arc path generator
export interface ArcPartition extends d3.DefaultArcObject {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface HierarchyNode extends d3.HierarchyRectangularNode<unknown> {
  current?: d3.HierarchyRectangularNode<unknown>;
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
