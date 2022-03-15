import d3 from '../../utils/d3-import';
import { round } from '../../utils/utils';
import type { Writable } from 'svelte/store';
import type { TreeNode, Point, Padding } from '../ForagerTypes';
import type { PinnedTreeStoreValue } from '../../stores';
import { getPinnedTreeStoreDefaultValue } from '../../stores';

export class Forager {
  pinnedTreeStore: Writable<PinnedTreeStoreValue>;
  pinnedTreeStoreValue: PinnedTreeStoreValue;

  foragerUpdated: () => void;

  constructor(
    pinnedTreeStore: Writable<PinnedTreeStoreValue>,
    foragerUpdated: () => void
  ) {
    this.pinnedTreeStore = pinnedTreeStore;
    this.pinnedTreeStoreValue = getPinnedTreeStoreDefaultValue();
    this.foragerUpdated = foragerUpdated;

    this.#initPinnedTreeStore();
  }

  #initPinnedTreeStore() {
    this.pinnedTreeStore.subscribe(value => {
      this.pinnedTreeStoreValue = value;
      this.foragerUpdated();
    });
  }
}
