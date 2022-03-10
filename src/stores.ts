import { writable, Writable } from 'svelte/store';

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
  treeID: number;
  show: boolean;
  getFeatureColor: null | ((f: string) => string);
}

/**
 * Actions that needed to be handled
 */
export enum SunburstAction {
  DepthChanged,
  None = ''
}

export const getAppearanceStoreDefaultValue = () => {
  return {
    shown: false
  };
};

export const getSunburstStoreDefaultValue = () => {
  return {
    depthMax: 0,
    depthLow: 0,
    depthHigh: 0,
    depthColors: [],
    action: SunburstAction.None
  };
};

export const getTreeWindowStoreDefaultValue = () => {
  return {
    featureMap: new Map<number, string[]>(),
    treeID: 0,
    show: false,
    getFeatureColor: null
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
