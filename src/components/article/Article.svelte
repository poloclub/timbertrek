<script lang='ts'>
  import {onMount} from 'svelte';
  import Finder from '../finder/Finder.svelte';

  let component: HTMLElement | null = null;

  onMount(() => {
    // console.log('mounted!');
  });

</script>

<style lang='scss'>
  @import './Article.scss';
</style>

<div class='main-app' bind:this={component}>

  <Finder />

</div>