<script lang='ts'>
  import { onMount } from 'svelte';

  // Component variables
  let component: HTMLElement | null = null;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  $: mounted;
</script>

<style lang='scss'>
  @import './FeatureList.scss';
</style>

<div class='feature-list' bind:this={component}>
  <div class='header'>Appearance</div>
</div>