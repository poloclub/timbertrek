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
  import type { HierarchyJSON } from '../ForagerTypes';

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
  <div class="stat-overlay">
    <span class="rule-stat">2533 paths</span>
    <span class="tree-stat">3233 trees</span>
  </div>
</div>
