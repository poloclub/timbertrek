<script lang='ts'>
  import { onMount } from 'svelte';
  import iconGear from '../../imgs/icon-gear.svg?raw';
  import iconStar from '../../imgs/icon-star.svg?raw';

  // Component variables
  let component: HTMLElement | null = null;
  export let data: object | null = null;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  $: data && mounted;
</script>

<style lang='scss'>
  @import './Toolbar.scss';
</style>

<div class='toolbar' bind:this={component}>
  <div class='levels'>
    Depths
  </div>

  <div class='tools'>
    <div class=svg-icon>
      {@html iconStar}
    </div>

    <div class=svg-icon>
      {@html iconGear}
    </div>
  </div>
</div>