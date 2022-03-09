<script lang='ts'>
  import {onMount} from 'svelte';
  import Forager from '../forager/Forager.svelte';

  let component: HTMLElement | null = null;

  onMount(() => {
    // console.log('mounted!');
  });

</script>

<style lang='scss'>
  @import './Article.scss';
</style>

<div class='article-page'>
  <div class='main-app' bind:this={component}>
    <Forager />
  </div>
</div>
