<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getAppearanceStore,
    getSunburstStore,
    getTreeWindowStore
  } from '../../stores';
  import Toolbar from '../toolbar/Toolbar.svelte';
  import Sunburst from '../sunburst/Sunburst.svelte';
  import TreeWindow from '../tree-window/TreeWindow.svelte';
  import AppearancePanel from '../appearance-panel/AppearancePanel.svelte';
  import d3 from '../../utils/d3-import';
  import type { HierarchyJSON } from '../sunburst/SunburstTypes';

  let component: HTMLElement | null = null;

  // Load the data and pass to child components
  let data: HierarchyJSON | null | undefined = null;
  let featureMap: Map<number, string[]> = null;

  const initData = async () => {
    // Init the model
    data = await d3.json('/data/compas_rules_0.01_0.05.json');

    featureMap = new Map<number, string[]>();
    for (const [k, v] of Object.entries(data.featureMap)) {
      featureMap.set(parseInt(k), v as string[]);
    }
  };

  initData();

  // Construct stores
  const appearanceStore = getAppearanceStore();
  const sunburstStore = getSunburstStore();
  const treeWindowStore = getTreeWindowStore();

  onMount(() => {
    console.log('mounted!');
  });
</script>

<style lang="scss">
  @import './Forager.scss';
</style>

<div class="forager-page" bind:this={component}>
  <div class="forager">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">Forager</div>
        <div class="logo-tag">
          Identifying accurate decision trees that align with human knowledge
        </div>
      </div>
    </div>

    <div class="content">
      <div class="toolbar">
        <Toolbar {appearanceStore} {sunburstStore} />
      </div>

      <div class="sunburst">
        <Sunburst {data} {sunburstStore} {treeWindowStore} />
      </div>
    </div>

    <div class="sidebar">
      <AppearancePanel {appearanceStore} />
    </div>
  </div>

  <TreeWindow {data} {featureMap} {treeWindowStore} />

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
