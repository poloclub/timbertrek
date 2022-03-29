<script lang="ts">
  import { onMount } from 'svelte';
  import { TreeWindow } from './TreeWindow';
  import type { Writable } from 'svelte/store';
  import type { TreeWindowStoreValue } from '../../stores';
  import type { HierarchyJSON, TreeNode } from '../TimberTypes';
  import iconClick from '../../imgs/icon-click.svg?raw';

  // Component variables
  export let data: HierarchyJSON | null = null;
  export let featureMap: Map<number, string[]> | null = null;
  export let treeWindowStore: Writable<TreeWindowStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;

  // View variables
  let treeWindow: TreeWindow | null = null;

  onMount(() => {
    mounted = true;
  });

  const treeWindowUpdated = () => {
    treeWindow = treeWindow;
  };

  const initView = () => {
    if (component && data && featureMap && treeWindowStore) {
      const treeMap = data.treeMap;

      // Convert treeMap into a real Map
      const treeMapMap = new Map<number, [TreeNode, number, number]>();
      Object.keys(treeMap).forEach(k => {
        treeMapMap.set(+k, treeMap[+k] as [TreeNode, number, number]);
      });

      treeWindow = new TreeWindow({
        component,
        treeMapMap,
        featureMap,
        treeWindowStore,
        treeWindowUpdated
      });
    }
  };

  $: data &&
    featureMap &&
    treeWindowStore &&
    mounted &&
    component &&
    initView();
</script>

<style lang="scss">
  @import './TreeWindow.scss';
</style>

<div
  class="tree-window"
  bind:this={component}
  class:show={treeWindow?.treeWindowStoreValue.show}
  style={treeWindow?.getStyle()}
>
  <div class="tree-header">
    <span class="tree-name">
      Tree {treeWindow?.treeWindowStoreValue.treeID}
    </span>

    <span class="tree-acc"> ({treeWindow?.treeMetric}) </span>
  </div>

  <div class="content">
    <div
      class="label-container"
      class:no-display={treeWindow?.shouldHidePinLabel()}
    >
      <div class="label">
        <div class="svg-icon">
          {@html iconClick}
        </div>
        <span>pin</span>
      </div>
    </div>

    <svg class="tree-svg" />
  </div>
</div>
