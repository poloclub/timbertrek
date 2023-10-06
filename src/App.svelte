<script lang="ts">
  import Article from './components/article/Article.svelte';
  import Notebook from './components/notebook/Notebook.svelte';

  export let mode = 'article';
</script>

<style lang="scss">
</style>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Lato&display=swap"
    rel="stylesheet"
  />
  <script
    type="module"
    src="https://unpkg.com/recommender-overlay/dist/recommender-overlay.es.js"
  ></script>
</svelte:head>

<div class="stand-alone-page">
  {#if mode === 'article'}
    <recommender-overlay
      my-brand="TimberTrek"
      position-left="20"
      display-delay="30000"
    />
    <Article />
  {:else}
    <Notebook />
  {/if}
</div>
