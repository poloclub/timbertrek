<script lang="ts">
  import { onMount } from 'svelte';
  import { preProcessSVG } from '../../utils/utils';
  import iconGear from '../../imgs/icon-gear.svg?raw';
  import iconStar from '../../imgs/icon-star.svg?raw';
  import iconDepth from '../../imgs/icon-depth.svg?raw';

  // Component variables
  let component: HTMLElement | null = null;
  export let data: object | null = null;
  let mounted = false;
  let levelNum = 6;

  // Process SVG strings
  const processedIconDepth = iconDepth.replaceAll('black', 'currentcolor');

  onMount(() => {
    mounted = true;
  });

  $: data && mounted;
</script>

<style lang="scss">
  @import './Toolbar.scss';
</style>

<div class="toolbar" bind:this={component}>
  <div class="tools">
    <div class="svg-icon">
      {@html iconGear}
    </div>

    <div class="svg-icon">
      {@html iconStar}
    </div>
  </div>

  <div class="levels">
    <div class="svg-icon level-icon">
      {@html processedIconDepth}
    </div>

    {#each [...Array(levelNum).keys()] as i}
      <div class="level-box">
        {i + 1}
      </div>
    {/each}
  </div>
</div>
