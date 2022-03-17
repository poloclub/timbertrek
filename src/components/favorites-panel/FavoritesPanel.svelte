<script lang="ts">
  import type { getFavoritesStore, FavoritesStoreValue } from 'src/stores';
  import { onMount } from 'svelte';

  // Component variables
  export let favoritesStore: ReturnType<typeof getFavoritesStore> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;
  let favoritesStoreValue: FavoritesStoreValue = {
    shown: false
  };

  onMount(() => {
    mounted = true;
  });

  const initView = () => {
    // Subscribe the store
    favoritesStore?.subscribe(value => {
      favoritesStoreValue = value;
    });
  };

  $: favoritesStore && initView();
</script>

<style lang="scss">
  @import './FavoritesPanel.scss';
</style>

<div
  class="favorites-panel"
  bind:this={component}
  class:shown={favoritesStoreValue.shown}
>
  <div class="header">My Favorites</div>
</div>
