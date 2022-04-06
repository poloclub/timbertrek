<script lang="ts">
  import FavoritesRow from './FavoritesRow.svelte';
  import { downloadClicked } from './FavoritesPanel';
  import type { FavoritesStoreValue, PinnedTreeStoreValue } from '../../stores';
  import { getFavoritesStoreDefaultValue } from '../../stores';
  import type { Writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import closeIcon from '../../imgs/icon-close.svg?raw';
  import downloadIcon from '../../imgs/icon-download.svg?raw';
  import heartDemoIcon from '../../imgs/icon-heart-circle.svg?raw';

  // Component variables
  export let favoritesStore: Writable<FavoritesStoreValue> | null = null;
  export let pinnedTreeStore: Writable<PinnedTreeStoreValue> | null = null;
  export let width = 650;

  let component: HTMLElement | null = null;
  let mounted = false;
  let initialized = false;

  let favoritesStoreValue = getFavoritesStoreDefaultValue();

  onMount(() => {
    mounted = true;
  });

  const initView = () => {
    if (favoritesStore && pinnedTreeStore) {
      favoritesStore.subscribe(value => {
        favoritesStoreValue = value;
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
  style={`max-height: ${width}px;`}
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
    {#if favoritesStoreValue.favTrees.length === 0}
      <div class="tree-placeholder">
        <div class="tree-placeholder-text">
          Click the heart button <span class="svg-icon"
            >{@html heartDemoIcon}</span
          > on tree windows to add favorite trees.
        </div>
      </div>
    {:else}
      <div class="tree-list">
        {#each favoritesStoreValue.favTrees as favTree (favTree.pinnedTree.treeID)}
          <div
            class="tree-wrapper"
            animate:flip={{ duration: 300 }}
            out:fade={{ duration: 200 }}
          >
            <FavoritesRow {favTree} {favoritesStore} {pinnedTreeStore} />
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
