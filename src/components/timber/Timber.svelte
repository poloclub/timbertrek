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
  import type { HierarchyJSON, NotebookEvent } from '../TimberTypes';
  import logoIcon from '../../imgs/timbertrek-logo.svg?raw';
  import githubIcon from '../../imgs/icon-github-2.svg?raw';
  import paperIcon from '../../imgs/icon-paper.svg?raw';

  export let notebookMode = false;
  export let curDataset = 'compas';
  export let timbertrekTransitioning = false;

  let component: HTMLElement | null = null;
  let initialized = false;
  let mounted = false;
  let initDepthGap = 2;

  // Load the data and pass to child components
  let data: HierarchyJSON | null | undefined = null;
  let featureMap: Map<number, string[]> | null = null;

  let sunburstWidth = notebookMode ? 500 : 650;
  const devMode = false;

  // Map of pre-included rashomon sets
  const datasetMap = new Map<string, string>();
  datasetMap.set('compas', 'compas-rules-mul_0.05-reg_0.01.json');
  datasetMap.set('fico', 'fico-rules-mul_0.05-reg_0.01.json');
  datasetMap.set('car evaluation', 'car-rules-mul_0.15-reg_0.015.json');
  datasetMap.set('my own set', '');

  /**
   * Init data and feature map
   * @param loadedData Loaded HierarchyJSON data
   */
  const initData = (loadedData: HierarchyJSON) => {
    data = loadedData;
    featureMap = new Map<number, string[]>();
    for (const [k, v] of Object.entries(data.featureMap)) {
      featureMap.set(parseInt(k), v as string[]);
    }
  };

  /**
   * Load the data file from /public
   */
  const readDataFromFile = async (curDataset: string) => {
    // Init the model
    // const modelFile = 'compas-rules-mul_0.05-reg_0.01.json';
    // const modelFile = 'fico-rules-mul_0.05-reg_0.01.json';
    // const modelFile = 'car-rules-mul_0.15-reg_0.015.json';
    // const modelFile = 'car-rules-mul_0.15-reg_0.02.json';
    // const modelFile = 'car-rules-mul_0.1-reg_0.01.json';
    // const modelFile = 'car-rules-mul_0.05-reg_0.005.json';
    if (curDataset === 'my own dataset') return;
    if (curDataset === 'car evaluation') {
      initDepthGap = 4;
    } else {
      initDepthGap = 2;
    }
    if (datasetMap.has(curDataset)) {
      initialized = true;
      const modelFile = datasetMap.get(curDataset)!;
      const loadedData = await d3.json(
        `${import.meta.env.BASE_URL}data/${modelFile}`
      );
      initData(loadedData as HierarchyJSON);
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
    if (notebookMode) {
      // Listen to the iframe message events
      document.addEventListener('timbertrekData', (e: Event) => {
        const notebookEvent = e as NotebookEvent;
        const loadedData = notebookEvent.data;
        sunburstWidth = notebookEvent.width;
        initData(loadedData);
      });
    }
    mounted = true;
  });

  $: !notebookMode &&
    curDataset &&
    !initialized &&
    mounted &&
    !timbertrekTransitioning &&
    (() => readDataFromFile(curDataset))();
</script>

<style lang="scss">
  @import './Timber.scss';
</style>

<div class="timbertrek-page" bind:this={component}>
  <div class="timbertrek" style={`width: ${sunburstWidth}px;`}>
    <div class="header">
      <div class="logo">
        <div class="svg-icon">
          {@html logoIcon}
        </div>
        <div class="logo-text">
          <div class="logo-icon">TimberTrek</div>
          <div
            class="logo-tag"
            title="Curating decision trees that align with human knowledge"
            class:no-display={sunburstWidth < 400}
          >
            Curating decision trees that align with human knowledge
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
        <Dropzone {initDataFromDropzone} width={sunburstWidth} {curDataset} />
      {:else}
        <div class="toolbar">
          <Toolbar
            {favoritesStore}
            {sunburstStore}
            {searchStore}
            {sunburstWidth}
          />
        </div>

        <div class="sunburst-wrapper">
          <Sunburst
            {data}
            {initDepthGap}
            {sunburstStore}
            {treeWindowStore}
            {pinnedTreeStore}
            {searchStore}
          />
        </div>
      {/if}
    </div>

    <div class="sidebar">
      <FavoritesPanel
        {favoritesStore}
        {pinnedTreeStore}
        width={sunburstWidth}
      />
    </div>

    <div class="sidebar">
      <SearchPanel {data} {searchStore} width={sunburstWidth} />
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

  {#if devMode}
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
  {/if}
</div>
