<script lang="ts">
  import FavoritesRow from './FavoritesRow.svelte';
  import type { FavoritesStoreValue, PinnedTreeStoreValue } from '../../stores';
  import {
    getFavoritesStoreDefaultValue,
    getPinnedTreeStoreDefaultValue
  } from '../../stores';
  import type { PinnedTree, FavPinnedTree } from '../ForagerTypes';
  import type { Writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import closeIcon from '../../imgs/icon-close-outline.svg?raw';

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
  <div class="header">
    <div class="header-title">
      <div class="title">My Favorite Trees</div>
      <div class="svg-icon">
        {@html closeIcon}
      </div>
    </div>
  </div>

  {#if initialized}
    <div class="tree-list">
      {#each favoritesStoreValue.favTrees as favTree (favTree.pinnedTree.treeID)}
        <div class="tree-wrapper">
          <FavoritesRow {favTree} {favoritesStore} />
        </div>
      {/each}
    </div>
  {/if}
</div>
