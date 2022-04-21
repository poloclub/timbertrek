<script lang="ts">
  import { onMount } from 'svelte';
  import { ToolbarEventHandler } from './Toolbar';
  import type { Writable } from 'svelte/store';
  import type {
    FavoritesStoreValue,
    SunburstStoreValue,
    SearchStoreValue
  } from 'src/stores';

  import iconSearch from '../../imgs/icon-search.svg?raw';
  import iconHeart from '../../imgs/icon-heart.svg?raw';
  import iconHeartSolid from '../../imgs/icon-heart-solid.svg?raw';

  // Component variables
  // export let data: object | null = null;
  export let favoritesStore: Writable<FavoritesStoreValue> | null = null;
  export let sunburstStore: Writable<SunburstStoreValue> | null = null;
  export let searchStore: Writable<SearchStoreValue> | null = null;
  export let sunburstWidth = 650;

  let component: HTMLElement | null = null;
  let mounted = false;

  // Process SVG strings
  // const processedIconDepth = iconDepth.replaceAll('black', 'currentcolor');

  // Create the event handler object
  let handler: ToolbarEventHandler | null = null;

  onMount(() => {
    mounted = true;
  });

  const handlerUpdated = () => {
    handler = handler;
  };

  const initView = () => {
    if (favoritesStore && sunburstStore && searchStore) {
      handler = new ToolbarEventHandler(
        handlerUpdated,
        favoritesStore,
        sunburstStore,
        searchStore
      );
    }
  };

  $: favoritesStore && sunburstStore && searchStore && initView();
</script>

<style lang="scss">
  @import './Toolbar.scss';
</style>

<div class="toolbar" bind:this={component}>
  <div class="depths">
    <div class="depth-label">
      {sunburstWidth < 600 ? 'Depth' : 'Show Depth'}
    </div>

    <div class="depth-box-container">
      <div class="depth-box-lines">
        {#each [...Array(Math.max(handler?.sunburstStoreValue.depthMax - 1, 0)).keys()] as i}
          <div
            class="depth-line"
            class:in-range={i + 2 <= handler?.sunburstStoreValue.depthHigh &&
              i + 2 > handler?.sunburstStoreValue.depthLow}
          />
        {/each}
      </div>

      {#each [...Array(handler?.sunburstStoreValue.depthMax).keys()] as i}
        <div
          class="depth-box"
          class:in-range={i + 1 <= handler?.sunburstStoreValue.depthHigh &&
            i + 1 >= handler?.sunburstStoreValue.depthLow}
          class:no-hover={i + 1 === handler?.sunburstStoreValue.depthHigh}
          on:click={() => handler?.depthBoxClicked(i + 1)}
          style={handler?.getDepthBoxStyle(i + 1)}
        >
          {i + 1}
        </div>
      {/each}
    </div>
  </div>

  <div class="tools">
    <div
      class="tool-button"
      on:click={() => {
        handler?.favoritesClicked();
      }}
      class:shown={handler?.favoritesStoreValue.shown}
    >
      <span class="svg-icon">
        {@html iconHeart}
        <div class="hidden-heart" class:pulse={false}>
          {@html iconHeartSolid}
        </div>
      </span>
      <span
        class="button-text"
        class:no-display={handler?.sunburstStoreValue.depthMax > 8 &&
          sunburstWidth < 650}
      >
        Favorites
      </span>
    </div>

    <div
      class="tool-button"
      on:click={() => {
        handler?.searchClicked();
      }}
      class:shown={handler?.searchStoreValue.shown}
    >
      <span class="svg-icon">
        {@html iconSearch}
      </span>
      <span
        class="button-text"
        class:no-display={handler?.sunburstStoreValue.depthMax > 8 &&
          sunburstWidth < 650}
      >
        Search
      </span>
    </div>
  </div>
</div>
