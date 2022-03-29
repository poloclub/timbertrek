<script lang="ts">
  import { Sunburst } from './Sunburst';
  import { onMount } from 'svelte';
  import { config } from '../../config';
  import type { Writable } from 'svelte/store';
  import type {
    SunburstStoreValue,
    TreeWindowStoreValue,
    PinnedTreeStoreValue
  } from '../../stores';
  import type { HierarchyJSON } from '../TimberTypes';

  // Component variables
  export let data: HierarchyJSON | null = null;
  export let sunburstStore: Writable<SunburstStoreValue> | null = null;
  export let treeWindowStore: Writable<TreeWindowStoreValue> | null = null;
  export let pinnedTreeStore: Writable<PinnedTreeStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;

  // View variables
  const width = config.layout.sunburstWidth;
  const height = config.layout.sunburstWidth;
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
      pinnedTreeStore
    ) {
      sunburst = new Sunburst({
        component,
        data,
        sunburstStore,
        treeWindowStore,
        pinnedTreeStore,
        sunburstUpdated,
        width,
        height
      });
    }
  };

  $: data &&
    sunburstStore &&
    treeWindowStore &&
    pinnedTreeStore &&
    mounted &&
    component &&
    initView();
</script>

<style lang="scss">
  @import './Sunburst.scss';
</style>

<div class="sunburst" bind:this={component}>
  <svg class="sunburst-svg" />
  <div
    class="stat-overlay"
    title={`There are ${sunburst?.curHeadNode.value} decision paths `.concat(
      `and ${sunburst?.curHeadNode.treeNum} decisions trees in the current selection.`
    )}
  >
    <span class="rule-stat">{sunburst?.curHeadNode.value | 0} paths</span>
    <span class="tree-stat">{sunburst?.curHeadNode.treeNum | 0} trees</span>
  </div>
</div>
