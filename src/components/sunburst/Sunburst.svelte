<script lang="ts">
  import { Sunburst } from './Sunburst';
  import { onMount } from 'svelte';
  import { config } from '../../config';
  import type { Writable } from 'svelte/store';
  import type { SunburstStoreValue, TreeWindowStoreValue } from '../../stores';
  import type { HierarchyJSON } from './SunburstTypes';

  // Component variables
  export let data: HierarchyJSON | null = null;
  export let sunburstStore: Writable<SunburstStoreValue> | null = null;
  export let treeWindowStore: Writable<TreeWindowStoreValue> | null = null;

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
    if (component && data && sunburstStore && treeWindowStore) {
      sunburst = new Sunburst({
        component,
        data,
        sunburstStore,
        treeWindowStore,
        width,
        height
      });
    }
  };

  $: data &&
    sunburstStore &&
    treeWindowStore &&
    mounted &&
    component &&
    initView();
</script>

<style lang="scss">
  @import './Sunburst.scss';
</style>

<div class="sunburst" bind:this={component}>
  <svg class="sunburst-svg" />
</div>
