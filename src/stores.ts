import { writable, Writable } from 'svelte/store';

export interface AppearanceStoreValue {
  shown: boolean;
}

export interface SunburstStoreValue {
  depthMax: number;
  depthLow: number;
  depthHigh: number;
  selectedFeature: string;
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
    selectedFeature: ''
  });

  return curStore;
};
