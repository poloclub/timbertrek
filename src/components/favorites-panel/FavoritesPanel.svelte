<script lang="ts">
  import FavoritesRow from './FavoritesRow.svelte';
  import { downloadClicked } from './FavoritesPanel';
  import type { FavoritesStoreValue, PinnedTreeStoreValue } from '../../stores';
  import {
    getFavoritesStoreDefaultValue,
    getPinnedTreeStoreDefaultValue
  } from '../../stores';
  import type { PinnedTree, FavPinnedTree } from '../ForagerTypes';
  import type { Writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import closeIcon from '../../imgs/icon-close.svg?raw';
  import downloadIcon from '../../imgs/icon-download.svg?raw';

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

  const closeClicked = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    favoritesStoreValue.shown = false;
    favoritesStore?.set(favoritesStoreValue);
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
      <div class="icons">
        <div
          class="svg-icon"
          on:click={e => downloadClicked(e, favoritesStoreValue)}
        >
          {@html downloadIcon}
        </div>
        <div class="svg-icon close-icon" on:click={closeClicked}>
          {@html closeIcon}
        </div>
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
