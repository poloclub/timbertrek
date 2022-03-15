<script lang="ts">
  import { onMount } from 'svelte';
  import { PinnedTreeWindow } from './PinnedTreeWindow';
  import type { Writable } from 'svelte/store';
  import type { TreeWindowStoreValue } from '../../stores';
  import type { HierarchyJSON, PinnedTree } from '../ForagerTypes';
  import iconClick from '../../imgs/icon-click.svg?raw';

  // Component variables
  export let pinnedTree: PinnedTree | null = null;
  // export let treeWindowStore: Writable<TreeWindowStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;

  // View variables
  let pinnedTreeWindow: PinnedTreeWindow | null = null;

  onMount(() => {
    mounted = true;
  });

  const pinnedTreeWindowUpdated = () => {
    pinnedTreeWindow = pinnedTreeWindow;
  };

  const initView = () => {
    if (component && pinnedTree) {
      pinnedTreeWindow = new PinnedTreeWindow({ component, pinnedTree });
    }
  };

  $: pinnedTree && mounted && component && initView();
</script>

<style lang="scss">
  @import './PinnedTreeWindow.scss';
</style>

<div
  class="pinned-tree-window"
  bind:this={component}
  style={pinnedTreeWindow?.getStyle()}
>
  <div class="tree-header">
    <span class="tree-name">
      Tree {pinnedTree?.treeID}
    </span>

    <span class="tree-acc"> ({pinnedTree?.treeMetric}) </span>
  </div>

  <div class="content">
    <svg class="tree-svg" />
  </div>
</div>
