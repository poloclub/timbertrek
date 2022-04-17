<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PinnedTreeWindow } from './PinnedTreeWindow';
  import type { Writable } from 'svelte/store';
  import type { PinnedTreeStoreValue, FavoritesStoreValue } from '../../stores';
  import type { HierarchyJSON, PinnedTree } from '../TimberTypes';
  import iconCloseCircle from '../../imgs/icon-close-circle.svg?raw';
  import iconHeartCircle from '../../imgs/icon-heart-circle.svg?raw';
  import iconNoteCircle from '../../imgs/icon-note-circle.svg?raw';
  import iconHeartCircleClicked from '../../imgs/icon-heart-circle-clicked.svg?raw';
  import iconNoteCircleClicked from '../../imgs/icon-note-circle-clicked.svg?raw';

  // Component variables
  export let pinnedTree: PinnedTree | null = null;
  export let pinnedTreeStore: Writable<PinnedTreeStoreValue> | null = null;
  export let favoritesStore: Writable<FavoritesStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;

  // View variables
  let pinnedTreeWindow: PinnedTreeWindow | null = null;
  let initialized = false;

  let initSwitchChecked = false;
  // Check the local storage to see the initial switch should be on or off
  if (localStorage.getItem('initSwitchChecked') === 'true') {
    initSwitchChecked = true;
  }

  onMount(() => {
    mounted = true;
  });

  onDestroy(() => {
    pinnedTreeWindow?.pinnedTreeStoreUnsubscriber();
    pinnedTreeWindow?.favoritesStoreUnsubscriber();
  });

  const pinnedTreeWindowUpdated = () => {
    pinnedTreeWindow = pinnedTreeWindow;
  };

  const initView = () => {
    initialized = true;
    if (component && pinnedTree && pinnedTreeStore && favoritesStore) {
      pinnedTreeWindow = new PinnedTreeWindow({
        component,
        pinnedTree,
        pinnedTreeStore,
        favoritesStore,
        pinnedTreeWindowUpdated,
        initSwitchChecked
      });
    }
  };

  /**
   * Trigger update in the favorite panel
   * @param e Event
   */
  const noteChanged = (e: MouseEvent) => {
    e.stopPropagation();
    favoritesStore?.update(value => value);
  };

  $: pinnedTree &&
    mounted &&
    component &&
    pinnedTreeStore &&
    favoritesStore &&
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
  class:jiggle={false}
  style={pinnedTreeWindow?.getStyle()}
>
  <div
    class="tree-header"
    on:mousedown={e => pinnedTreeWindow?.headerMousedownHandler(e)}
    on:click={e => pinnedTreeWindow?.cancelEvent(e)}
  >
    <div
      class="tree-info"
      title={`Tree ${pinnedTreeWindow?.pinnedTree.treeID} - Accuracy ${pinnedTreeWindow?.pinnedTree.treeMetric}`}
    >
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
        title="Add to my favorites"
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
        class="control-note"
        title="Leave a comment"
        on:click={e => pinnedTreeWindow?.noteClicked(e)}
        on:mousedown={e => {
          e.stopPropagation();
        }}
      >
        {#if pinnedTreeWindow?.pinnedTree.note === ''}
          <div class="svg-icon">
            {@html iconNoteCircle}
          </div>
        {:else}
          <div class="svg-icon">
            {@html iconNoteCircleClicked}
          </div>
        {/if}

        <div class="note-window" class:show={false} title="">
          <div
            class="input-wrapper"
            on:click={e => pinnedTreeWindow?.cancelEvent(e)}
          >
            {#if pinnedTreeWindow !== null}
              <textarea
                class="note-window-input"
                name="note-input"
                placeholder="Leave a comment."
                on:input={e => noteChanged(e)}
                bind:value={pinnedTreeWindow.pinnedTree.note}
              />
            {/if}
          </div>
        </div>
      </div>

      <div
        class="control-close"
        title="Close the window"
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

  <div class="control-footer">
    <button
      class="switch"
      aria-checked={initSwitchChecked ? 'true' : 'false'}
      title="Toggle to visualize sample size as node width"
      on:click={e => pinnedTreeWindow?.switchToggled(e)}
    >
      <label
        class="switch-label"
        for={`switch-${pinnedTreeWindow?.pinnedTree.treeID}`}
        >Scaled by sample size
      </label>
      <div
        class="switch-track"
        id={`switch-${pinnedTreeWindow?.pinnedTree.treeID}`}
      />
    </button>
  </div>
</div>
