<script lang="ts">
  import { onMount } from 'svelte';
  import TimberTrek from '../timber/Timber.svelte';

  let component: HTMLElement | null = null;
</script>

<style lang="scss">
  @import '../../define';

  .notebook-page {
    width: 100vw;
    height: 100vh;
  }

  .main-app {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    box-sizing: border-box;
    overflow-x: hidden;
    position: relative;
  }
</style>

<div class="notebook-page">
  <div class="main-app" bind:this={component}>
    <TimberTrek notebookMode={true} />
  </div>
</div>
