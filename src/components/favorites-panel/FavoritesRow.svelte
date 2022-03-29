<script lang="ts">
  import type { PinnedTree, FavPinnedTree } from '../TimberTypes';
  import type { Writable } from 'svelte/store';
  import type { FavoritesStoreValue, PinnedTreeStoreValue } from '../../stores';
  import { FavoritesRow } from './FavoritesRow';
  import { onMount, onDestroy } from 'svelte';
  import deleteIcon from '../../imgs/icon-trash.svg?raw';

  // Component variables
  export let favTree: FavPinnedTree | null = null;
  export let favoritesStore: Writable<FavoritesStoreValue> | null = null;
  export let pinnedTreeStore: Writable<PinnedTreeStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let textAreaNode: HTMLElement | null = null;
  let mounted = false;
  let initialized = false;
  let favoriteRow: FavoritesRow | null = null;

  onMount(() => {
    mounted = true;
  });

  onDestroy(() => {
    // Unsubscribe the favorites store
    favoriteRow?.favoritesStoreUnsubscriber();
    favoriteRow?.PinnedTreeStoreValueUnsubscriber();
  });

  const initView = () => {
    if (
      favTree &&
      textAreaNode &&
      component &&
      favoritesStore &&
      pinnedTreeStore
    ) {
      favoriteRow = new FavoritesRow({
        favTree,
        component,
        textAreaNode,
        favoritesStore,
        pinnedTreeStore
      });
    }

    initialized = true;
  };

  $: favTree &&
    textAreaNode &&
    component &&
    favoritesStore &&
    pinnedTreeStore &&
    mounted &&
    !initialized &&
    initView();
</script>

<style lang="scss">
  @import './FavoritesRow.scss';
</style>

<div class="tree" bind:this={component}>
  <div class="tree-left">
    <svg class="tree-svg" on:click={e => favoriteRow?.thumbnailClicked(e)} />
  </div>

  <div class="tree-right">
    <div class="tree-info">
      <div class="tree-info-left">
        <span class="tree-name"
          >Tree {favoriteRow?.favTree.pinnedTree.treeID}</span
        >
        <span class="tree-metric"
          >({favoriteRow?.favTree.pinnedTree.treeMetric})</span
        >
      </div>

      <div class="tree-info-right">
        <div class="svg-icon" on:click={e => favoriteRow?.deleteClicked(e)}>
          {@html deleteIcon}
        </div>
      </div>
    </div>

    <div class="tree-note">
      {#if favTree !== null}
        <textarea
          bind:this={textAreaNode}
          class="note-window-input"
          name="note-input"
          placeholder="Leave a comment."
          on:input={e => favoriteRow.noteChanged(e)}
          bind:value={favTree.pinnedTree.note}
        />
      {/if}
    </div>
  </div>
</div>
