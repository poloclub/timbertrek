<script lang="ts">
  import { onMount } from 'svelte';
  import { PinnedTreeWindow } from './PinnedTreeWindow';
  import type { Writable } from 'svelte/store';
  import type { TreeWindowStoreValue } from '../../stores';
  import type { HierarchyJSON, PinnedTree } from '../ForagerTypes';
  import iconCloseCircle from '../../imgs/icon-close-circle.svg?raw';
  import iconHeartCircle from '../../imgs/icon-heart-circle.svg?raw';
  import iconHeartCircleClicked from '../../imgs/icon-heart-circle-clicked.svg?raw';

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
      pinnedTreeWindow = new PinnedTreeWindow({
        component,
        pinnedTree,
        pinnedTreeWindowUpdated
      });
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
    <div class="tree-info">
      <span class="tree-name">
        Tree {pinnedTreeWindow?.pinnedTree.treeID}
      </span>

      <span class="tree-acc">
        ({pinnedTreeWindow?.pinnedTree.treeMetric})
      </span>
    </div>

    <div class="control-buttons">
      <div
        class="control-fav"
        on:click={e => pinnedTreeWindow?.heartClicked(e)}
      >
        {#if pinnedTreeWindow?.pinnedTree.isFav}
          <div class="svg-icon icon-heart">
            {@html iconHeartCircleClicked}
          </div>
        {:else}
          <div class="svg-icon">
            {@html iconHeartCircle}
          </div>
        {/if}
      </div>

      <div class="control-close">
        <div class="svg-icon">
          {@html iconCloseCircle}
        </div>
      </div>
    </div>
  </div>

  <div class="content">
    <svg class="tree-svg" />
  </div>
</div>
