<script lang="ts">
  import type { FavoritesStoreValue, PinnedTreeStoreValue } from '../../stores';
  import {
    getFavoritesStoreDefaultValue,
    getPinnedTreeStoreDefaultValue
  } from '../../stores';
  import type { PinnedTree, FavPinnedTree } from '../ForagerTypes';
  import type { Writable } from 'svelte/store';
  import { onMount } from 'svelte';

  // Component variables
  export let favoritesStore: Writable<FavoritesStoreValue> | null = null;
  export let pinnedTreeStore: Writable<PinnedTreeStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;
  let initialized = false;

  let favoritesStoreValue = getFavoritesStoreDefaultValue();
  let pinnedTreeStoreValue = getPinnedTreeStoreDefaultValue();

  onMount(() => {
    mounted = true;
  });

  /**
   * Triggers update in the pinned tree window view
   * @param e Event
   * @param favPinnedTree Current favPinnedTree
   */
  const noteChanged = (e: Event, favPinnedTree: FavPinnedTree) => {
    e.stopPropagation();
    favPinnedTree.pinnedTreeUpdated();
  };

  const initView = () => {
    if (favoritesStore && pinnedTreeStore) {
      favoritesStore.subscribe(value => {
        favoritesStoreValue = value;
      });

      pinnedTreeStore.subscribe(value => {
        pinnedTreeStoreValue = value;
      });
    }

    initialized = true;
  };

  $: favoritesStore && pinnedTreeStore && mounted && !initialized && initView();
</script>

<style lang="scss">
  @import './FavoritesPanel.scss';
</style>

<div
  class="favorites-panel"
  bind:this={component}
  class:shown={favoritesStoreValue.shown}
>
  <div class="header">My Favorite Trees</div>

  {#if initialized}
    <div class="tree-list">
      {#each favoritesStoreValue.favTrees as favTree (favTree.pinnedTree.treeID)}
        <div class="tree">
          <div class="tree-left">
            <svg class="tree-svg" />
          </div>
          <div class="tree-right">
            <div class="tree-info">
              <span class="tree-name">Tree {favTree.pinnedTree.treeID}</span>
              <span class="tree-metric">{favTree.pinnedTree.treeMetric}</span>
            </div>
            <div class="tree-note">
              <textarea
                class="note-window-input"
                name="note-input"
                placeholder="Leave a comment."
                on:input={e => noteChanged(e, favTree)}
                bind:value={favTree.pinnedTree.note}
              />
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
