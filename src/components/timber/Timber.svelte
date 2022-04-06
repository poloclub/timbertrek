<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import {
    getFavoritesStore,
    getSunburstStore,
    getTreeWindowStore,
    getPinnedTreeStore,
    getPinnedTreeStoreDefaultValue,
    getSearchStore
  } from '../../stores';
  import Toolbar from '../toolbar/Toolbar.svelte';
  import Sunburst from '../sunburst/Sunburst.svelte';
  import TreeWindow from '../tree-window/TreeWindow.svelte';
  import PinnedTreeWindow from '../tree-window/PinnedTreeWindow.svelte';
  import FavoritesPanel from '../favorites-panel/FavoritesPanel.svelte';
  import SearchPanel from '../search-panel/SearchPanel.svelte';
  import Dropzone from '../dropzone/Dropzone.svelte';
  import d3 from '../../utils/d3-import';
  import type { HierarchyJSON, PinnedTree } from '../TimberTypes';
  import logoIcon from '../../imgs/timbertrek-logo.svg?raw';
  import githubIcon from '../../imgs/icon-github-2.svg?raw';
  import paperIcon from '../../imgs/icon-paper.svg?raw';

  let component: HTMLElement | null = null;

  // Load the data and pass to child components
  let data: HierarchyJSON | null | undefined = null;
  let featureMap: Map<number, string[]> | null = null;

  const initData = async () => {
    // Init the model
    data = await d3.json('/data/compas_rules_0.01_0.05.json');

    featureMap = new Map<number, string[]>();
    for (const [k, v] of Object.entries(data!.featureMap)) {
      featureMap.set(parseInt(k), v as string[]);
    }
  };

  /**
   * Listen to data update from the dropzone
   * @param dropzoneData Dropzone data
   */
  const initDataFromDropzone = (dropzoneData: HierarchyJSON) => {
    data = dropzoneData;
    featureMap = new Map<number, string[]>();
    for (const [k, v] of Object.entries(data.featureMap)) {
      featureMap.set(parseInt(k), v as string[]);
    }
  };

  // initData();

  // Construct stores
  const favoritesStore = getFavoritesStore();
  const sunburstStore = getSunburstStore();
  const treeWindowStore = getTreeWindowStore();
  const pinnedTreeStore = getPinnedTreeStore();
  const searchStore = getSearchStore();

  // Initialize the store
  let pinnedTreeStoreValue = getPinnedTreeStoreDefaultValue();
  pinnedTreeStore.subscribe(value => {
    pinnedTreeStoreValue = value;
  });

  onMount(() => {
    console.log('TimberTrek mounted!');
  });
</script>

<style lang="scss">
  @import './Timber.scss';
</style>

<div class="timbertrek-page" bind:this={component}>
  <div class="timbertrek">
    <div class="header">
      <div class="logo">
        <div class="svg-icon">
          {@html logoIcon}
        </div>
        <div class="logo-text">
          <div class="logo-icon">TimberTrek</div>
          <div class="logo-tag">
            Identifying decision trees that align with human knowledge
          </div>
        </div>
      </div>

      <div class="right-icons">
        <a
          class="svg-icon paper-icon"
          title="Research paper"
          target="_blank"
          href="https://arxiv.org/abs/1908.01755"
        >
          {@html paperIcon}
        </a>

        <a
          class="svg-icon"
          title="Open-source code"
          target="_blank"
          href="https://arxiv.org/abs/1908.01755"
        >
          {@html githubIcon}
        </a>
      </div>
    </div>

    <div class="content">
      {#if data === null}
        <Dropzone {initDataFromDropzone} />
      {:else}
        <div class="toolbar">
          <Toolbar {favoritesStore} {sunburstStore} {searchStore} />
        </div>

        <div class="sunburst">
          <Sunburst
            {data}
            {sunburstStore}
            {treeWindowStore}
            {pinnedTreeStore}
            {searchStore}
          />
        </div>
      {/if}
    </div>

    <div class="sidebar">
      <FavoritesPanel {favoritesStore} {pinnedTreeStore} />
    </div>

    <div class="sidebar">
      <SearchPanel {data} {searchStore} />
    </div>
  </div>

  <TreeWindow {data} {featureMap} {treeWindowStore} />

  {#each pinnedTreeStoreValue.pinnedTrees as pinnedTree (pinnedTree.treeID)}
    {#if pinnedTree.isPinned}
      <div class="pinned-tree-window-wrapper" out:fade={{ duration: 100 }}>
        <PinnedTreeWindow {pinnedTree} {pinnedTreeStore} {favoritesStore} />
      </div>
    {/if}
  {/each}

  <div class="dev-bar">
    <div
      class="button"
      on:click={() => {
        localStorage.clear();
      }}
    >
      localStorage.clear()
    </div>
  </div>
</div>
