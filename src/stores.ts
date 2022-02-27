import { writable, Writable } from 'svelte/store';

export interface AppearanceStoreValue {
  shown: boolean;
}

export const getAppearanceStore = () => {
  const curStore: Writable<AppearanceStoreValue> = writable({
    shown: false
  });

  return curStore;
};
