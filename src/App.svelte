<svelte:head>

</svelte:head>

<script lang="ts">
  import Article from './components/article/Article.svelte';
</script>

<style lang='scss'>
  .stand-alone-page {
    color: #333;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
  }
</style>

<div class='stand-alone-page'>
	<Article />
</div>