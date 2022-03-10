<script lang='ts'>
  import { onMount } from 'svelte';
  import { TreeWindow } from './TreeWindow';
  import type { Writable } from 'svelte/store';
  import type { TreeWindowStoreValue } from '../../stores';
  import type { HierarchyJSON, TreeNode } from '../sunburst/SunburstTypes';

  // Component variables
  export let data: HierarchyJSON = null;
  export let featureMap: Map<number, string[]> = null;
  export let treeWindowStore: Writable<TreeWindowStoreValue> = null;

  let component: HTMLElement = null;
  let mounted = false;

  // View variables
  let treeWindow: TreeWindow = null;

  onMount(() => {
    mounted = true;
  });

  const treeWindowUpdated = () => {
    treeWindow = treeWindow;
  };

  const initView = () => {
    if (component && data) {
      const treeMap = data.treeMap;

      // Convert treeMap into a real Map
      const treeMapMap = new Map<number, [TreeNode, number]>();
      Object.keys(treeMap.map).forEach(k => {
        treeMapMap.set(+k, treeMap.map[+k] as [TreeNode, number]);
      });

      treeWindow = new TreeWindow({ component, treeMapMap, featureMap,
        treeWindowStore, treeWindowUpdated });
    }
  };

  $: data && featureMap && treeWindowStore && mounted && component && initView();
</script>

<style lang='scss'>
  @import './TreeWindow.scss';
</style>

<div class='tree-window'
  bind:this={component}
  class:show={treeWindow?.treeWindowStoreValue.show}
>
  <div class='tree-header'>Tree {treeWindow?.treeWindowStoreValue.treeID}</div>
  <svg class='tree-svg'></svg>
</div>