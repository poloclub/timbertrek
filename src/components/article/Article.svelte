<script lang="ts">
  import { onMount } from 'svelte';
  import TimberTrek from '../timber/Timber.svelte';

  let component: HTMLElement | null = null;

  onMount(() => {
    // console.log('mounted!');
  });
</script>

<style lang="scss">
  @import './Article.scss';
</style>

<div class="article-page">
  <div class="main-app" bind:this={component}>
    <TimberTrek />
  </div>
</div>
