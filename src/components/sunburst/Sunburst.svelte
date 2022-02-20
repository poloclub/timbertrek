<script lang='ts'>
  import { initView } from './Sunburst';
  import { onMount } from 'svelte';

  let component: HTMLElement | null = null;
  export let data: object | null = null;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  $: data && mounted && component && initView(component, data);
</script>

<style lang='scss'>
  @import './Sunburst.scss';
</style>

<div class='sunburst' bind:this={component}>
  <svg class='sunburst-svg'></svg>
</div>