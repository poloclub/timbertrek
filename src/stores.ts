import { writable } from 'svelte/store';
import type {
  PinnedTree,
  TreeNode,
  FavPinnedTree
} from './components/ForagerTypes';

export interface FavoritesStoreValue {
  shown: boolean;
  favTrees: FavPinnedTree[];
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
    treeMap: new Map<number, [TreeNode, number]>(),
    treeID: 0,
    ancestorFs: [],
    show: false,
    x: 20,
    y: 20,
    getFeatureColor: null
  };
};

export const getPinnedTreeStoreDefaultValue = (): PinnedTreeStoreValue => {
  return {
    pinnedTrees: [],
    lastActiveTreeID: null,
    getFeatureColor: null
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
