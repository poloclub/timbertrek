import { writable } from 'svelte/store';
import type { PinnedTree, TreeNode, Point } from './components/ForagerTypes';

export interface AppearanceStoreValue {
  shown: boolean;
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
  treeMap: Map<number, [TreeNode, number]>;
  treeID: number;
  ancestorFs: string[];
  show: boolean;
  x: number;
  y: number;
  getFeatureColor: null | ((f: string) => string);
}

export interface PinnedTreeStoreValue {
  pinnedTrees: PinnedTree[];
  startPoint: Point;
}

/**
 * Actions that needed to be handled
 */
export enum SunburstAction {
  DepthChanged,
  None = ''
}

export const getAppearanceStoreDefaultValue = (): AppearanceStoreValue => {
  return {
    shown: false
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
    startPoint: {
      x: 20,
      y: 20
    }
  };
};

/**
 * Factory function for AppearanceStore
 * @returns AppearanceStore
 */
export const getAppearanceStore = () => {
  return writable(getAppearanceStoreDefaultValue());
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
