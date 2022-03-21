<script lang="ts">
  import type { PinnedTree, FavPinnedTree } from '../ForagerTypes';
  import type { Writable } from 'svelte/store';
  import type { FavoritesStoreValue } from '../../stores';
  import { FavoritesRow } from './FavoritesRow';
  import { onMount, onDestroy } from 'svelte';
  import deleteIcon from '../../imgs/icon-trash.svg?raw';

  // Component variables
  export let favTree: FavPinnedTree | null = null;
  export let favoritesStore: Writable<FavoritesStoreValue> | null = null;

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
  });

  const initView = () => {
    if (favTree && textAreaNode && favoritesStore) {
      favoriteRow = new FavoritesRow({ favTree, textAreaNode, favoritesStore });
    }

    initialized = true;
  };

  $: favTree &&
    textAreaNode &&
    favoritesStore &&
    mounted &&
    !initialized &&
    initView();
</script>

<style lang="scss">
  @import './FavoritesRow.scss';
</style>

<div class="tree">
  <div class="tree-left">
    <svg class="tree-svg" />
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
        <div class="svg-icon">
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
