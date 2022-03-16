<script lang="ts">
  import { onMount } from 'svelte';
  import { PinnedTreeWindow } from './PinnedTreeWindow';
  import type { Writable } from 'svelte/store';
  import type { PinnedTreeStoreValue } from '../../stores';
  import type { HierarchyJSON, PinnedTree } from '../ForagerTypes';
  import iconCloseCircle from '../../imgs/icon-close-circle.svg?raw';
  import iconHeartCircle from '../../imgs/icon-heart-circle.svg?raw';
  import iconHeartCircleClicked from '../../imgs/icon-heart-circle-clicked.svg?raw';

  // Component variables
  export let pinnedTree: PinnedTree | null = null;
  export let pinnedTreeStore: Writable<PinnedTreeStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;

  // View variables
  let pinnedTreeWindow: PinnedTreeWindow | null = null;
  let initialized = false;

  onMount(() => {
    mounted = true;
  });

  const pinnedTreeWindowUpdated = () => {
    pinnedTreeWindow = pinnedTreeWindow;
  };

  const initView = () => {
    initialized = true;
    if (component && pinnedTree && pinnedTreeStore) {
      pinnedTreeWindow = new PinnedTreeWindow({
        component,
        pinnedTree,
        pinnedTreeStore,
        pinnedTreeWindowUpdated
      });
    }
  };

  $: pinnedTree &&
    mounted &&
    component &&
    pinnedTreeStore &&
    !initialized &&
    initView();
</script>

<style lang="scss">
  @import './PinnedTreeWindow.scss';
</style>

<div
  class="pinned-tree-window"
  bind:this={component}
  class:hidden={pinnedTreeWindow?.hidden}
  style={pinnedTreeWindow?.getStyle()}
>
  <div
    class="tree-header"
    on:mousedown={e => pinnedTreeWindow?.headerMousedownHandler(e)}
    on:click={e => pinnedTreeWindow?.cancelEvent(e)}
  >
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
        on:mousedown={e => pinnedTreeWindow?.cancelEvent(e)}
      >
        {#if pinnedTreeWindow?.pinnedTree.isFav}
          <div class="svg-icon icon-heart" class:play-animation={false}>
            {@html iconHeartCircleClicked}
          </div>
        {:else}
          <div class="svg-icon">
            {@html iconHeartCircle}
          </div>
        {/if}
      </div>

      <div
        class="control-close"
        on:click={e => pinnedTreeWindow?.closeClicked(e)}
        on:mousedown={e => pinnedTreeWindow?.cancelEvent(e)}
      >
        <div class="svg-icon">
          {@html iconCloseCircle}
        </div>
      </div>
    </div>
  </div>

  <div
    class="content"
    on:mousedown={e => pinnedTreeWindow?.contentMousedownHandler(e)}
  >
    <svg class="tree-svg" />
  </div>
</div>
