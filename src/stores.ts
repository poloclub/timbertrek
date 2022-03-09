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
}

/**
 * Actions that needed to be handled
 */
export enum SunburstAction {
  DepthChanged,
  None = ''
}

/**
 * Factory function for AppearanceStore
 * @returns AppearanceStore
 */
export const getAppearanceStore = () => {
  const curStore: Writable<AppearanceStoreValue> = writable({
    shown: false
  });

  return curStore;
};

export const getSunburstStore = () => {
  const curStore: Writable<SunburstStoreValue> = writable({
    depthMax: 0,
    depthLow: 0,
    depthHigh: 0,
    depthColors: [],
    action: SunburstAction.None
  });

  return curStore;
};

export const getTreeWindowStore = () => {
  const curStore: Writable<TreeWindowStoreValue> = writable({
    featureMap: new Map<number, string[]>(),
    treeID: 0,
    show: false
  });

  return curStore;
};
