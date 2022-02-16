<script lang='ts'>
  import {onMount} from 'svelte';

  onMount(() => {
    // console.log('mounted!');
  });

</script>

<style lang='scss'>
  @import './Sunburst.scss';
</style>

<div class='sunburst'>
  <svg class='sunburst-svg'></svg>
</div>