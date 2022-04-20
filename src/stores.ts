import { writable } from 'svelte/store';
import type {
  PinnedTree,
  TreeNode,
  FavPinnedTree,
  FeatureInfo,
  SelectedTrees
} from './components/TimberTypes';

export interface FavoritesStoreValue {
  shown: boolean;
  favTrees: FavPinnedTree[];
}

export interface SearchStoreValue {
  shown: boolean;
  curAccuracyLow: number;
  curAccuracyHigh: number;
  curMinSampleLow: number;
  curMinSampleHigh: number;
  curHeightRange: Set<number>;
  /**
   * Mapping from depth ID to a set of feature IDs
   */
  curDepthFeatures: Map<number, Set<number>>;
  curAllFeatures: Set<number>;
  /**
   * Mapping tree id to a map between depth and features used at that depth
   */
  treeDepthFeaturesMap: Map<number, Map<number, Set<number>>> | null;
  treeHeightMap: Map<number, number> | null;
  treeMinSampleMap: Map<number, number> | null;
  featureMap: Map<number, string[]>;
  getFeatureColor: null | ((f: string) => string);
  featureOrder: number[];
  updatePlots:
    | null
    | ((selectedTrees: SelectedTrees, animation: boolean) => void);
}

export interface SunburstStoreValue {
  depthMax: number;
  depthLow: number;
  depthHigh: number;
  depthColors: string[];
  action: SunburstAction;
}

export interface TreeWindowStoreValue {
  featureMap: Map<number, string[]>;
  treeMap: Map<number, [TreeNode, number, number]>;
  treeID: number;
  ancestorFs: string[];
  show: boolean;
  x: number;
  y: number;
  getFeatureColor: null | ((f: string) => string);
}

export interface PinnedTreeStoreValue {
  pinnedTrees: PinnedTree[];
  /**
   * Index of the last focused pinned tree in the pinnedTrees array
   */
  lastActiveTreeID: number | null;
  getFeatureColor: null | ((f: string) => string);
  getFeatureInfo: null | ((f: string) => FeatureInfo);
}

/**
 * Actions that needed to be handled
 */
export enum SunburstAction {
  DepthChanged,
  None = ''
}

export const getFavoritesStoreDefaultValue = (): FavoritesStoreValue => {
  return {
    shown: false,
    favTrees: []
  };
};

export const getSunburstStoreDefaultValue = (): SunburstStoreValue => {
  return {
    depthMax: 0,
    depthLow: 0,
    depthHigh: 0,
    depthColors: [],
    action: SunburstAction.None
  };
};

export const getTreeWindowStoreDefaultValue = (): TreeWindowStoreValue => {
  return {
    featureMap: new Map<number, string[]>(),
    treeMap: new Map<number, [TreeNode, number, number]>(),
    treeID: 0,
    ancestorFs: [],
    show: false,
    x: 20,
    y: 20,
    getFeatureColor: null
  };
};

export const getSearchStoreDefaultValue = (): SearchStoreValue => {
  return {
    shown: false,
    curAccuracyLow: 0,
    curAccuracyHigh: 1,
    curMinSampleLow: 0,
    curMinSampleHigh: 100,
    curHeightRange: new Set<number>([]),
    curDepthFeatures: new Map<number, Set<number>>(),
    curAllFeatures: new Set<number>([]),
    treeDepthFeaturesMap: null,
    treeHeightMap: null,
    treeMinSampleMap: null,
    featureMap: new Map<number, string[]>(),
    getFeatureColor: null,
    featureOrder: [],
    updatePlots: null
  };
};

export const getPinnedTreeStoreDefaultValue = (): PinnedTreeStoreValue => {
  return {
    pinnedTrees: [],
    lastActiveTreeID: null,
    getFeatureColor: null,
    getFeatureInfo: null
  };
};

/**
 * Factory function for FavoritesStore
 * @returns FavoritesStore
 */
export const getFavoritesStore = () => {
  return writable(getFavoritesStoreDefaultValue());
};

export const getSunburstStore = () => {
  return writable(getSunburstStoreDefaultValue());
};

export const getTreeWindowStore = () => {
  return writable(getTreeWindowStoreDefaultValue());
};

export const getPinnedTreeStore = () => {
  return writable(getPinnedTreeStoreDefaultValue());
};

export const getSearchStore = () => {
  return writable(getSearchStoreDefaultValue());
};
