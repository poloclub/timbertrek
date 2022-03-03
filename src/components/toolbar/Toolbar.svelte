<script lang='ts'>
  import { onMount } from 'svelte';
  import { preProcessSVG } from '../../utils/utils';
  import { ToolbarEventHandler } from './Toolbar';
  import type { Writable } from 'svelte/store';
  import type { AppearanceStoreValue, SunburstStoreValue } from 'src/stores';

  import iconBrush from '../../imgs/icon-brush.svg?raw';
  import iconSearch from '../../imgs/icon-search.svg?raw';
  import iconStar from '../../imgs/icon-star.svg?raw';

  // Component variables
  // export let data: object | null = null;
  export let appearanceStore: Writable<AppearanceStoreValue> = null;
  export let sunburstStore: Writable<SunburstStoreValue> = null;

  let component: HTMLElement | null = null;
  let mounted = false;

  // Process SVG strings
  // const processedIconDepth = iconDepth.replaceAll('black', 'currentcolor');

  // Create the event handler object
  let handler: ToolbarEventHandler = null;

  onMount(() => {
    mounted = true;
  });

  const handlerUpdated = () => {
    handler = handler;
  };

  const initView = () => {
    handler = new ToolbarEventHandler(handlerUpdated, appearanceStore,
      sunburstStore
    );
  };

  $: appearanceStore && initView();
</script>

<style lang='scss'>
  @import './Toolbar.scss';
</style>

<div class='toolbar' bind:this={component}>

  <div class='depths'>
    <div class='depth-label'>
      Show Depth
    </div>

    <div class='depth-box-container'>
      <div class='depth-box-lines'>
        {#each [...Array(Math.max(handler?.sunburstStoreValue.depthMax - 1, 0)).keys()] as i}
          <div class='depth-line'
            class:in-range={i + 2 <= handler?.sunburstStoreValue.depthHigh &&
              i + 2 > handler?.sunburstStoreValue.depthLow}
          >
          </div>
        {/each}
      </div>

      {#each [...Array(handler?.sunburstStoreValue.depthMax).keys()] as i}
        <div class='depth-box'
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

  <div class='tools'>

    <div class='tool-button'
      on:click={() => {handler?.appearanceClicked();}}
      class:shown={handler?.appearanceStoreValue.shown}
    >
      <span class='svg-icon icon-brush'>
        {@html iconBrush}
      </span>
      <span class='tool-name'>
        Appearance
      </span>
    </div>

    <div class='tool-button'>
      <span class='svg-icon icon-brush'>
        {@html iconStar}
      </span>
      <span class='tool-name'>
        Favorites
      </span>
    </div>

    <div class='tool-button'>
      <span class='svg-icon icon-brush'>
        {@html iconSearch}
      </span>
      <span class='tool-name'>
        Search
      </span>
    </div>

  </div>

</div>