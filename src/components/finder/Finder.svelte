<script lang='ts'>
  import {onMount} from 'svelte';
  import Sunburst from '../sunburst/Sunburst.svelte';

  onMount(() => {
    // console.log('mounted!');
  });

</script>

<style lang='scss'>
  @import './Finder.scss';
</style>

<div class='main-app'>

  <div class='finder-wrapper'>

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

      <div class='feature-list'>

      </div>

    </div>
  </div>

</div>