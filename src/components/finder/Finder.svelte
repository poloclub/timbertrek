<script lang='ts'>
  import {onMount} from 'svelte';
  import Sunburst from '../sunburst/Sunburst.svelte';

  let component: HTMLElement | null = null;

  onMount(() => {
    // console.log('mounted!');
  });

</script>

<style lang='scss'>
  @import './Finder.scss';
</style>


<div class='finder' bind:this={component}>

  <div class='header'>

    <div class='logo'>
      <div class='logo-icon'>
        Tree Finder
      </div>
    </div>
  </div>

  <div class='content'>

    <div class='ring'>
      <Sunburst />
    </div>

    <!-- <div class='feature-list'>
    </div> -->

  </div>
</div>
