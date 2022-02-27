<script lang='ts'>
  import { Sunburst } from './Sunburst';
  import { onMount } from 'svelte';
  import { config } from '../../config';

  // Component variables
  let component: HTMLElement | null = null;
  export let data: object | null = null;
  let mounted = false;

  // View variables
  const width = config.layout.sunburstWidth;
  const height = config.layout.sunburstWidth;
  let sunburst: Sunburst | null = null;

  onMount(() => {
    mounted = true;
  });

  const initView = () => {
    if (component && data) {
      sunburst = new Sunburst({ component, data, width, height });
    }

    console.log(sunburst);
  };

  $: data && mounted && component && initView();
</script>

<style lang='scss'>
  @import './Sunburst.scss';
</style>

<div class='sunburst' bind:this={component}>
  <svg class='sunburst-svg'></svg>
</div>