import type { PinnedTree, FavPinnedTree } from '../ForagerTypes';
import type { Writable } from 'svelte/store';
import { tick } from 'svelte';
import type { FavoritesStoreValue } from '../../stores';
import { getFavoritesStoreDefaultValue } from '../../stores';

export class FavoritesRow {
  favTree: FavPinnedTree;
  textAreaNode: HTMLElement;
  favoritesStore: Writable<FavoritesStoreValue>;
  favoritesStoreValue: FavoritesStoreValue;

  constructor({
    favTree,
    textAreaNode,
    favoritesStore
  }: {
    favTree: FavPinnedTree;
    textAreaNode: HTMLElement;
    favoritesStore: Writable<FavoritesStoreValue>;
  }) {
    this.favTree = favTree;
    this.textAreaNode = textAreaNode;

    this.favoritesStore = favoritesStore;
    this.favoritesStoreValue = getFavoritesStoreDefaultValue();
    this.favoritesStore.subscribe(value => {
      this.favoritesStoreValue = value;

      if (this.favoritesStoreValue.shown) {
        this.adjustTextAreaHeight();
      }
    });
  }

  /**
   * Adjust the height when content grows
   */
  adjustTextAreaHeight = async () => {
    await tick();
    this.textAreaNode.style.removeProperty('height');
    this.textAreaNode.style.height = `${this.textAreaNode.scrollHeight}px`;
  };

  /**
   * Triggers update in the pinned tree window view
   * @param e Event
   */
  noteChanged = (e: Event) => {
    e.stopPropagation();
    this.favTree.pinnedTreeUpdated();

    // Adjust the height when content grows
    this.adjustTextAreaHeight();
  };
}
