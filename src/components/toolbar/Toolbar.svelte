<script lang='ts'>
  import { onMount } from 'svelte';
  import { preProcessSVG } from '../../utils/utils';
  import iconBrush from '../../imgs/icon-brush.svg?raw';
  import iconSearch from '../../imgs/icon-search.svg?raw';
  import iconStar from '../../imgs/icon-star.svg?raw';
  import iconDepth from '../../imgs/icon-depth.svg?raw';

  // Component variables
  let component: HTMLElement | null = null;
  export let data: object | null = null;
  let mounted = false;
  let maxDepth = 6;

  // Process SVG strings
  const processedIconDepth = iconDepth.replaceAll('black', 'currentcolor');

  onMount(() => {
    mounted = true;
  });

  $: data && mounted;
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
      {#each [...Array(maxDepth).keys()] as i}
        <div class='depth-box'>
          {i + 1}
        </div>
      {/each}
    </div>
  </div>

  <div class='tools'>

    <div class='tool-button'>
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