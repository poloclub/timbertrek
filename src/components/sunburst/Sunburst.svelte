<script lang="ts">
  import { Sunburst } from './Sunburst';
  import { onMount } from 'svelte';
  import { config } from '../../config';
  import type { Writable } from 'svelte/store';
  import type {
    SunburstStoreValue,
    TreeWindowStoreValue,
    PinnedTreeStoreValue,
    SearchStoreValue
  } from '../../stores';
  import type { HierarchyJSON } from '../TimberTypes';

  // Component variables
  export let data: HierarchyJSON | null = null;
  export let sunburstStore: Writable<SunburstStoreValue> | null = null;
  export let treeWindowStore: Writable<TreeWindowStoreValue> | null = null;
  export let pinnedTreeStore: Writable<PinnedTreeStoreValue> | null = null;
  export let searchStore: Writable<SearchStoreValue> | null = null;
  export let initDepthGap = 2;

  let component: HTMLElement | null = null;
  let mounted = false;

  // View variables
  let sunburst: Sunburst | null = null;

  /**
   * Trigger svelte reactivity
   */
  const sunburstUpdated = () => {
    sunburst = sunburst;
  };

  onMount(() => {
    mounted = true;
  });

  const initView = () => {
    if (
      component &&
      data &&
      sunburstStore &&
      treeWindowStore &&
      searchStore &&
      pinnedTreeStore
    ) {
      sunburst = new Sunburst({
        component,
        data,
        initDepthGap,
        sunburstStore,
        treeWindowStore,
        pinnedTreeStore,
        searchStore,
        sunburstUpdated
      });
    }
  };

  $: data &&
    sunburstStore &&
    treeWindowStore &&
    pinnedTreeStore &&
    searchStore &&
    mounted &&
    component &&
    initView();
</script>

<style lang="scss">
  @import './Sunburst.scss';
</style>

<div class="sunburst" bind:this={component}>
  <div class="no-tree-message" class:show={sunburst?.curHeadNode.treeNum === 0}>
    <span>
      {'No tree meets the current constraints :('}
    </span>
    <span>
      {'Try to relax the filtering in the Search Panel'}
    </span>
  </div>
  <svg class="sunburst-svg" />
  <div
    class="stat-overlay"
    title={`There are ${sunburst?.curHeadNode.value} decision paths `.concat(
      `and ${sunburst?.curHeadNode.treeNum} decisions trees in the current selection.`
    )}
  >
    <span class="tree-stat">
      {sunburst?.curHeadNode.value === sunburst?.totalPathNum
        ? `${sunburst?.curHeadNode.value | 0}`
        : `${sunburst?.curHeadNode.value | 0}/${sunburst?.totalPathNum}`} paths</span
    >
    <span class="tree-stat">
      {sunburst?.curHeadNode.treeNum === sunburst?.totalTreeNum
        ? `${sunburst?.curHeadNode.treeNum | 0}`
        : `${sunburst?.curHeadNode.treeNum | 0}/${sunburst?.totalTreeNum}`} trees</span
    >
  </div>
</div>
